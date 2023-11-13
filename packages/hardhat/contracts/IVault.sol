//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVault {
	function totalAssets() external view returns (uint256);

	function simulateLoss(uint256 amount) external;

	function MIN_ROI() external view returns (int);

	function MAX_ROI() external view returns (int);
}
