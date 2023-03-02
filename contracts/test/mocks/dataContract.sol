// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.8;


contract dataContractMock {
    constructor() {
        
    }

    mapping(uint => uint256) rewardRates;
    mapping(uint => string) class;
    mapping(uint => string) uri;

    function calculateRewardRate(uint256 identityId, uint256 vaultId) external view returns(uint256) {
        return rewardRates[identityId];
    }
  
    function getCredits(uint256 identityId, uint256 vaultId) external view returns(uint256) {
        return rewardRates[identityId];
    }

    function setRewardRates(uint256 identityId, uint256 vaultId, uint256 rewardRate) external {
        rewardRates[identityId] = rewardRate;
    }

    function getClass(uint256 tokenId) external view returns (string memory) {
        return class[tokenId];
    }

    function setClass(uint256 tokenId, string memory _class) public{
        class[tokenId] = _class;
    }

    function generateURI(uint256 tokenId) external view returns (string memory) {
        return uri[tokenId];
    }


    function setUri(uint256 tokenId, string memory _uri) external {
        uri[tokenId] = _uri;
    }


}