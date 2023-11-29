//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// learn more: https://docs.openzeppelin.com/contracts/4.x/erc20

/** ERC20 token to deposit into the low, medium, and high risk vault
 * @title GoldToken
 *
 */

contract GoldToken is ERC20 {
	constructor() ERC20("Godl Token", "GODL") {
		// mint 1 billion GLD tokens to the deployer of this contract
		_mint(msg.sender, 1000000000 * 10 ** 18);
	}
}
