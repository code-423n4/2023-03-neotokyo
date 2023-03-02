// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract boxMint is Ownable {
	string[] private creditMultiplier = [
		"Low",
		"Medium",
		"Medium High",
		"High",
		"Very High",
		"?"
	];

	string[] private creditYield = [
		"LOW",
		"Mid",
		"High",
		"Very High",
		"Excessive"
	];

	mapping(uint => string) creditMultipliers;
	mapping(uint256 => string) credits;
	mapping(uint256 => string) creditYields;

	function getCreditYield(uint256 tokenId) external view returns (string memory) {
		return creditYields[tokenId];
	}

	function getCreditProportionOfTotalSupply(uint256 _tokenId) external returns(string memory) {
	}

	function getCredits(uint256 _tokenId) external returns(string memory) {
		return "11450000000000000000";
	}

	function getAdditionalItem(uint256 _tokenId) external returns(string memory) {
	}

	function getCreditMultiplier(uint256 _tokenId) external view returns(string memory) {
		return creditMultipliers[_tokenId];
	}

	function setCreditMultiplier(uint256 _tokenId, uint256 _creditId) external onlyOwner{
		creditMultipliers[_tokenId] = creditMultiplier[_creditId];
	}

	function setCreditYield(uint256 _tokenId, uint256 _creditId) external onlyOwner{
		creditYields[_tokenId] = creditYield[_creditId];
	}
}
