//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "./IVault.sol";

/** Medium risk vault
 *
 * employs strategies like lending, borrowing and providing liquidity
 *
 * -50% to 50% ROI
 *
 * the "Market" contract will own this contract and call simulateLoss in bad market conditions
 */

contract MediumRiskVault is Ownable, ERC4626, IVault {
	constructor(
		IERC20 _asset
	) ERC4626(_asset) Ownable() ERC20("Low Risk Vault Token", "lvGLD") {}

	function simulateLoss(uint256 _amount) external override onlyOwner {
		require(
			_amount <= IERC20(asset()).balanceOf(address(this)),
			"Insufficient asset balance in medium risk vault to simulate loss"
		);
		IERC20(asset()).transfer(owner(), _amount);
	}
}
