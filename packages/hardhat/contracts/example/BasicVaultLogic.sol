//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/** Vault tutorial
 * @author Smart Contract Programmer
 * @notice https://www.youtube.com/watch?v=HHoa0c3AOqo&t=8s
 */

contract BasicVaultLogic {
	IERC20 public immutable token;

	uint public totalSupply;
	mapping(address => uint) public balanceOf;

	constructor(address _token) {
		token = IERC20(_token);
	}

	function _mint(address _to, uint _amount) private {
		totalSupply += _amount;
		balanceOf[_to] += _amount;
	}

	function _burn(address _from, uint _amount) private {
		totalSupply -= _amount;
		balanceOf[_from] -= _amount;
	}

	/** Allows a user to deposit tokens into the vault.
	 *
	 * a = amount
	 * B = balance of token before deposit
	 * T = total supply
	 * s = shares to mint
	 * (T + s) / T = (B + a) / B
	 * s = aT / B
	 */

	function deposit(uint _amount) external {
		uint shares;
		if (totalSupply == 0) {
			shares = _amount;
		} else {
			shares = (_amount * totalSupply) / token.balanceOf(address(this));
		}

		_mint(msg.sender, shares);
		token.transferFrom(msg.sender, address(this), _amount);
	}

	/** Allows a user to withdraw tokens from the vault.
	 *
	 * a = amount
	 * B = balance of token before withdraw
	 * T = total supply
	 * s = shares to burn
	 * (T - s) / T = (B - a) / B
	 * a = sB / T
	 */

	function withdraw(uint _shares) external {
		uint amount = (_shares * token.balanceOf(address(this))) / totalSupply;
		_burn(msg.sender, _shares);
		token.transfer(msg.sender, amount);
	}
}
