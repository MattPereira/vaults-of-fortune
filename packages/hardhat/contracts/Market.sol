//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "./IVault.sol";
import "./LowRiskVault.sol";
import "./MediumRiskVault.sol";
import "./HighRiskVault.sol";

/** Market Contract
 *
 * this contract holds 100k GLD tokens and distributes the tokens to the vaults
 * according to the results of the VRF Coordinator
 *
 * will also need automation to trigger the request for random numbers
 * at end of round timer. then use the fullfilRandomness function to
 * distribute the tokens to each vault accordingly
 */

contract Market is Ownable {
	IERC20 public token;
	IVault public lowRiskVault;
	IVault public mediumRiskVault;
	IVault public highRiskVault;

	constructor(
		address _token,
		address _lowRiskVault,
		address _mediumRiskVault,
		address _highRiskVault
	) {
		token = IERC20(_token);
		lowRiskVault = IVault(_lowRiskVault);
		mediumRiskVault = IVault(_mediumRiskVault);
		highRiskVault = IVault(_highRiskVault);
	}

	/** Function to handle contest entry
	 *
	 * sends 1,000 GLD tokens to the msg.sender
	 */

	function enterContest() external {
		token.transfer(msg.sender, 1000 * 10 ** 18);
	}
}
