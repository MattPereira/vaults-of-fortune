//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IVault {
	function MAX_ROI() external view returns (int);

	function MIN_ROI() external view returns (int);

	function simulateLoss(uint256 amount) external;

	function totalAssets() external view returns (uint256);

	function maxWithdraw(address owner) external view returns (uint256);
}
