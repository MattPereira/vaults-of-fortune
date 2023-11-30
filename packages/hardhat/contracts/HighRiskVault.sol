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
 *
 * @notice the "Market" contract will own this contract and call simulateLoss
 * when specific VRF conditions unfold
 *
 * @dev simulateLoss and resetVault are for the vaults of fortune game
 */

contract HighRiskVault is Ownable, ERC4626 {
	int public constant MIN_ROI = -100;
	int public constant MAX_ROI = 100;

	constructor(
		IERC20 _asset
	) ERC4626(_asset) Ownable() ERC20("High Risk Vault Token", "hvGODL") {}

	/**
	 * @param amount the amount of assets removed from this vault by market contract
	 */

	function simulateLoss(uint256 amount) external onlyOwner {
		require(
			amount <= IERC20(asset()).balanceOf(address(this)),
			"Insufficient asset balance in low risk vault to simulate loss"
		);
		IERC20(asset()).transfer(owner(), amount);
	}

	/**
	 * @dev burns a player's shares w/o sending them any assets
	 */

	function burnPlayerShares(
		address playerAddress,
		uint256 playerTotalShares
	) external onlyOwner {
		_burn(playerAddress, playerTotalShares);
	}

	/**
	 * @dev allows Market contract to drain assets from this vault
	 * to set starting conditions for new contest
	 */

	function drainAssets() external onlyOwner {
		IERC20(asset()).transfer(
			owner(),
			IERC20(asset()).balanceOf(address(this))
		);
	}
}
