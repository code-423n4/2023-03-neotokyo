// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
	@custom:benediction DEVS BENEDICAT ET PROTEGAT CONTRACTVS MEAM
	@title A Neo Tokyo S1 Identity testing contract.
	@author Tim Clancy <@_Enoch>

	This is a testing contract for specifying some particular properties of Neo 
	Tokyo S1 Identity items.

	@custom:date February 14th, 2023.
*/
contract IdentityMint is Ownable {

	/// An array of valid Neo Tokyo S1 Identity classes.
	string[] private class = [
		"Worker",
		"Grunt",
		"Assistant",
		"Driver",
		"Chat Support",
		"Builder",
		"Cook",
		"Bartender",
		"Corporate",
		"Punk",
		"Nerd",
		"Scavenger",
		"Officer",
		"Developer",
		"Club Promoter",
		"Chef",
		"Mercenary",
		"Samurai",
		"Tech Runner",
		"Cyberstreet Trader",
		"Club Owner",
		"NFT Artist",
		"Cyber Ninja",
		"Assassin",
		"Exectuive",
		"Tech Weapon Dealer",
		"Architect",
		"Wraith",
		"Slayer",
		"CEO",
		"Market Whale",
		"Day One Bitcoin Investor",
		"Celebrity",
		"Hand of Citadel"
	];

	/// A mapping from specific Identity token IDs to their classes.
	mapping ( uint256 => string ) public classes;

	/**
		Retrieve the class of an S1 Identity.

		@param _identityId The token ID of the S1 Identity to get the class for.

		@return _ The class of the Identity with token ID `_identityId`.
	*/
	function getClass (
		uint256 _identityId
	) external view returns (string memory) {
		return classes[_identityId];
	}

	/**
		This function allows the owner of this testing contract to set the class of
		a specific Identity.

		@param _identityId The token ID of the Identity to set a class on.
		@param _classId The index of a valid `class` to set.
	*/
	function setClass (
		uint256 _identityId,
		uint256 _classId
	) external onlyOwner {
		classes[_identityId] = class[_classId];
	}
}
