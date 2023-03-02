// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract regularMint is Ownable{
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

	mapping(uint256 => string) classes;
	mapping(uint256 => string) credits;

	function getCredits(uint256 _tokenId) external pure returns(string memory) {
		return "11450000000000000000";
	}
	
	function getClass(uint256 _tokenId) external view returns(string memory) {
		return classes[_tokenId];
	}

	function setClass(uint256 _tokenId, uint256 _classId) external onlyOwner {
		classes[_tokenId] = class[_classId];
	}
}
