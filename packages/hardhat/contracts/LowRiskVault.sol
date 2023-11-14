//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

/** Low risk vault
 *
 * employs strategies like lending stablecoins and staking ETH
 *
 * 2 to 10% ROI
 */

contract LowRiskVault is ERC4626, Ownable {
	int public constant MIN_ROI = 2;
	int public constant MAX_ROI = 10;

	constructor(
		IERC20 _asset
	) ERC4626(_asset) Ownable() ERC20("Low Risk Vault Token", "lvGLD") {}

	function simulateLoss(uint256 amount) external onlyOwner {
		require(
			amount <= IERC20(asset()).balanceOf(address(this)),
			"Insufficient asset balance in low risk vault to simulate loss"
		);
		IERC20(asset()).transfer(owner(), amount);
	}
}
