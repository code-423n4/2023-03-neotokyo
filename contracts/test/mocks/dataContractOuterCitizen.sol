// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.8;


contract dataContractMockOuterCitizen {
    
    mapping(uint => string) uri;

    function generateURI(uint256 tokenId) external view returns (string memory) {
        return uri[tokenId];
    }


    function setUri(uint256 tokenId, string memory _uri) external {
        uri[tokenId] = _uri;
    }

}