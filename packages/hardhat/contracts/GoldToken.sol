//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// learn more: https://docs.openzeppelin.com/contracts/4.x/erc20

/** ERC20 token to deposit into the low, medium, and high risk vault
 * @title GoldToken
 *
 */

contract GoldToken is ERC20 {
	constructor() ERC20("Gold Token", "GLD") {
		// mint 1,000,000 GLD tokens to the deployer of this contract
		_mint(msg.sender, 1000000 * 10 ** 18);
	}
}
