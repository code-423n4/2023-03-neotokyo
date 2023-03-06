// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
	@custom:benediction DEVS BENEDICAT ET PROTEGAT CONTRACTVS MEAM
	@title A simple ERC-20 token testing contract.
	@author Tim Clancy <@_Enoch>

	This is a testing contract for a potential BYTES 2.0 LP token.

	@custom:date February 14th, 2023.
*/
contract LPToken is Ownable, ERC20("LPToken", "LP") {

	/**
		This function allows the owner of this testing contract to mint some
		`_amount` of testing LP tokens to `_to`.

		@param _to The address to mint testing tokens to.
		@param _amount The amount of testing tokens to mint to `_to`.
	*/
	function mint (
		address _to,
		uint256 _amount
	) external onlyOwner {
		_mint(_to, _amount);
	}
}
