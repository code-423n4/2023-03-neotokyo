'use strict';

// Configure environment variables.
require('dotenv').config();

// Include Babel so that we may use some newer JavaScript syntax.
require('@babel/register');

// Include Waffle with Ethers as our preferred engine for testing.
require('@nomiclabs/hardhat-waffle');

// Include the detailed gas usage reporter for tests.
require('hardhat-gas-reporter');

// Include the contract size output display.
require('hardhat-contract-sizer');

// Include coverage checking for unit tests.
require('solidity-coverage');

// Include the Etherscan contract verifier.
require('@nomiclabs/hardhat-etherscan');

// Export a configuration for Hardhat to use when working with our contracts.
module.exports = {
	solidity: {
		compilers: [
			{
				version: '0.8.11',
				settings: {
					optimizer: {
						enabled: true,
						runs: 200, 
						details: {
							yul: true 
						}
					}
				}
			},
			{
				version: '0.8.19',
				settings: {
					optimizer: {
						enabled: true,
						runs: 200, 
						details: {
							yul: true 
						}
					}
				}
			}
		]
	},
	gasReporter: {
		excludeContracts: [
			'ERC20',
			'ERC721',
			'beckLoot',
			'IdentityMint',
			'vaultBox',
			'VaultMint',
			'NTItems',
			'NTLandDeploy',
			'BYTESContract',
			'NTBytesBridge',
			'NTCitizenDeploy',
			'CitizenMint',
			'NTOuterIdentity',
			'NTS2Items',
			'NTS2LandDeploy',
			'NTOuterCitizenDeploy',
			'LPToken'
		]
	},
	contractSizer: {
		alphaSort: true,
		disambiguatePaths: false,
		only: [
			'BYTES2',
			'NeoTokyoStaker'
		],
		runOnCompile: true
	}
};
