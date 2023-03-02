// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract lpToken is Ownable, ERC20("LpToken", "LP") {
	function mint (address _to, uint256 _amount) external onlyOwner {
		_mint(_to, _amount);
	}
}
