//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

// import "./IVault.sol";

/** High risk vault
 *
 * employs strategies like liquidity mining and leveraged trading
 *
 * -100% to 100% ROI
 */

contract HighRiskVault is Ownable, ERC4626 {
	int public constant MIN_ROI = -100;
	int public constant MAX_ROI = 100;

	constructor(
		IERC20 _asset
	) ERC4626(_asset) Ownable() ERC20("Low Risk Vault Token", "lvGLD") {}

	function simulateLoss(uint256 _amount) external onlyOwner {
		require(
			_amount <= IERC20(asset()).balanceOf(address(this)),
			"Insufficient asset balance in high risk vault to simulate loss"
		);
		IERC20(asset()).transfer(owner(), _amount);
	}
}
