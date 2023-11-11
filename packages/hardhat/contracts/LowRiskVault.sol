//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
	uint public constant MINIMUM_ROI_PERCENTAGE = 2;
	uint public constant MAXIMUM_ROI_PERCENTAGE = 10;

	constructor(
		IERC20 _asset
	) ERC4626(_asset) Ownable() ERC20("Low Risk Vault Token", "lvGLD") {}
}
