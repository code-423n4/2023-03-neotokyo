// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
	@custom:benediction DEVS BENEDICAT ET PROTEGAT CONTRACTVS MEAM
	@title A Neo Tokyo S1 Vault testing contract.
	@author Tim Clancy <@_Enoch>

	This is a testing contract for specifying some particular properties of Neo 
	Tokyo S1 Vault items.

	@custom:date February 14th, 2023.
*/
contract VaultMint is Ownable {

	/// Record all valid Vault credit multiplier values.
	string[] private creditMultiplier = [
		"Low",
		"Medium",
		"Medium High",
		"High",
		"Very High",
		"?"
	];

	/// Map Vault token IDs to a valid credit multiplier.
	mapping ( uint256 => string ) public creditMultipliers;

	/**
		This function retrieves the specified credit multiplier string of a
		particular Vault.

		@param _tokenId The token ID of the Vault to retrieve a credit multiplier.
		
		@return _ The credit multiplier of `_tokenId`.
	*/
	function getCreditMultiplier (
		uint256 _tokenId
	) external view returns (string memory) {
		return creditMultipliers[_tokenId];
	}

	/**
		This function allows the owner of this testing contract to set the credit
		multiplier of a specific Vault.

		@param _tokenId The token ID of the Vault to set a credit multiplier on.
		@param _creditId The index of a valid `creditMultiplier` to set.
	*/
	function setCreditMultiplier (
		uint256 _tokenId,
		uint256 _creditId
	) external onlyOwner {
		creditMultipliers[_tokenId] = creditMultiplier[_creditId];
	}
}
