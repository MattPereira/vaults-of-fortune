//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

import "./IVault.sol";

/** Market Contract
 *
 * this contract holds a bajillion GLD tokens and distributes the tokens to the vaults
 * according to the results of the VRF Coordinator
 *
 * will also need automation to trigger the request for random numbers
 * at end of round timer. then use the fullfilRandomness function to
 * distribute the tokens to each vault accordingly
 *
 * Each contest has 3 rounds
 * contestants allocate their GLD tokens into the vaults and get a return on investment
 * at the end of each round
 *
 *
 * @notice the rounds array is used to keep track of the current round
 * round number is index + 1 and after the 3rd round the array is cleared
 *
 * @notice use events to emit info necessary for leaderboard
 *
 */

error Market__UpkeepNotNeeded();

contract Market is VRFConsumerBaseV2, AutomationCompatibleInterface, Ownable {
	enum RoundState {
		OPEN, // 0
		CALCULATING, // 1
		CLOSED // 2
	}

	struct Round {
		RoundState state;
		uint256 number;
	}

	Round currentRound;
	IERC20 public token;
	IVault public lowRiskVault;
	IVault public mediumRiskVault;
	IVault public highRiskVault;
	uint256 public roundInterval = 90 seconds;
	uint256 public lastTimestamp;
	address[] public players;

	// VRF variables
	VRFCoordinatorV2Interface public vrfCoordinator;
	uint16 public requestConfirmations = 3; // min # of blocks until oracle responds
	uint32 public numWords = 3; // how many random values
	uint32 public callbackGasLimit; // for fulfillRandomWords
	uint64 public subscriptionId; // for funding requests
	bytes32 public keyHash; // max gas price to pay for request in wei

	/**
	 * @notice round set to 1 and state set to CLOSED to prevent trigger of upkeep
	 */

	constructor(
		address _token,
		address _lowRiskVault,
		address _mediumRiskVault,
		address _highRiskVault,
		address _vrfCoordinator,
		uint32 _callbackGasLimit,
		uint64 _subscriptionId,
		bytes32 _keyHash
	) {
		token = IERC20(_token);
		lowRiskVault = IVault(_lowRiskVault);
		mediumRiskVault = IVault(_mediumRiskVault);
		highRiskVault = IVault(_highRiskVault);
		currentRound.state = RoundState.CLOSED;
		currentRound.number = 1;

		vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
		subscriptionId = _subscriptionId;
		callbackGasLimit = _callbackGasLimit;
		keyHash = _keyHash;
	}

	/** Function to handle contest entry
	 * @notice msg.sender must have 0 GLD tokens to enter
	 * @notice sends 1,000 GLD tokens to the msg.sender
	 * @notice resets the countdown interval to give contestants time to allocate tokens
	 * @notice flips the round state to OPEN if the round is CLOSED (i.e. first contestant)
	 */

	function enterContest() external {
		require(
			token.balanceOf(msg.sender) == 0,
			"Please return GLD tokens to market before entering a new contest"
		);

		require(currentRound.number == 1, "Contest is already in progress");
		if (currentRound.state == RoundState.CLOSED) {
			currentRound.state = RoundState.OPEN;
		}

		players.push(msg.sender);
		token.transfer(msg.sender, 1000 * 10 ** 18);
		lastTimestamp = block.timestamp;
	}

	/** Chainlink Keeper nodes call this function to determine if upkeep is needed
	 *
	 *  The following should be true in order to return true:
	 * 	1. Most recent contest is open
	 *  2. Most recent contest has players
	 *  3. Most recent round is open
	 *  4. Time interval has passed since last contestant entry
	 */

	function checkUpkeep(
		bytes memory /* checkData */
	)
		public
		override
		returns (bool upkeepNeeded, bytes memory /* performData */)
	{
		bool roundOpen = currentRound.state == RoundState.OPEN;
		bool timePassed = (block.timestamp - lastTimestamp) > roundInterval;
		bool hasPlayers = (players.length > 0);
		upkeepNeeded = (roundOpen && timePassed && hasPlayers);
		return (upkeepNeeded, "0x0");
	}

	/** Once `checkUpkeep` returns true, this function triggers
	 *
	 * 1. flip the round state to CALCULATING
	 * 2. request a random number from the VRF Coordinator
	 * 3. emit some events?
	 */
	function performUpkeep(bytes calldata /* performData */) external override {
		(bool upkeepNeeded, ) = checkUpkeep(bytes(""));
		if (!upkeepNeeded) {
			revert Market__UpkeepNotNeeded();
		}

		currentRound.state = RoundState.CALCULATING;
		// Will revert if subscription is not set and funded.
		uint256 requestId = vrfCoordinator.requestRandomWords(
			keyHash,
			subscriptionId,
			requestConfirmations,
			callbackGasLimit,
			numWords
		);
	}

	/** Triggered by the VRF Coordinator that gets triggered by performUpkeep
	 *
	 * TODO: figure out how to use random value to distribute and take assets from vaults
	 * @notice how to use uint256 to decide if vault should lose assets
	 *
	 * 1. Distribute/Take tokens to/from the vaults according to random numbers provided by VRF
	 * 4. Update the lastTimestamp to the current block.timestamp to start the countdown for the next round
	 * 5. Manage the round state (increment and set to OPEN if < 3, otherwise set to CLOSED)
	 * 6. emit event that uses vault contracts to sum total assets each player has
	 */

	function fulfillRandomWords(
		uint256,
		/* requestId */ uint256[] memory randomWords
	) internal override {
		manageLowRiskVault(randomWords[0]);
		manageMediumRiskVault(randomWords[1]);
		manageHighRiskVault(randomWords[2]);

		if (currentRound.number < 3) {
			// increment round and open it so upkeep can be triggered again
			currentRound.number += 1;
			currentRound.state = RoundState.OPEN;
		} else {
			// reset to round 1 and close it so upkeep won't be triggered
			currentRound.number = 1;
			currentRound.state = RoundState.CLOSED;
		}

		lastTimestamp = block.timestamp;
	}

	function manageLowRiskVault(uint256 randomNumber) internal {
		uint256 lowRiskReturnPercentage = randomNumber %
			uint(
				lowRiskVault.MAXIMUM_ROI_PERCENTAGE() -
					lowRiskVault.MINIMUM_ROI_PERCENTAGE() +
					lowRiskVault.MINIMUM_ROI_PERCENTAGE()
			);

		uint256 lowRiskTransferAmount = (lowRiskVault.totalAssets() *
			lowRiskReturnPercentage) / 100;

		token.transfer(address(lowRiskVault), lowRiskTransferAmount);
	}

	function manageMediumRiskVault(uint256 randomNumber) internal {
		uint256 range = mediumRiskVault.MAXIMUM_ROI_PERCENTAGE() -
			mediumRiskVault.MINIMUM_ROI_PERCENTAGE();
		uint256 normalizedRandomNumber = randomNumber % (range + 1);

		int256 returnPercentage = int256(normalizedRandomNumber) +
			mediumRiskVault.MINIMUM_ROI_PERCENTAGE();
		int256 assetChange = (int256(mediumRiskVault.totalAssets()) *
			returnPercentage) / 100;
		if (assetChange < 0) {
			mediumRiskVault.simulateLoss(uint256(-assetChange));
		} else {
			token.transfer(address(mediumRiskVault), uint256(assetChange));
		}
	}

	function manageHighRiskVault(uint256 randomNumber) internal {
		uint256 normalizedRandomNumber = randomNumber % 201;
		int256 returnPercentage = int256(normalizedRandomNumber) - 100;
		int256 assetChange = (int256(highRiskVault.totalAssets()) *
			returnPercentage) / 100;
		if (assetChange < 0) {
			highRiskVault.simulateLoss(uint256(-assetChange));
		} else {
			token.transfer(address(highRiskVault), uint256(assetChange));
		}
	}
}
