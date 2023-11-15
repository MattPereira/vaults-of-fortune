//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

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
 */

error Market__UpkeepNotNeeded();

contract Market is VRFConsumerBaseV2, AutomationCompatibleInterface, Ownable {
	enum RoundState {
		OPEN,
		CALCULATING,
		CLOSED
	}

	struct Round {
		RoundState state;
		uint256 number;
	}

	struct Contest {
		uint256 number;
	}

	Round public currentRound;
	Contest public currentContest;
	IERC20 public token;
	IVault public lowRiskVault;
	IVault public mediumRiskVault;
	IVault public highRiskVault;
	uint256 public roundInterval = 99 seconds;
	uint256 public lastTimestamp;
	address[] public players;
	uint256 public constant STARTING_AMOUNT = 10000 * 10 ** 18; // 10,000 GLD tokens

	// VRF requirements
	VRFCoordinatorV2Interface public vrfCoordinator;
	bytes32 public keyHash; // max gas price to pay for request in wei
	uint64 public subscriptionId; // for funding requests
	uint16 public requestConfirmations; // min # of blocks until oracle responds
	uint32 public callbackGasLimit; // for fulfillRandomWords
	uint32 public numWords = 3; // how many random values

	// EVENTS
	event RoundOpen(uint256 indexed roundNumber);
	event RoundResults(
		uint256 contestNumber,
		uint256 roundNumber,
		int256 indexed lowRiskVaultROI,
		int256 indexed mediumRiskVaultROI,
		int256 indexed highRiskVaultROI
	);

	constructor(
		address _token,
		address _lowRiskVault,
		address _mediumRiskVault,
		address _highRiskVault,
		address _vrfCoordinator,
		bytes32 _keyHash,
		uint64 _subscriptionId,
		uint16 _requestConfirmations,
		uint32 _callbackGasLimit
	) VRFConsumerBaseV2(_vrfCoordinator) {
		// contest contracts
		token = IERC20(_token);
		lowRiskVault = IVault(_lowRiskVault);
		mediumRiskVault = IVault(_mediumRiskVault);
		highRiskVault = IVault(_highRiskVault);
		// prevents upkeep from triggering
		currentRound.state = RoundState.CLOSED;
		currentRound.number = 1;
		currentContest.number = 1;
		// VRF requirements
		vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
		keyHash = _keyHash;
		subscriptionId = _subscriptionId;
		requestConfirmations = _requestConfirmations;
		callbackGasLimit = _callbackGasLimit;
	}

	/** Handles contest entry
	 * @notice msg.sender must have 0 GLD tokens to enter
	 */

	function enterContest() external {
		require(
			token.balanceOf(msg.sender) == 0,
			"Please return your GLD tokens to market contract before entering a new contest"
		);

		players.push(msg.sender);
		token.transfer(msg.sender, STARTING_AMOUNT);
	}

	/** Handles starting round which allows for upkeep to be triggered
	 */

	function startRound() external onlyOwner {
		currentRound.state = RoundState.OPEN;
		lastTimestamp = block.timestamp;
		emit RoundOpen(currentRound.number); // listening for this event to reset countdown timer on frontend
	}

	/** Handles reseting state so a new contest can begin
	 * 1. clear players array to allow for a new contest to begin
	 * 2. reset the currentRound to 1
	 * 3. send GLD from vaults to market contract
	 */

	function resetContest() external onlyOwner {
		// increment contest number
		currentContest.number += 1;
		// reset the round
		currentRound.number = 1;
		currentRound.state = RoundState.CLOSED;
		// reset the players array
		players = new address[](0);
		// pull the gold from the vaults back into market contract
		lowRiskVault.simulateLoss(lowRiskVault.totalAssets());
		mediumRiskVault.simulateLoss(mediumRiskVault.totalAssets());
		highRiskVault.simulateLoss(highRiskVault.totalAssets());
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
		view
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
	 * 2. request random numbers from the VRF Coordinator
	 */

	function performUpkeep(bytes calldata /* performData */) external override {
		(bool upkeepNeeded, ) = checkUpkeep(bytes(""));
		if (!upkeepNeeded) {
			revert Market__UpkeepNotNeeded();
		}

		currentRound.state = RoundState.CALCULATING;

		// Will revert if subscription is not set and funded.
		vrfCoordinator.requestRandomWords(
			keyHash,
			subscriptionId,
			requestConfirmations,
			callbackGasLimit,
			numWords
		);
	}

	/** Triggered by the VRF Coordinator that gets triggered by performUpkeep
	 *
	 * 1. Distribute/Take tokens to/from the vaults according to random numbers provided by VRF
	 * 2. Emit event that uses vault contracts to sum total assets each player has
	 * 3. Manage the round state (increment and set to OPEN if < 3, otherwise set to CLOSED)
	 * 4. Update the lastTimestamp to the current block.timestamp to start the countdown for the next round
	 */

	function fulfillRandomWords(
		uint256 /* requestId */,
		uint256[] memory randomWords
	) internal override {
		int256 lowVaultROI = manageVault(lowRiskVault, randomWords[0]);
		int256 mediumVaultROI = manageVault(mediumRiskVault, randomWords[1]);
		int256 highVaultROI = manageVault(highRiskVault, randomWords[2]);

		emit RoundResults(
			currentContest.number,
			currentRound.number,
			lowVaultROI,
			mediumVaultROI,
			highVaultROI
		);

		if (currentRound.number < 3) {
			currentRound.number += 1;
		}

		currentRound.state = RoundState.CLOSED;
	}

	/** Uses random value to distribute/take tokens to/from the vaults
	 * @param vault low, medium, or high risk
	 * @param randomNumber from VRF
	 *
	 * @notice comments inside function are example values for medium risk vault
	 */

	function manageVault(
		IVault vault,
		uint256 randomNumber
	) public returns (int256) {
		uint256 spread = calculateSpread(vault.MAX_ROI(), vault.MIN_ROI()); // 100
		uint256 normalizedRandomNumber = randomNumber % (spread + 1); // 0 to 100
		int256 roiPercentage = int256(normalizedRandomNumber) + vault.MIN_ROI(); // -50 to 50

		uint256 assetChangeAmount = (vault.totalAssets() * abs(roiPercentage)) /
			100;

		if (roiPercentage < 0) {
			vault.simulateLoss(assetChangeAmount);
		} else {
			token.transfer(address(vault), uint256(assetChangeAmount));
		}

		return roiPercentage;
	}

	/** Helper function to get absolute value of int256
	 * @param x the int256 to get the absolute value of
	 */

	function abs(int256 x) internal pure returns (uint256) {
		return uint256(x >= 0 ? x : -x);
	}

	/** Helper function to calculate the spread between two int256
	 * @param a the first int256
	 * @param b the second int256
	 */

	function calculateSpread(int256 a, int256 b) public pure returns (uint256) {
		if (a > b) {
			return (uint256(a - b));
		} else {
			return uint256(b - a);
		}
	}

	// Getters
	function getCurrentRoundNumber() public view returns (uint256) {
		return currentRound.number;
	}

	function getCurrentRoundState() public view returns (RoundState) {
		return currentRound.state;
	}

	function getPlayers() public view returns (address[] memory) {
		return players;
	}
}
