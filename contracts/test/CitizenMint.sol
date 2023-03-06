// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
	@custom:benediction DEVS BENEDICAT ET PROTEGAT CONTRACTVS MEAM
	@title A Neo Tokyo S1 Citizen testing contract.
	@author Tim Clancy <@_Enoch>

	This is a testing contract for specifying some particular properties of Neo 
	Tokyo S1 Citizen items.

	@custom:date February 14th, 2023.
*/
contract CitizenMint is Ownable {

	/// A mapping from specific Citizen token IDs to their reward rates.
	mapping ( uint256 => uint256 ) public rewardRates;

	/**
		This function typically calculates the reward rate of a Neo Tokyo S1 Citizen
		as a function of its Identity token ID and Vault token ID. This testing
		function overrides that functionality to allow the contract owner to
		directly set the final reward rate of a Citizen given its Identity ID
		without using a Vault ID.

		@param _identityId The token ID of the Neo Tokyo S1 Citizen's component
			Identity.

		@return _ The final reward rate of this Neo Tokyo S1 Citizen.
	*/
	function calculateRewardRate (
		uint256 _identityId,
		uint256
	) external view returns (uint256) {
		return rewardRates[_identityId];
	}

	/**
		This function allows the owner of this testing contract to directly set the reward rates of a given Neo Tokyo S1 Citizen using its Identity ID.

		@param _identityId The token ID of a Neo Tokyo S1 Citizen's component
			Identity to set the reward rate of.
		@param _rewardRate The reward rate to set for the Citizen.
	*/
	function setRewardRates (
		uint256 _identityId,
		uint256 _rewardRate
	) external onlyOwner {
		rewardRates[_identityId] = _rewardRate;
	}
}
