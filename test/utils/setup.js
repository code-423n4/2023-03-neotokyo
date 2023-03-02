import { ethers } from 'hardhat';
import {
	S1_CAP, S2_OR_UNVAULTED_CAP
} from './constants'

/**
	Export a helper function which returns deployed and configured instances of 
	Neo Tokyo S1, S2, and new contracts.

	@param _treasuryAddress The address to use as the Neo Tokyo DAO treasury.
*/
export const prepareContracts = async function (
	_treasuryAddress
) {

	// Retrieve Neo Tokyo S1 contract factories.
	const BECK_LOOT = await ethers.getContractFactory('beckLoot');
	const NT_ITENS = await ethers.getContractFactory('NTItems');
	const NT_LAND_DEPLOY = await ethers.getContractFactory('NTLandDeploy');
	const VAULT_BOX = await ethers.getContractFactory('vaultBox');
	const NT_CITIZEN_DEPLOY = await ethers.getContractFactory('NTCitizenDeploy');
	const BYTES_CONTRACT = await ethers.getContractFactory('BYTESContract');

	// Retrieve Neo Tokyo mock testing contract factories.
	const BOX_MINT = await ethers.getContractFactory('boxMint');
	const REGULAR_MINT = await ethers.getContractFactory('regularMint');
	const LP_TOKEN = await ethers.getContractFactory('lpToken');
	const DATA_CONTRACT_MOCK = await ethers.getContractFactory(
		'dataContractMock'
	);

	// Deploy instances of Neo Tokyo S1 contracts.
	const beckLoot = await BECK_LOOT.deploy();
	await beckLoot.deployed();
	const NTItems = await NT_ITENS.deploy();
	await NTItems.deployed();
	const NTLandDeploy = await NT_LAND_DEPLOY.deploy();
	await NTLandDeploy.deployed();
	const vaultBox = await VAULT_BOX.deploy();
	await vaultBox.deployed();
	const NTCitizenDeploy = await NT_CITIZEN_DEPLOY.deploy();
	await NTCitizenDeploy.deployed();
	const NTOldBytes = await BYTES_CONTRACT.deploy();
	await NTOldBytes.deployed();
	await NTOldBytes.setCitizenContract(NTCitizenDeploy.address);

	// Deploy instances of testing contracts.
	const boxMint = await BOX_MINT.deploy();
	await boxMint.deployed();
	const regularMint = await REGULAR_MINT.deploy();
	await regularMint.deployed();
	const lpToken = await LP_TOKEN.deploy();
	await lpToken.deployed();

	// Configure beckLoot (Neo Tokyo Identities) with the mock mint.
	await beckLoot.setMintContract(regularMint.address);
	await beckLoot.setRareMintContract(regularMint.address);
	await beckLoot.setHandMintContract(regularMint.address);

	// Configure the Neo Tokyo land deployer.
	await NTLandDeploy.setVaultAddress(vaultBox.address);
	await NTLandDeploy.setItemContract(NTItems.address);

	// Configure the Neo Tokyo vault with the Identity and mock mint.
	await vaultBox.setIdAddress(beckLoot.address);
	await vaultBox.setContract(boxMint.address);

	// Configure the Neo Tokyo citizen deployer.
	await NTCitizenDeploy.setVaultAddress(vaultBox.address);
	await NTCitizenDeploy.setItemContract(NTItems.address);
	await NTCitizenDeploy.setIdentityAddress(beckLoot.address);
	await NTCitizenDeploy.setLandContract(NTLandDeploy.address);

	// Configure the NeoTokyo items.
	await NTItems.setBoxAddress(vaultBox.address);

	// Configure the old NeoTokyo BYTES contract.
	await NTOldBytes.setVaultBoxContract(vaultBox.address);
	await NTOldBytes.setIdentityContract(beckLoot.address);

	// Configure the Neo Tokyo citizen deployer with a mock citizen minter.
	const dataContractMock = await DATA_CONTRACT_MOCK.deploy();
	await dataContractMock.deployed();
	await NTCitizenDeploy.setCitizenMintContract(dataContractMock.address);

	// Retrieve Neo Tokyo S2 contract factories.
	const NT_OUTER_CITIZEN_DEPLOY = await ethers.getContractFactory(
		'NTOuterCitizenDeploy'
	);
	const NT_OUTER_IDENTITY = await ethers.getContractFactory('NTOuterIdentity');
	const NT_S2_ITEMS = await ethers.getContractFactory('NTS2Items');
	const NT_S2_LAND_DEPLOY = await ethers.getContractFactory('NTS2LandDeploy');

	// Deploy the NeoTokyo S2 citizens and their ecosystem.
	const NTOuterCitizenDeploy = await NT_OUTER_CITIZEN_DEPLOY.deploy();
	await NTOuterCitizenDeploy.deployed();
	const NTOuterIdentity = await NT_OUTER_IDENTITY.deploy();
	await NTOuterIdentity.deployed();
	const NTS2Items = await NT_S2_ITEMS.deploy();
	await NTS2Items.deployed();
	const NTS2LandDeploy = await NT_S2_LAND_DEPLOY.deploy();
	await NTS2LandDeploy.deployed();

	// Configure the NeoTokyo ecosystem with the old BYTES contracts.
	await NTItems.setBytesAddress(NTOldBytes.address);
	await NTLandDeploy.setBytesAddress(NTOldBytes.address);
	await NTCitizenDeploy.setBytesAddress(NTOldBytes.address);
	await NTOuterCitizenDeploy.setBytesAddress(NTOldBytes.address);
	await NTS2Items.setBytesAddress(NTOldBytes.address);
	await NTS2LandDeploy.setBytesAddress(NTOldBytes.address);

	// Configure the Neo Tokyo S2 contracts.
	await NTOuterCitizenDeploy.setItemContract(NTS2Items.address);
	await NTOuterCitizenDeploy.setIdentityAddress(NTOuterIdentity.address);
	await NTOuterCitizenDeploy.setLandContract(NTS2LandDeploy.address);
	await NTOuterIdentity.setIdentityContract(beckLoot.address);
	await NTOuterIdentity.setCitizenContract(NTCitizenDeploy.address);
	await NTS2Items.setIdentityAddress(NTOuterIdentity.address);
	await NTS2LandDeploy.setIdentityContract(NTOuterIdentity.address);

	// Prepare the new Neo Tokyo BYTES 2.0 and staker contract factories.
	const BYTES_CONTRACT_2_0 = await ethers.getContractFactory('BYTES2');
	const STAKING_V2 = await ethers.getContractFactory('NeoTokyoStaker');

	// Deploy and configure the BYTES 2.0 contract.
	const NTBytes2_0 = await BYTES_CONTRACT_2_0.deploy(
		NTOldBytes.address,
		NTCitizenDeploy.address,
		ethers.constants.AddressZero,
		ethers.constants.AddressZero
	);
	await NTBytes2_0.deployed();
	await NTBytes2_0.changeTreasureContractAddress(_treasuryAddress);

	/*
		Make the new BYTES 2.0 contract an admin on the old BYTES contract such 
		that it can burn the old tokens for a migration.
	*/
	await NTOldBytes.addAdminContractAddress(NTBytes2_0.address);
	
	// Deploy the new Neo Tokyo staker.
	const NTStaking = await STAKING_V2.deploy(
		NTBytes2_0.address,
		NTCitizenDeploy.address,
		NTOuterCitizenDeploy.address,
		lpToken.address,
		beckLoot.address,
		vaultBox.address,
		S1_CAP,
		S2_OR_UNVAULTED_CAP
	);
	await NTStaking.deployed();

	// Update the new BYTES 2.0 contract to point to the new staker.
	await NTBytes2_0.changeStakingContractAddress(NTStaking.address);

	// Activate S1 and S2 citizen minting.
	await NTCitizenDeploy.setCitizenMintActive();
	await NTOuterCitizenDeploy.setCitizenMintActive();

	// Activate the S1 Identity claim.
	await beckLoot.setSale();

	// Activate the S1 Vault claim.
	await vaultBox.setOpenClaimState();

	// Specify BYTES contract admins.
	await NTOldBytes.addAdminContractAddress(NTItems.address);
	await NTOldBytes.addAdminContractAddress(NTLandDeploy.address);

	// Set the S1 Items minting cost to avoid whitelist validation.
	await NTItems.setItemCost('0');

	// Set the S1 Land minting cost.
	await NTLandDeploy.setLandCost('0');

	// Return the configured contract instances.
	return [
		beckLoot, NTItems, NTLandDeploy, vaultBox, NTCitizenDeploy, NTOldBytes,
		boxMint, regularMint, lpToken, dataContractMock, NTOuterCitizenDeploy, 
		NTOuterIdentity, NTS2Items, NTS2LandDeploy, NTBytes2_0, NTStaking
	];
}
