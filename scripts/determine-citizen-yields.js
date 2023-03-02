'use strict';

// Configure environment variables.
import 'dotenv/config';

// Parsing out environment variables.
const NETWORK = 'mainnet';
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const S1_CITIZEN_ADDRESS = '0xb668beB1Fa440F6cF2Da0399f8C28caB993Bdd65';
const S1_VAULT_ADDRESS = '0xab0b0dD7e4EaB0F9e31a539074a03f1C1Be80879';
const S1_IDENTITY_ADDRESS = '0x86357A19E5537A8Fba9A004E555713BC943a66C0';

// Imports.
import { ethers } from 'ethers';
import fetch from 'node-fetch';

// Import the contract ABIs.
const CITIZEN_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "citizenId",
				"type": "uint256"
			}
		],
		"name": "getRewardRateOfTokenId",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "citizenId",
				"type": "uint256"
			}
		],
		"name": "getVaultIdOfTokenId",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "citizenId",
				"type": "uint256"
			}
		],
		"name": "getIdentityIdOfTokenId",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
const VAULT_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "getCreditMultiplier",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
const IDENTITY_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "tokenURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

/**
	A helper function to sleep with some delay.

	@param _ms The number of milliseconds to sleep.
*/
function sleep (_ms) {
	return new Promise(resolve => setTimeout(resolve, _ms));
}

/**
	Constantly monitor and update the images of staked and listed items.
*/
async function main() {
	console.log(`Determining S1 Citizen Identity Credit Yields ...`);

	// Create an Ethereum provider.
	const provider = new ethers.providers.InfuraProvider(
		NETWORK,
		INFURA_PROJECT_ID
	);

	// Deduce the Identity credit rate of each S1 Citizen.
	const citizenCount = 3120;
	const citizen = new ethers.Contract(
		S1_CITIZEN_ADDRESS,
		CITIZEN_ABI,
		provider
	);
	const vault = new ethers.Contract(
		S1_VAULT_ADDRESS,
		VAULT_ABI,
		provider
	);
	const identity = new ethers.Contract(
		S1_IDENTITY_ADDRESS,
		IDENTITY_ABI,
		provider
	);
	for (let i = 0; i < citizenCount; i++) {
		try {
			const rewardRate = await citizen.getRewardRateOfTokenId(i);
			const vaultId = await citizen.getVaultIdOfTokenId(i);
			const identityId = await citizen.getIdentityIdOfTokenId(i);

			let multiplier = '';
			try {
				multiplier = await vault.getCreditMultiplier(vaultId);
			} catch (_) { }

			const identityUri = await identity.tokenURI(identityId);

			// 29 = length of `data:application/json;base64,`
			const metadata = JSON.parse(
				Buffer.from(identityUri.substring(29), 'base64').toString()
			);
			const creditYield = metadata.attributes.find(
				x => x.trait_type === 'Credit Yield'
			).value;
			console.log(
				`${i},${rewardRate.toString()},${multiplier.toString()},${creditYield}`
			);
		} catch (_) { }
	}
}

// Execute the script and catch errors.
main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
