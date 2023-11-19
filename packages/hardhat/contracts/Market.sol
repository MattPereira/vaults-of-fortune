//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

import "./IVault.sol";

/** Market contract that orchestrates a contest consisting of three rounds
 *
 * @dev chainlink automation triggers the start of a new round when
 * 3 minutes time has elapsed since the end of the last round OR 1/2 of the players hit "ready" button
 *
 * @dev during each round contestants allocate their GLD tokens into the vaults in hopes of positive ROI
 *
 * @dev this contract distributes the tokens to the vaults according to the results of the VRF Coordinator
 * at the end of each round
 *
 * @dev on deployment, default state of contest and round is OPEN, but VRF not triggered until players enter
 */

error Market__UpkeepNotNeeded();

contract Market is VRFConsumerBaseV2, AutomationCompatibleInterface, Ownable {
	enum RoundState {
		OPEN,
		CLOSING,
		CALCULATING,
		CLOSED
	}

	enum ContestState {
		OPEN,
		CLOSED
	}

	struct Round {
		uint256 number;
		RoundState state;
	}

	struct Contest {
		uint256 number;
		ContestState state;
	}

	Round public currentRound;
	Contest public currentContest;
	IERC20 public token;
	IVault public lowRiskVault;
	IVault public mediumRiskVault;
	IVault public highRiskVault;
	uint256 public roundInterval = 30 seconds;
	uint256 public lastTimestamp;
	address[] public players;
	uint256 public constant STARTING_AMOUNT = 10000 * 10 ** 18; // 10,000 GLD tokens
	mapping(address => bool) playerReady; // player address => ready (true/false)

	// VRF requirements
	VRFCoordinatorV2Interface public vrfCoordinator;
	bytes32 public keyHash; // max gas price to pay for request in wei
	uint64 public subscriptionId; // for funding requests
	uint16 public requestConfirmations; // min # of blocks until oracle responds
	uint32 public callbackGasLimit; // for fulfillRandomWords
	uint32 public numWords = 3; // how many random values

	// EVENTS
	event RoundStart(uint256 indexed roundNumber);
	event RoundClosing(uint256 indexed roundNumber);
	event RoundROIResults(
		uint256 indexed contestNumber,
		uint256 indexed roundNumber,
		int256 lowRiskVaultROI,
		int256 mediumRiskVaultROI,
		int256 highRiskVaultROI
	);
	event PlayerTotalAssetUpdate(
		uint256 indexed contestNumber,
		uint256 indexed roundNumber,
		address indexed player,
		uint256 totalAssets
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
		// contest requirements
		token = IERC20(_token);
		lowRiskVault = IVault(_lowRiskVault);
		mediumRiskVault = IVault(_mediumRiskVault);
		highRiskVault = IVault(_highRiskVault);
		currentRound.number = 1;
		currentRound.state = RoundState.OPEN;
		currentContest.number = 1;
		currentContest.state = ContestState.OPEN;
		// VRF requirements
		vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
		keyHash = _keyHash;
		subscriptionId = _subscriptionId;
		requestConfirmations = _requestConfirmations;
		callbackGasLimit = _callbackGasLimit;
	}

	/** Handles contest entry
	 *
	 * @notice msg.sender must have 0 GLD tokens to enter
	 * @dev resets the lastTimestamp so round end won't trigger until 3 minutes after last entry
	 */

	function enterContest() external {
		require(
			currentContest.state == ContestState.OPEN,
			"Contest is not open"
		);
		require(
			token.balanceOf(msg.sender) == 0,
			"Please return your GLD tokens to market contract before entering a new contest"
		);

		players.push(msg.sender);
		token.transfer(msg.sender, STARTING_AMOUNT);

		emit PlayerTotalAssetUpdate(
			currentContest.number,
			currentRound.number,
			msg.sender,
			STARTING_AMOUNT
		);
	}

	/** Handles reseting state so a new contest can begin
	 * 1. clear players array to allow for a new contest to begin
	 * 2. reset the currentRound to 1
	 * 3. send GLD from vaults to market contract
	 */

	function resetContest() external onlyOwner {
		// increment contest number
		currentContest.number += 1;
		currentContest.state = ContestState.OPEN;
		// reset the round
		currentRound.number = 1;
		currentRound.state = RoundState.OPEN;
		// reset the players array
		players = new address[](0);
		// pull the gold from the vaults back into market contract
		lowRiskVault.simulateLoss(lowRiskVault.totalAssets());
		mediumRiskVault.simulateLoss(mediumRiskVault.totalAssets());
		highRiskVault.simulateLoss(highRiskVault.totalAssets());
	}

	/** Check if address is a player in the current contest
	 * @param addr the address to check
	 */

	function isPlayer(address addr) public view returns (bool) {
		for (uint i = 0; i < players.length; i++) {
			if (players[i] == addr) {
				return true;
			}
		}
		return false;
	}

	/** Start countdown timer to end the round
	 * @notice caller's GLD balance must be fully allocated in vaults
	 */

	function startCountdown() external {
		require(
			isPlayer(msg.sender),
			"Only active players can start the countdown"
		);
		require(
			currentRound.state == RoundState.OPEN,
			"Current round must be open to start the countdown"
		);
		require(
			token.balanceOf(msg.sender) == 0,
			"Your GLD must be fully allocated in order to start the countdown"
		);

		currentRound.state = RoundState.CLOSING;
		lastTimestamp = block.timestamp;
		emit RoundClosing(currentRound.number);
	}

	/** Chainlink Keeper nodes call this function to determine if upkeep is needed
	 *
	 *  The following should be true in order to return true:
	 * 	1. contest is open
	 * 	2. round is in CLOSING state
	 * 	3. 60 seconds have passed since lastTimestamp
	 *
	 */

	function checkUpkeep(
		bytes memory /* checkData */
	)
		public
		view
		override
		returns (bool upkeepNeeded, bytes memory /* performData */)
	{
		bool contestOpen = currentContest.state == ContestState.OPEN;
		bool roundClosing = currentRound.state == RoundState.CLOSING;
		bool timePassed = (block.timestamp - lastTimestamp) > roundInterval;

		upkeepNeeded = (contestOpen && roundClosing && timePassed);
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

		emit RoundROIResults(
			currentContest.number,
			currentRound.number,
			lowVaultROI,
			mediumVaultROI,
			highVaultROI
		);

		// emit event with each players updated total assets
		for (uint i = 0; i < players.length; i++) {
			address player = players[i];
			uint256 totalAssets = lowRiskVault.maxWithdraw(player) +
				mediumRiskVault.maxWithdraw(player) +
				highRiskVault.maxWithdraw(player) +
				token.balanceOf(player);
			emit PlayerTotalAssetUpdate(
				currentContest.number,
				currentRound.number,
				player,
				totalAssets
			);
		}

		// reset all players ready status
		for (uint i = 0; i < players.length; i++) {
			if (playerReady[players[i]]) {
				playerReady[players[i]] = false;
			}
		}

		if (currentRound.number < 3) {
			// prepare for next round
			currentRound.number += 1;
			currentRound.state = RoundState.OPEN;
			lastTimestamp = block.timestamp;
			emit RoundStart(currentRound.number);
		} else {
			// ends the contest
			currentRound.state = RoundState.CLOSED;
			currentContest.state = ContestState.CLOSED;
		}
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
	function getCurrentContestNumber() public view returns (uint256) {
		return currentContest.number;
	}

	function getCurrentContestState() public view returns (ContestState) {
		return currentContest.state;
	}

	function getCurrentRoundNumber() public view returns (uint256) {
		return currentRound.number;
	}

	function getCurrentRoundState() public view returns (RoundState) {
		return currentRound.state;
	}

	function getPlayers() public view returns (address[] memory) {
		return players;
	}

	function getRoundTimeRemaining() public view returns (uint256) {
		if (block.timestamp >= lastTimestamp) {
			uint256 timeElapsed = block.timestamp - lastTimestamp;
			if (timeElapsed < roundInterval) {
				return roundInterval - timeElapsed;
			} else {
				return 0;
			}
		} else {
			return roundInterval;
		}
	}
}
