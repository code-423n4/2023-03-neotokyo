import { ethers } from 'hardhat';

// A convenient object for looking up various time constants.
export const TIME_AS_SECONDS = {
	'30 days': 60 * 60 * 24 * 30,
	'90 days': 60 * 60 * 24 * 30 * 3,
	'180 days': 60 * 60 * 24 * 30 * 6,
	'360 days': 60 * 60 * 24 * 30 * 12,
	'720 days': 60 * 60 * 24 * 30 * 24,
	'1080 days': 60 * 60 * 24 * 30 * 36
};

/*
	The cap on the number of BYTES that may be deposited into an S1 Citizen with 
	an associated Vault.
*/
export const S1_CAP = ethers.utils.parseEther('2000');

/*
	The cap on the number of BYTES that may be deposited into an S2 Citizen or an 
	S1 Citizen with no associated Vault.
*/
export const S2_OR_UNVAULTED_CAP = ethers.utils.parseEther('200');

// Each S1 Identity component has a class corresponding to a particular ID.
export const CLASS_TO_ID = {
	'Worker': 0,
	'Grunt': 1,
	'Assistant': 2,
	'Driver': 3,
	'Chat Support': 4,
	'Builder': 5,
	'Cook': 6,
	'Bartender': 7,
	'Corporate': 8,
	'Punk': 9,
	'Nerd': 10,
	'Scavenger': 11,
	'Officer': 12,
	'Developer': 13,
	'Club Promoter': 14,
	'Chef': 15,
	'Mercenary': 16,
	'Samurai': 17,
	'Tech Runner': 18,
	'Cyberstreet Trader': 19,
	'Club Owner': 20,
	'NFT Artist': 21,
	'Cyber Ninja': 22,
	'Assassin': 23,
	'Exectuive': 24,
	'Tech Weapon Dealer': 25,
	'Architect': 26,
	'Wraith': 27,
	'Slayer': 28,
	'CEO': 29,
	'Market Whale': 30,
	'Day One Bitcoin Investor': 31,
	'Celebrity': 32,
	'Hand of Citadel': 33
};

/*
	This helper function encodes details about a particular timelock by bit-packing together the provided `_duration` and `_multiplier`.
*/
function encodeTimelock (
	_duration,
	_multiplier
) {
	return ethers.BigNumber.from(_duration).shl(128).add(_multiplier);
}

/*
	Each stakeable asset has an ID and a corresponding set of timelock options. The timelock options vary in duration from one month to three years, depending on the asset. For each timelock option, the duration and multiplier (in basis points) are encoded together via bit-packing.
*/
export const ASSETS = Object.freeze({
	S1_CITIZEN: {
		id: 0,
		timelockOptions: [
			encodeTimelock(TIME_AS_SECONDS['30 days'], 100),
			encodeTimelock(TIME_AS_SECONDS['90 days'], 125),
			encodeTimelock(TIME_AS_SECONDS['180 days'], 150),
			encodeTimelock(TIME_AS_SECONDS['360 days'], 200),
			encodeTimelock(TIME_AS_SECONDS['720 days'], 300)
		]
	},
	S2_CITIZEN: {
		id: 1,
		timelockOptions: [
			encodeTimelock(TIME_AS_SECONDS['30 days'], 100),
			encodeTimelock(TIME_AS_SECONDS['90 days'], 125),
			encodeTimelock(TIME_AS_SECONDS['180 days'], 150),
			encodeTimelock(TIME_AS_SECONDS['360 days'], 175),
			encodeTimelock(TIME_AS_SECONDS['720 days'], 200)
		]
	},
	BYTES: {
		id: 2,
		timelockOptions: [
			encodeTimelock(TIME_AS_SECONDS['30 days'], 100),
			encodeTimelock(TIME_AS_SECONDS['90 days'], 125),
			encodeTimelock(TIME_AS_SECONDS['180 days'], 150),
			encodeTimelock(TIME_AS_SECONDS['360 days'], 175),
			encodeTimelock(TIME_AS_SECONDS['720 days'], 200)
		]
	},
	LP: {
		id: 3,
		timelockOptions: [
			encodeTimelock(TIME_AS_SECONDS['30 days'], 100),
			encodeTimelock(TIME_AS_SECONDS['90 days'], 125),
			encodeTimelock(TIME_AS_SECONDS['180 days'], 150),
			encodeTimelock(TIME_AS_SECONDS['360 days'], 200),
			encodeTimelock(TIME_AS_SECONDS['720 days'], 300),
			encodeTimelock(TIME_AS_SECONDS['1080 days'], 400)
		]
	}
});

// A useful mapping to consistent timelock option IDs.
export const TIMELOCK_OPTION_IDS = {
	'30': 0,
	'90': 1,
	'180': 2,
	'360': 3,
	'720': 4,
	'1080': 5
};

/*
	This data allows us to deduce the otherwise-unretrievable S1 Identity 'Credit 
	Yield' rate of an S1 Citizen's Identity component given the total reward rate 
	of the S1 Citizen and the multiplier of the S1 Citizen's component Vault, if 
	there is one.

	Example: an S1 Citizen with a total reward rate of 11 and a Vault credit 
	multiplier of Medium-High must have an Identity 'Credit Yield' rate of 'High'.
*/
export const DEDUCE_IDENTITY_CREDIT_YIELDS = {
	citizenRewardRates: [
		1, 3, 8, 
		2, 4, 9, 
		3, 5, 10, 
		4, 6, 11, 
		5, 7, 12, 
		6, 8, 13, 
		8, 10, 15, 
		15
	],
	vaultMultipliers: [
		'', '', '',
		'Low', 'Low', 'Low', 
		'Medium', 'Medium', 'Medium',
		'Medium-High', 'Medium-High', 'Medium-High',
		'High', 'High', 'High',
		'Very High',  'Very High',  'Very High',
		'?',  '?',  '?',
		''
	], 
	identityCreditYieldRates: [
		'Low', 'Mid', 'High',
		'Low', 'Mid', 'High',
		'Low', 'Mid', 'High',
		'Low', 'Mid', 'High',
		'Low', 'Mid', 'High',
		'Low', 'Mid', 'High',
		'Low', 'Mid', 'High',
		'High'
	]
};

/*
	Identities are given new configurable basis points for determining the share
	of BYTES rewards that they compete for based on their previous credit yield
	values.
*/
export const IDENTITY_CREDIT_POINTS = {
	identityCreditYieldRates: [ 'Low', 'Mid', 'High' ],
	points: [ 100, 200, 300 ]
};

/*
	The potential vaults associated with S1 Citizens are given new configurable 
	reward multipliers in basis	points.
*/
export const VAULT_MULTIPLIERS = {
	vaultMultipliers: [
		'Low', 'Medium', 'Medium-High', 'High', 'Very High', '?'
	],
	configuredMultipliers: [ 100, 150, 175, 200, 250, 300 ]
};

// Export names for the different Vault multiplier IDs.
export const VAULT_CREDIT_MULTIPLIER_IDS = {
	'Low': 0,
	'Medium': 1,
	'Medium High': 2,
	'High': 3,
	'Very High': 4,
	'?': 5
};

// S1 Citizens lose some earnings to the DAO.
export const S1_DAO_SHARE = 300;

// S2 Citizens lose some earnings to the DAO.
export const S2_DAO_SHARE = 300;

// LP stakers lose some earnings to the DAO.
export const LP_DAO_SHARE = 300;

/*
	The number of BYTES that a caller must stake into a Citizen to gain a single 
	additional point.
*/
export const BYTES_PER_POINT = ethers.utils.parseEther('200');
