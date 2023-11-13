//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVault {
	function totalAssets() external view returns (uint256);

	function simulateLoss(uint256 lossAmount) external;

	function MINIMUM_ROI_PERCENTAGE() external view returns (int);

	function MAXIMUM_ROI_PERCENTAGE() external view returns (int);
}
