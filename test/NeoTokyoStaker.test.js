'use strict';

// Imports.
import { ethers } from 'hardhat';
import { expect, should } from 'chai';
import {
	CLASS_TO_ID, ASSETS, DEDUCE_IDENTITY_CREDIT_YIELDS, IDENTITY_CREDIT_POINTS, 
	VAULT_MULTIPLIERS, VAULT_CREDIT_MULTIPLIER_IDS, TIMELOCK_OPTION_IDS, 
	S1_DAO_SHARE, S2_DAO_SHARE, LP_DAO_SHARE
} from './utils/constants';
import {
	prepareContracts
} from './utils/setup';
should();

/*
	Test the updated BYTES token and the staker for correct behavior. Describe the
	contract testing suite, retrieve testing wallets, and create contract
	factories from the artifacts we are testing.
*/
describe('Testing BYTES 2.0 & Neo Tokyo Staker', function () {

	// Track the current time and snapshot ID for reverting between tests.
	let currentTime, snapshotId;

	// Prepare several testing callers.
	let owner, alice, bob, nonCitizen, whale, treasury;

	// Neo Tokyo S1 contract instances.
	let beckLoot, NTItems, NTLandDeploy, vaultBox, NTCitizenDeploy, NTOldBytes;

	// Neo Tokyo S2 contract instances.
	let NTOuterCitizenDeploy, NTOuterIdentity, NTS2Items, NTS2LandDeploy;

	// Various mock testing contracts.
	let CitizenMint, VaultMint, IdentityMint, LPToken;

	// New Neo Tokyo BYTES 2.0 and staker contract instances.
	let NTBytes2_0, NTStaking;

	// Prepare the Neo Tokyo ecosystem before each test.
	before(async () => {
		const signers = await ethers.getSigners();
		const addresses = await Promise.all(
			signers.map(async (signer) => signer.getAddress())
		);

		// Prepare testing callers.
		owner = {
			provider: signers[0].provider,
			signer: signers[0],
			address: addresses[0]
		};
		alice = {
			provider: signers[1].provider,
			signer: signers[1],
			address: addresses[1]
		};
		bob = {
			provider: signers[2].provider,
			signer: signers[2],
			address: addresses[2]
		};
		nonCitizen = {
			provider: signers[3].provider,
			signer: signers[3],
			address: addresses[3]
		};
		whale = {
			provider: signers[4].provider,
			signer: signers[4],
			address: addresses[4]
		};
		treasury = {
			provider: signers[5].provider,
			signer: signers[5],
			address: addresses[5]
		};

		// Prepare all of the Neo Tokyo S1, S2, and new contracts for testing.
		[
			beckLoot, NTItems, NTLandDeploy, vaultBox, NTCitizenDeploy, NTOldBytes, 
			VaultMint, IdentityMint, LPToken, CitizenMint, NTOuterCitizenDeploy, 
			NTOuterIdentity, NTS2Items, NTS2LandDeploy, NTBytes2_0, NTStaking
		] = await prepareContracts(treasury.address);
	});
	
	// Accelerate tests by taking snapshot of the current block before each test.
	beforeEach(async function () {
		currentTime = (await ethers.provider.getBlock()).timestamp;
		snapshotId = await network.provider.send('evm_snapshot');
	});
	
	// Revert to the snapshot block after each test.
	afterEach(async function () {
		await network.provider.send('evm_revert', [ snapshotId ]);
	});

	// Prepare to test staker functionality.
	describe('with example configuration', function () {

		// Track IDs for Bob's S1 Citizen components.
		let identityId, vaultId, itemCacheId, landDeedId;

		// The ID of Bob's S1 Citizen.
		let citizenId1;

		// Track IDs for Alice's no-Vault S1 Citizen components.
		let identityIdNoVault, vaultIdNoVault,itemCacheIdNoVault,
			landDeedIdNoVault; 

		// The ID of Alice's no-Vault S1 Citizen.
		let citizenNoVault;

		// Track IDs for Alice's S1 Hand Citizen components.
		let identityIdHand, vaultIdHand, itemCacheIdHand, landDeedIdHand; 

		// The ID of Alice's S1 Hand Citizen.
		let citizenHandOfCitadel;

		// The IDs of Bob's S2 Citizens.
		let s2One, s2Two;

		// Mint tokens to the testing callers before each test.
		before(async () => {

			// Claim testing Identities with Bob and Alice.
			identityId = ethers.BigNumber.from('1');
			identityIdNoVault = ethers.BigNumber.from('2');
			identityIdHand = ethers.BigNumber.from('3');
			await beckLoot.connect(bob.signer).claim(identityId);
			await beckLoot.connect(alice.signer).claim(identityIdNoVault);
			await beckLoot.connect(alice.signer).claim(identityIdHand);

			// Claim testing Vaults with Bob and Alice.
			vaultId = ethers.BigNumber.from('1');
			vaultIdNoVault = ethers.BigNumber.from('2');
			vaultIdHand = ethers.BigNumber.from('3');
			await vaultBox.connect(bob.signer).claim(vaultId);
			await vaultBox.connect(alice.signer).claim(vaultIdNoVault);
			await vaultBox.connect(alice.signer).claim(vaultIdHand);	

			// Claim S1 Items with Bob and Alice, starting from the 2501 default.
			await NTItems.connect(bob.signer).buyItems();
			await NTItems.connect(alice.signer).buyItems();
			await NTItems.connect(alice.signer).buyItems();
			itemCacheId = ethers.BigNumber.from('2501');
			itemCacheIdNoVault = ethers.BigNumber.from('2502');
			itemCacheIdHand = ethers.BigNumber.from('2503');
			expect(
				await NTItems.ownerOf(itemCacheId)
			).to.be.equal(bob.address);
			expect(
				await NTItems.ownerOf(itemCacheIdNoVault)
			).to.be.equal(alice.address);
			expect(
				await NTItems.ownerOf(itemCacheIdHand)
			).to.be.equal(alice.address);

			// Claim S1 Land with Bob and Alice, starting from the 2501 default.
			await NTLandDeploy.connect(bob.signer).buyLand();
			await NTLandDeploy.connect(alice.signer).buyLand();
			await NTLandDeploy.connect(alice.signer).buyLand();
			landDeedId = ethers.BigNumber.from('2501');
			landDeedIdNoVault = ethers.BigNumber.from('2502');
			landDeedIdHand = ethers.BigNumber.from('2503');			

			// Approve Bob's tokens before transfer to the S1 assembler.
			await beckLoot
				.connect(bob.signer)
				.approve(NTCitizenDeploy.address, identityId);
			await vaultBox
				.connect(bob.signer)
				.approve(NTCitizenDeploy.address, vaultId);
			await NTItems.connect(bob.signer).approve(
				NTCitizenDeploy.address,
				itemCacheId
			);
			await NTLandDeploy.connect(bob.signer).approve(
				NTCitizenDeploy.address,
				landDeedId
			);

			// Approve Alice's tokens before transfer to the S1 assembler.
			await beckLoot
				.connect(alice.signer)
				.approve(NTCitizenDeploy.address, identityIdNoVault);
			await beckLoot
				.connect(alice.signer)
				.approve(NTCitizenDeploy.address, identityIdHand);
			await vaultBox
				.connect(alice.signer)
				.approve(NTCitizenDeploy.address, vaultIdHand);
			await NTItems.connect(alice.signer).approve(
				NTCitizenDeploy.address,
				itemCacheIdNoVault
			);
			await NTItems.connect(alice.signer).approve(
				NTCitizenDeploy.address,
				itemCacheIdHand
			);
			await NTLandDeploy.connect(alice.signer).approve(
				NTCitizenDeploy.address,
				landDeedIdNoVault
			);
			await NTLandDeploy.connect(alice.signer).approve(
				NTCitizenDeploy.address,
				landDeedIdHand
			);

			// Specify testing credit multipliers on the S1 Vaults.
			await VaultMint.setCreditMultiplier(
				vaultId,
				VAULT_CREDIT_MULTIPLIER_IDS.High
			);
			await VaultMint.setCreditMultiplier(
				vaultIdNoVault,
				VAULT_CREDIT_MULTIPLIER_IDS['Very High']
			);
			await VaultMint.setCreditMultiplier(
				vaultIdHand,
				VAULT_CREDIT_MULTIPLIER_IDS['Very High']
			);

			/*
				Specify reward rates on the mock data contract for the S1 Citizens that 
				are about to exist.
			*/
			await CitizenMint.setRewardRates(
				identityId,
				ethers.BigNumber.from('5')
			);
			await CitizenMint.setRewardRates(
				identityIdNoVault,
				ethers.BigNumber.from('3')
			);
			await CitizenMint.setRewardRates(
				identityIdHand,
				ethers.BigNumber.from('13')
			);

			/*
				The specified S1 Citizen reward rates and Vault credit multipliers mean 
				that:
				- Bob's S1 Citizen has an Identity "Credit Yield" of "Low"
				- Alice's Vaultless Citizen has one of "Mid"
				- Alice's Hand Citizen has one of "High"
				This method of deducing Identity "Credit Yield" is required because the
				"Credit Yield" trait is not otherwise accessible to a smart contract.
			*/

			// Assemble Bob's S1 Citizen.
			await NTCitizenDeploy.connect(bob.signer).createCitizen(
				identityId,
				vaultId,
				itemCacheId,
				landDeedId,
				false,
				''
			);
			citizenId1 = await NTCitizenDeploy.totalSupply();
			expect(
				await NTCitizenDeploy.ownerOf(citizenId1)
			).to.equal(bob.address);

			// Assemble Alice's S1 Citizen with no Vault.
			await NTCitizenDeploy.connect(alice.signer).createCitizen(
				identityIdNoVault,
				0,
				itemCacheIdNoVault,
				landDeedIdNoVault,
				false,
				''
			);
			citizenNoVault = await NTCitizenDeploy.totalSupply();
			expect(
				await NTCitizenDeploy.ownerOf(citizenNoVault)
			).to.equal(alice.address);

			// Assemble Alice's S1 Hand Citizen.
			await NTCitizenDeploy.connect(alice.signer).createCitizen(
				identityIdHand,
				vaultIdHand,
				itemCacheIdHand,
				landDeedIdHand,
				false,
				''
			);
			citizenHandOfCitadel = await NTCitizenDeploy.totalSupply();
			expect(
				await NTCitizenDeploy.ownerOf(citizenHandOfCitadel)
			).to.equal(alice.address);

			// Set the classes of Bob and Alice's new S1 Citizens.
			await IdentityMint.setClass(
				await NTCitizenDeploy.getIdentityIdOfTokenId(citizenId1),
				CLASS_TO_ID['Assistant']
			);
			await IdentityMint.setClass(
				await NTCitizenDeploy.getIdentityIdOfTokenId(citizenNoVault), 
				CLASS_TO_ID['Samurai']
			);
			await IdentityMint.setClass(
				await NTCitizenDeploy.getIdentityIdOfTokenId(citizenHandOfCitadel), 
				CLASS_TO_ID['Hand of Citadel']
			);

			// Have Bob approve the staker to transfer his S1 Citizen.
			await NTCitizenDeploy.connect(bob.signer).approve(
				NTStaking.address,
				citizenId1
			);

			// Have Alice approve the staker to transfer her S1 Citizens.
			await NTCitizenDeploy.connect(alice.signer).approve(
				NTStaking.address,
				citizenNoVault
			);
			await NTCitizenDeploy.connect(alice.signer).approve(
				NTStaking.address,
				citizenHandOfCitadel
			);

			// Have Alice approve the staker to transfer her unattached Vault.
			await vaultBox.connect(alice.signer).approve(
				NTStaking.address,
				vaultIdNoVault
			);

			/**
				A helper function to create an S2 Citizen for the specific holder.

				@param _citizenHolder The holder (testing user) to create an S2 Citizen 
					for.
			*/
			async function createS2Citizen (_citizenHolder) {
				let identityIdS2, itemCacheIdS2, landDeedIdS2;
				identityIdS2 = (
					await NTOuterIdentity.totalSupply()
				).add(ethers.BigNumber.from('1'));

				/*
					Use administrative powers to claim a new S2 Identity for the desired 
					`_citizenHolder`.
				*/
				await NTOuterIdentity.connect(owner.signer).ownerClaim(identityIdS2);
				await NTOuterIdentity.connect(owner.signer).transferFrom(
					owner.address,
					_citizenHolder.address,
					identityIdS2
				);

				// Claim a new S2 Item for the desired holder.
				itemCacheIdS2 = (
					await NTS2Items.totalSupply()
				).add(ethers.BigNumber.from('1'));
				await NTS2Items.connect(owner.signer).emergencyClaim(
					identityIdS2,
					itemCacheIdS2
				);
				await NTS2Items.connect(owner.signer).transferFrom(
					owner.address,
					_citizenHolder.address,
					itemCacheIdS2
				);

				// Claim a new S2 Land Deed for the desired holder.
				landDeedIdS2 = (
					await NTS2LandDeploy.totalSupply()
				).add(ethers.BigNumber.from('1'));
				await NTS2LandDeploy.connect(owner.signer).emergencyClaim(
					identityIdS2,
					landDeedIdS2
				);
				await NTS2LandDeploy.connect(owner.signer).transferFrom(
					owner.address,
					_citizenHolder.address,
					landDeedIdS2
				);
	
				// Approve the transfer of the holder's components.
				await NTOuterIdentity.connect(_citizenHolder.signer).approve(
					NTOuterCitizenDeploy.address,
					identityIdS2
				);
				await NTS2Items.connect(_citizenHolder.signer).approve(
					NTOuterCitizenDeploy.address,
					itemCacheIdS2
				);
				await NTS2LandDeploy.connect(_citizenHolder.signer).approve(
					NTOuterCitizenDeploy.address,
					landDeedIdS2
				);
	
				// Assemble the holder's S2 Citizen.
				await NTOuterCitizenDeploy.connect(_citizenHolder.signer).createCitizen(
					identityIdS2,
					itemCacheIdS2,
					landDeedIdS2,
					false,
					''
				);

				// Return the ID of the new S2 Citizen.
				return NTOuterCitizenDeploy.totalSupply();
			}

			// Create two S2 Citizens for Bob.
			s2One = await createS2Citizen(bob);
			s2Two = await createS2Citizen(bob);

			// Confirm Bob owns two S2 Citizens.
			expect(
				await NTOuterCitizenDeploy.balanceOf(bob.address)
			).to.be.be.equal(2);

			// Have Bob approve the staker to transfer his S2 Citizens.
			await NTOuterCitizenDeploy.connect(bob.signer).approve(
				NTStaking.address,
				s2One
			);
			await NTOuterCitizenDeploy.connect(bob.signer).approve(
				NTStaking.address,
				s2Two
			);

			// Simulate the migration to BYTES 2.0 by jumping into the future.
			ethers.provider.send('evm_increaseTime', [ 1000000000 ]);
			ethers.provider.send('evm_mine');

			// Have Bob claim his S1 Citizen's BYTES reward.
			await NTCitizenDeploy.connect(bob.signer).getReward();
			let bobBalance = await NTOldBytes.balanceOf(bob.address);

			// Update Neo Tokyo contracts with the address of BYTES 2.0.
			await NTLandDeploy.setBytesAddress(NTBytes2_0.address);
			await NTCitizenDeploy.setBytesAddress(NTBytes2_0.address);
			await NTOuterCitizenDeploy.setBytesAddress(NTBytes2_0.address);
			await NTS2Items.setBytesAddress(NTBytes2_0.address);
			await NTS2LandDeploy.setBytesAddress(NTBytes2_0.address);

			// Perform the BYTES to BYTES 2.0 migration with Bob's tokens.
			await NTBytes2_0.connect(bob.signer).upgradeBytes(bobBalance);

			// Transfer half of Bob's new BYTES to Alice for staking testing.
			let half = bobBalance.div(2);
			await NTBytes2_0.connect(bob.signer).approve(
				alice.address,
				ethers.constants.MaxUint256  
			);
			await NTBytes2_0.connect(alice.signer).transferFrom(
				bob.address,
				alice.address,
				half
			);
			await NTBytes2_0.connect(bob.signer).approve(
				NTStaking.address,
				ethers.constants.MaxUint256  
			);
			await NTBytes2_0.connect(alice.signer).approve(
				NTStaking.address,
				ethers.constants.MaxUint256  
			);

			// Mint testing LP tokens to users and approve transfer to the staker.
			await LPToken.mint(alice.address, ethers.utils.parseEther('100'));
			await LPToken.mint(bob.address, ethers.utils.parseEther('100'));
			await LPToken.mint(whale.address, ethers.utils.parseEther('10000'));
			await LPToken.connect(alice.signer).approve(
				NTStaking.address,
				ethers.constants.MaxUint256
			);
			await LPToken.connect(bob.signer).approve(
				NTStaking.address,
				ethers.constants.MaxUint256
			);
			await LPToken.connect(whale.signer).approve(
				NTStaking.address,
				ethers.constants.MaxUint256
			);

			// Configure each of the stakeable assets with the timelock options.
			await NTStaking.connect(owner.signer).configureTimelockOptions(
				ASSETS.S1_CITIZEN.id,
				[ ...Array(ASSETS.S1_CITIZEN.timelockOptions.length).keys() ],
				ASSETS.S1_CITIZEN.timelockOptions
			);
			await NTStaking.connect(owner.signer).configureTimelockOptions(
				ASSETS.S2_CITIZEN.id,
				[ ...Array(ASSETS.S2_CITIZEN.timelockOptions.length).keys() ],
				ASSETS.S2_CITIZEN.timelockOptions
			);
			await NTStaking.connect(owner.signer).configureTimelockOptions(
				ASSETS.BYTES.id,
				[ ...Array(ASSETS.BYTES.timelockOptions.length).keys() ],
				ASSETS.BYTES.timelockOptions
			);
			await NTStaking.connect(owner.signer).configureTimelockOptions(
				ASSETS.LP.id,
				[ ...Array(ASSETS.LP.timelockOptions.length).keys() ],
				ASSETS.LP.timelockOptions
			);

			// Configure each of the stakeable assets with daily reward rates.
			await NTStaking.connect(owner.signer).configurePools(
				[
					{
						assetType: ASSETS.S1_CITIZEN.id,
						daoTax: S1_DAO_SHARE,
						rewardWindows: [
							{
								startTime: 0,
								reward: ethers.utils.parseEther('200').div(60 * 60 * 24)
							}
						]
					},
					{
						assetType: ASSETS.S2_CITIZEN.id,
						daoTax: S2_DAO_SHARE,
						rewardWindows: [
							{
								startTime: 0,
								reward: ethers.utils.parseEther('100').div(60 * 60 * 24)
							}
						]
					},
					{
						assetType: ASSETS.LP.id,
						daoTax: LP_DAO_SHARE,
						rewardWindows: [
							{
								startTime: 0,
								reward: ethers.utils.parseEther('50').div(60 * 60 * 24)
							}
						]
					}
				]
			);

			// Configure the staker with its S1 Identity "Credit Yield" data.
			await NTStaking.connect(owner.signer).configureIdentityCreditYields(
				DEDUCE_IDENTITY_CREDIT_YIELDS.citizenRewardRates,
				DEDUCE_IDENTITY_CREDIT_YIELDS.vaultMultipliers,
				DEDUCE_IDENTITY_CREDIT_YIELDS.identityCreditYieldRates
			);

			// Configure the staker with its S1 Identity base point values.
			await NTStaking.connect(owner.signer).configureIdentityCreditPoints(
				IDENTITY_CREDIT_POINTS.identityCreditYieldRates,
				IDENTITY_CREDIT_POINTS.points
			);

			// Configure the staker with its S1 Vault credit multiplier values.
			await NTStaking.connect(owner.signer).configureVaultCreditMultipliers(
				VAULT_MULTIPLIERS.vaultMultipliers,
				VAULT_MULTIPLIERS.configuredMultipliers
			);
		});

		// Simulate a competitive staking scenario between Alice and Bob.
		it('a comprehensive happy-path test', async function () {

			// Bob stakes his S1 Citizen.
			await NTStaking.connect(bob.signer).stake(
				ASSETS.S1_CITIZEN.id,
				TIMELOCK_OPTION_IDS['30'],
				citizenId1,
				0,
				0
			);

			// Get the time at which Bob staked.
			let priorBlockNumber = await ethers.provider.getBlockNumber();
			let priorBlock = await ethers.provider.getBlock(priorBlockNumber);
			let bobStakeTime = priorBlock.timestamp;

			// Alice stakes her S1 Citizen with an additional Vault.
			await NTStaking.connect(alice.signer).stake(
				ASSETS.S1_CITIZEN.id,
				TIMELOCK_OPTION_IDS['90'],
				citizenNoVault,
				vaultIdNoVault,
				0
			);

			// Alice stakes her S1 Hand Citizen.
			await NTStaking.connect(alice.signer).stake(
				ASSETS.S1_CITIZEN.id,
				TIMELOCK_OPTION_IDS['180'],
				citizenHandOfCitadel,
				0,
				1
			);

			// Get the time at which Alice staked.
			priorBlockNumber = await ethers.provider.getBlockNumber();
			priorBlock = await ethers.provider.getBlock(priorBlockNumber);
			let aliceStakeTime = priorBlock.timestamp;

			// Confirm that Bob's S1 Citizen has the expected staking state.
			let bobStakedS1 = await NTStaking.stakedS1(bob.address, citizenId1);
			bobStakedS1.points.should.be.equal(200);

			// Confirm Bob's current staker position.
			let bobS1Position = await NTStaking.getStakerPosition(
				bob.address,
				ASSETS.S1_CITIZEN.id
			);
			bobS1Position.should.deep.equal([ ethers.BigNumber.from(1) ]);

			// Confirm Bob's total staker position.
			let bobPosition = await NTStaking.getStakerPositions(bob.address);
			bobPosition.stakedS1Citizens[0].citizenId.should.be.equal(
				ethers.BigNumber.from(1)
			);

			// Confirm that Alice's S1 Citizen has the expected staking state.
			let aliceStakedS1 = await NTStaking.stakedS1(
				alice.address,
				citizenNoVault
			);
			aliceStakedS1.points.should.be.equal(625);

			// Confirm that Alice's S1 Hand Citizen has the expected staking state.
			let aliceStakedS1Hand = await NTStaking.stakedS1(
				alice.address,
				citizenHandOfCitadel
			);

			// S1 Hand Citizens are explicitly treated as if they have '?' Vaults.
			aliceStakedS1Hand.points.should.be.equal(1350);

			// Confirm Alice's current staker position.
			let aliceS1Position = await NTStaking.getStakerPosition(
				alice.address,
				ASSETS.S1_CITIZEN.id
			);
			aliceS1Position.should.deep.equal([
				ethers.BigNumber.from(2),
				ethers.BigNumber.from(3)
			]);

			// Confirm Alice's total staker position.
			let alicePosition = await NTStaking.getStakerPositions(alice.address);
			alicePosition.stakedS1Citizens[0].citizenId.should.be.equal(
				ethers.BigNumber.from(2)
			);
			alicePosition.stakedS1Citizens[1].citizenId.should.be.equal(
				ethers.BigNumber.from(3)
			);

			// Retrieve the current balances of BYTES.
			let daoBalanceInitial = await NTBytes2_0.balanceOf(treasury.address);
			let bobBalanceInitial = await NTBytes2_0.balanceOf(bob.address);
			let aliceBalanceInitial = await NTBytes2_0.balanceOf(alice.address);

			// Simulate Bob staking for 12 hours.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				bobStakeTime + (60 * 60 * 12)
			]);
			await NTCitizenDeploy.connect(bob.signer).getReward();

			// Confirm Bob and the DAO received their proper share.
			let bobBalance = await NTBytes2_0.balanceOf(bob.address);
			bobBalance.sub(bobBalanceInitial).should.be.closeTo(
				ethers.BigNumber.from('8919540229885057471'),
				ethers.BigNumber.from('1000000000')
			);
			let daoBalanceBob = await NTBytes2_0.balanceOf(treasury.address);
			daoBalanceBob.sub(daoBalanceInitial).should.be.closeTo(
				ethers.BigNumber.from('275862068960000000'),
				ethers.BigNumber.from('1000000000')
			);

			// Simulate a change in reward rates 16-hours into Alice's stake.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				aliceStakeTime + (60 * 60 * 16)
			]);
			await NTStaking.connect(owner.signer).configurePools(
				[
					{
						assetType: ASSETS.S1_CITIZEN.id,
						daoTax: S1_DAO_SHARE,
						rewardWindows: [
							{
								startTime: 0,
								reward: ethers.utils.parseEther('200').div(60 * 60 * 24)
							},
							{
								startTime: aliceStakeTime + (60 * 60 * 16),
								reward: ethers.utils.parseEther('150').div(60 * 60 * 24)
							}
						]
					}
				]
			);

			// Simulate Alice staking for 24 hours.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				aliceStakeTime + (60 * 60 * 24)
			]);
			await NTCitizenDeploy.connect(alice.signer).getReward();

			// Confirm Alice and the DAO received their proper share.
			let aliceBalance = await NTBytes2_0.balanceOf(alice.address);
			aliceBalance.sub(aliceBalanceInitial).should.be.closeTo(
				ethers.BigNumber.from('161480842911877000000'),
				ethers.BigNumber.from('1000000000')
			);
			let daoBalanceAlice = await NTBytes2_0.balanceOf(treasury.address);
			daoBalanceAlice.sub(daoBalanceBob).should.be.closeTo(
				ethers.BigNumber.from('4994252873563220000'),
				ethers.BigNumber.from('1000000000')
			);

			// Simulate Alice staking for another 24 hours to simulate partial claims.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				aliceStakeTime + (60 * 60 * 24 * 2)
			]);
			await NTCitizenDeploy.connect(alice.signer).getReward();
			aliceBalanceInitial = aliceBalance;
			aliceBalance = await NTBytes2_0.balanceOf(alice.address);
			aliceBalance.sub(aliceBalanceInitial).should.be.closeTo(
				ethers.BigNumber.from('132120689655172000000'),
				ethers.BigNumber.from('1000000000')
			);

			// Configure the LP token contract address on the staker.
			await NTStaking.connect(owner.signer).configureLP(LPToken.address);

			// Jump to three days after Bob's stake.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				bobStakeTime + (60 * 60 * 24 * 3)
			]);

			// Stake Alice's LP tokens.
			await NTStaking.connect(alice.signer).stake(
				ASSETS.LP.id,
				TIMELOCK_OPTION_IDS['30'],
				ethers.utils.parseEther('40'),
				0,
				0
			);

			// Stake Bob's S2 Citizens and LP tokens.
			await NTStaking.connect(bob.signer).stake(
				ASSETS.S2_CITIZEN.id,
				TIMELOCK_OPTION_IDS['30'],
				s2One,
				0,
				0
			);
			await NTStaking.connect(bob.signer).stake(
				ASSETS.S2_CITIZEN.id,
				TIMELOCK_OPTION_IDS['90'],
				s2Two,
				0,
				0
			);
			await NTStaking.connect(bob.signer).stake(
				ASSETS.LP.id,
				TIMELOCK_OPTION_IDS['1080'],
				ethers.utils.parseEther('10'),
				0,
				0
			);

			// Validate the correctness of Bob's staker state.
			bobPosition = await NTStaking.getStakerPositions(bob.address);
			bobPosition.stakedS2Citizens[0].citizenId.should.be.equal(
				ethers.BigNumber.from(1)
			);
			bobPosition.stakedS2Citizens[0].points.should.be.equal(
				ethers.BigNumber.from(100)
			);
			bobPosition.stakedS2Citizens[1].citizenId.should.be.equal(
				ethers.BigNumber.from(2)
			);
			bobPosition.stakedS2Citizens[1].points.should.be.equal(
				ethers.BigNumber.from(125)
			);
			bobPosition.stakedLPPosition.amount.should.be.equal(
				ethers.utils.parseEther('10')
			);
			bobPosition.stakedLPPosition.points.should.be.equal(4000);

			// Get the time at which Bob staked.
			priorBlockNumber = await ethers.provider.getBlockNumber();
			priorBlock = await ethers.provider.getBlock(priorBlockNumber);
			let bobSecondStakeTime = priorBlock.timestamp;

			// Jump to one day after Bob's S2 stake.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				bobSecondStakeTime + (60 * 60 * 24)
			]);

			// Verify correct reward totals.
			await NTCitizenDeploy.connect(bob.signer).getReward();
			bobBalanceInitial = bobBalance;
			bobBalance = await NTBytes2_0.balanceOf(bob.address);
			bobBalance.sub(bobBalanceInitial).should.be.closeTo(
				ethers.BigNumber.from('168820881226054000000'),
				ethers.BigNumber.from('100000000000000000')
			);

			// Activate the ability to stake BYTES into Citizens.
			await NTStaking.connect(owner.signer).configurePools(
				[
					{
						assetType: ASSETS.BYTES.id,
						daoTax: 0,
						rewardWindows: [
							{
								startTime: 0,
								reward: 0
							}
						]
					}
				]
			);

			// Jump to five days after Bob's stake.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				bobStakeTime + (60 * 60 * 24 * 5)
			]);

			// Bob stakes BYTES into his S1 Citizen.
			await NTStaking.connect(bob.signer).stake(
				ASSETS.BYTES.id,
				TIMELOCK_OPTION_IDS['90'],
				ethers.utils.parseEther('600'),
				citizenId1,
				1
			);

			// Jump to six days after Bob's stake.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				bobStakeTime + (60 * 60 * 24 * 6)
			]);

			// Verify correct reward totals.
			await NTCitizenDeploy.connect(bob.signer).getReward();
			bobBalanceInitial = bobBalance.sub(ethers.utils.parseEther('600'));
			bobBalance = await NTBytes2_0.balanceOf(bob.address);
			bobBalance.sub(bobBalanceInitial).should.be.closeTo(
				ethers.BigNumber.from('285273249738767000000'),
				ethers.BigNumber.from('100000000000000000')
			);

			// Bob maximally-stakes his S1 and S2 Citizens.
			await NTStaking.connect(bob.signer).stake(
				ASSETS.BYTES.id,
				TIMELOCK_OPTION_IDS['30'],
				ethers.utils.parseEther('1400'),
				citizenId1,
				1
			);
			await NTStaking.connect(bob.signer).stake(
				ASSETS.BYTES.id,
				TIMELOCK_OPTION_IDS['30'],
				ethers.utils.parseEther('200'),
				s2One,
				2
			);
			await NTStaking.connect(bob.signer).stake(
				ASSETS.BYTES.id,
				TIMELOCK_OPTION_IDS['30'],
				ethers.utils.parseEther('200'),
				s2Two,
				2
			);

			// Alice adds BYTES to her S1 Citizen.
			await NTStaking.connect(alice.signer).stake(
				ASSETS.BYTES.id,
				TIMELOCK_OPTION_IDS['30'],
				ethers.utils.parseEther('1000'),
				citizenNoVault,
				1
			);

			// Jump to seven days after Bob's stake.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				bobStakeTime + (60 * 60 * 24 * 7)
			]);

			// Verify correct reward totals.
			await NTCitizenDeploy.connect(bob.signer).getReward();
			bobBalanceInitial = bobBalance.sub(ethers.utils.parseEther('1800'));
			bobBalance = await NTBytes2_0.balanceOf(bob.address);
			bobBalance.sub(bobBalanceInitial).should.be.closeTo(
				ethers.BigNumber.from('168760204081633000000'),
				ethers.BigNumber.from('100000000000000000')
			);

			// Verify the re-up of LP tokens by Bob.
			await NTStaking.connect(bob.signer).stake(
				ASSETS.LP.id,
				TIMELOCK_OPTION_IDS['1080'],
				ethers.utils.parseEther('5'),
				0,
				0
			);

			// Jump to eight days after Bob's stake.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				bobStakeTime + (60 * 60 * 24 * 8)
			]);

			// Verify correct reward totals.
			await NTCitizenDeploy.connect(bob.signer).getReward();
			bobBalanceInitial = bobBalance;
			bobBalance = await NTBytes2_0.balanceOf(bob.address);
			bobBalance.sub(bobBalanceInitial).should.be.closeTo(
				ethers.BigNumber.from('173610204081633000000'),
				ethers.BigNumber.from('100000000000000000')
			);

			// Advance five years to verify that withdrawals are all cleared.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				bobStakeTime + (60 * 60 * 24 * 365 * 5)
			]);

			// Withdraw some of Bob's LP tokens.
			await NTStaking.connect(bob.signer).withdraw(
				ASSETS.LP.id,
				ethers.utils.parseEther('5')
			);
			await NTCitizenDeploy.connect(bob.signer).getReward();
			bobBalanceInitial = bobBalance;
			bobBalance = await NTBytes2_0.balanceOf(bob.address);

			// Advance one additional day to check for partial withdrawal impact.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				bobStakeTime + (60 * 60 * 24 * 365 * 5 + 60 * 60 * 24)
			]);
			await NTCitizenDeploy.connect(bob.signer).getReward();
			bobBalanceInitial = bobBalance;
			bobBalance = await NTBytes2_0.balanceOf(bob.address);
			bobBalance.sub(bobBalanceInitial).should.be.closeTo(
				ethers.BigNumber.from('168760204081633000000'),
				ethers.BigNumber.from('100000000000000000')
			);

			// Withdraw the remainder of Bob's LP tokens.
			let bobInitialLpBalance = await LPToken.balanceOf(bob.address);
			await NTStaking.connect(bob.signer).withdraw(
				ASSETS.LP.id,
				ethers.utils.parseEther('10')
			);
			let bobLpBalance = await LPToken.balanceOf(bob.address);
			bobLpBalance.sub(bobInitialLpBalance).should.be.equal(
				ethers.utils.parseEther('10')
			);
			await NTCitizenDeploy.connect(bob.signer).getReward();
			bobBalanceInitial = bobBalance;
			bobBalance = await NTBytes2_0.balanceOf(bob.address);

			// Advance one additional day to check for partial withdrawal impact.
			await ethers.provider.send('evm_setNextBlockTimestamp', [
				bobStakeTime + (60 * 60 * 24 * 365 * 5 + 60 * 60 * 24 * 2)
			]);
			await NTCitizenDeploy.connect(bob.signer).getReward();
			bobBalanceInitial = bobBalance;
			bobBalance = await NTBytes2_0.balanceOf(bob.address);
			bobBalance.sub(bobBalanceInitial).should.be.closeTo(
				ethers.BigNumber.from('144510204081633000000'),
				ethers.BigNumber.from('100000000000000000')
			);

			// Confirm that Bob can stake LP tokens with a new multiplier now.
			await NTStaking.connect(bob.signer).stake(
				ASSETS.LP.id,
				TIMELOCK_OPTION_IDS['180'],
				ethers.utils.parseEther('5'),
				0,
				0
			);

			// Confirm that Bob can withdraw his S2 Citizens.
			bobBalanceInitial = bobBalance;
			await NTStaking.connect(bob.signer).withdraw(
				ASSETS.S2_CITIZEN.id,
				s2One
			);
			bobBalance = await NTBytes2_0.balanceOf(bob.address);
			bobBalance.sub(bobBalanceInitial).should.be.closeTo(
				ethers.utils.parseEther('200'),
				ethers.BigNumber.from('3433776653933345')
			);
			bobBalanceInitial = bobBalance;
			await NTStaking.connect(bob.signer).withdraw(
				ASSETS.S2_CITIZEN.id,
				s2Two
			);
			bobBalance = await NTBytes2_0.balanceOf(bob.address);
			bobBalance.sub(bobBalanceInitial).should.be.closeTo(
				ethers.utils.parseEther('200'),
				ethers.BigNumber.from('3433776653933345')
			);

			// Confirm that the citizen balances are correct.
			let ownerOne = await NTOuterCitizenDeploy.ownerOf(s2One);
			ownerOne.should.be.equal(bob.address);
			let ownerTwo = await NTOuterCitizenDeploy.ownerOf(s2Two);
			ownerTwo.should.be.equal(bob.address);

			// Confirm that all S1 Citizens can be withdrawn.
			bobBalanceInitial = bobBalance;
			await NTStaking.connect(bob.signer).withdraw(
				ASSETS.S1_CITIZEN.id,
				citizenId1
			);
			bobBalance = await NTBytes2_0.balanceOf(bob.address);
			bobBalance.sub(bobBalanceInitial).should.be.closeTo(
				ethers.utils.parseEther('2000'),
				ethers.BigNumber.from('3433776653933345')
			);
			ownerOne = await NTCitizenDeploy.ownerOf(citizenId1);
			ownerOne.should.be.equal(bob.address);

			// Confirm that Alice can withdraw and receive the Vault.
			await NTCitizenDeploy.connect(alice.signer).getReward();
			aliceBalanceInitial = await NTBytes2_0.balanceOf(alice.address);
			await NTStaking.connect(alice.signer).withdraw(
				ASSETS.S1_CITIZEN.id,
				citizenNoVault
			);
			aliceBalance = await NTBytes2_0.balanceOf(alice.address);
			aliceBalance.sub(aliceBalanceInitial).should.be.closeTo(
				ethers.utils.parseEther('1000'),
				ethers.BigNumber.from('3433776653933345')
			);
			ownerOne = await NTCitizenDeploy.ownerOf(citizenNoVault);
			ownerOne.should.be.equal(alice.address);
			let vaultOwner = await vaultBox.ownerOf(vaultIdNoVault);
			vaultOwner.should.be.equal(alice.address);
		});

		// Simulate S1 Citizen staking.
		describe('with staked S1 Citizens', function () {
			let bobStakeTime, aliceStakeTime;
			beforeEach(async () => {

				// Bob stakes his S1 Citizen for 30 days.
				await NTStaking.connect(bob.signer).stake(
					ASSETS.S1_CITIZEN.id,
					TIMELOCK_OPTION_IDS['30'],
					citizenId1,
					0,
					0
				);

				// Get the time at which Bob staked.
				let priorBlockNumber = await ethers.provider.getBlockNumber();
				let priorBlock = await ethers.provider.getBlock(priorBlockNumber);
				bobStakeTime = priorBlock.timestamp;

				// Alice stakes her S1 Citizen with an additional Vault for 90 days.
				await NTStaking.connect(alice.signer).stake(
					ASSETS.S1_CITIZEN.id,
					TIMELOCK_OPTION_IDS['90'],
					citizenNoVault,
					vaultIdNoVault,
					0
				);

				// Alice stakes her S1 Hand Citizen for 180 days.
				await NTStaking.connect(alice.signer).stake(
					ASSETS.S1_CITIZEN.id,
					TIMELOCK_OPTION_IDS['180'],
					citizenHandOfCitadel,
					0,
					1
				);

				// Get the time at which Alice staked.
				priorBlockNumber = await ethers.provider.getBlockNumber();
				priorBlock = await ethers.provider.getBlock(priorBlockNumber);
				aliceStakeTime = priorBlock.timestamp;
			});

			// Test Alice and Bob's stake with a reward rate-change mid-stake.
			it('S1 Citizens give correct reward', async function () {

				// Confirm that Bob's S1 Citizen has the expected staking state.
				let bobStakedS1 = await NTStaking.stakedS1(bob.address, citizenId1);
				bobStakedS1.points.should.be.equal(200);

				// Confirm Bob's current staker position.
				let bobS1Position = await NTStaking.getStakerPosition(
					bob.address,
					ASSETS.S1_CITIZEN.id
				);
				bobS1Position.should.deep.equal([ ethers.BigNumber.from(1) ]);

				// Confirm Bob's total staker position.
				let bobPosition = await NTStaking.getStakerPositions(bob.address);
				bobPosition.stakedS1Citizens[0].citizenId.should.be.equal(
					ethers.BigNumber.from(1)
				);

				// Confirm that Alice's S1 Citizen has the expected staking state.
				let aliceStakedS1 = await NTStaking.stakedS1(
					alice.address,
					citizenNoVault
				);
				aliceStakedS1.points.should.be.equal(625);

				// Confirm that Alice's S1 Hand Citizen has the expected staking state.
				let aliceStakedS1Hand = await NTStaking.stakedS1(
					alice.address,
					citizenHandOfCitadel
				);

				// S1 Hand Citizens are explicitly treated as if they have '?' Vaults.
				aliceStakedS1Hand.points.should.be.equal(1350);

				// Confirm Alice's current staker position.
				let aliceS1Position = await NTStaking.getStakerPosition(
					alice.address,
					ASSETS.S1_CITIZEN.id
				);
				aliceS1Position.should.deep.equal([
					ethers.BigNumber.from(2),
					ethers.BigNumber.from(3)
				]);

				// Confirm Alice's total staker position.
				let alicePosition = await NTStaking.getStakerPositions(alice.address);
				alicePosition.stakedS1Citizens[0].citizenId.should.be.equal(
					ethers.BigNumber.from(2)
				);
				alicePosition.stakedS1Citizens[1].citizenId.should.be.equal(
					ethers.BigNumber.from(3)
				);

				// Retrieve the current balances of BYTES.
				let daoBalanceInitial = await NTBytes2_0.balanceOf(treasury.address);
				let bobBalanceInitial = await NTBytes2_0.balanceOf(bob.address);
				let aliceBalanceInitial = await NTBytes2_0.balanceOf(alice.address);

				// Simulate Bob staking for 12 hours.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 12)
				]);
				await NTCitizenDeploy.connect(bob.signer).getReward();

				// Confirm Bob and the DAO received their proper share.
				let bobBalance = await NTBytes2_0.balanceOf(bob.address);
				bobBalance.sub(bobBalanceInitial).should.be.closeTo(
					ethers.BigNumber.from('8919540229885057471'),
					ethers.BigNumber.from('1000000000')
				);
				let daoBalanceBob = await NTBytes2_0.balanceOf(treasury.address);
				daoBalanceBob.sub(daoBalanceInitial).should.be.closeTo(
					ethers.BigNumber.from('275862068960000000'),
					ethers.BigNumber.from('1000000000')
				);

				// Simulate a change in reward rates 16-hours into Alice's stake.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					aliceStakeTime + (60 * 60 * 16)
				]);
				await NTStaking.connect(owner.signer).configurePools(
					[
						{
							assetType: ASSETS.S1_CITIZEN.id,
							daoTax: S1_DAO_SHARE,
							rewardWindows: [
								{
									startTime: 0,
									reward: ethers.utils.parseEther('200').div(60 * 60 * 24)
								},
								{
									startTime: aliceStakeTime + (60 * 60 * 16),
									reward: ethers.utils.parseEther('150').div(60 * 60 * 24)
								}
							]
						}
					]
				);

				// Simulate Alice staking for 24 hours.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					aliceStakeTime + (60 * 60 * 24)
				]);
				await NTCitizenDeploy.connect(alice.signer).getReward();

				// Confirm Alice and the DAO received their proper share.
				let aliceBalance = await NTBytes2_0.balanceOf(alice.address);
				aliceBalance.sub(aliceBalanceInitial).should.be.closeTo(
					ethers.BigNumber.from('161480842911877000000'),
					ethers.BigNumber.from('1000000000')
				);
				let daoBalanceAlice = await NTBytes2_0.balanceOf(treasury.address);
				daoBalanceAlice.sub(daoBalanceBob).should.be.closeTo(
					ethers.BigNumber.from('4994252873563220000'),
					ethers.BigNumber.from('1000000000')
				);

				// Simulate Alice staking for another 24 hours.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					aliceStakeTime + (60 * 60 * 24 * 2)
				]);
				await NTCitizenDeploy.connect(alice.signer).getReward();
				aliceBalanceInitial = aliceBalance;
				aliceBalance = await NTBytes2_0.balanceOf(alice.address);
				aliceBalance.sub(aliceBalanceInitial).should.be.closeTo(
					ethers.BigNumber.from('132120689655172000000'),
					ethers.BigNumber.from('1000000000')
				);
			});

			// Test withdrawing the S1 Citizens.
			it('S1 Citizens can be withdrawn', async () => {
	
				// Confirm that Bob can withdraw his S1 Citizen.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24 * 30)
				]);
				await NTStaking.connect(bob.signer).withdraw(
					ASSETS.S1_CITIZEN.id,
					citizenId1
				);
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					aliceStakeTime + (60 * 60 * 24 * 90)
				]);
				await NTStaking.connect(alice.signer).withdraw(
					ASSETS.S1_CITIZEN.id,
					citizenNoVault
				);
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					aliceStakeTime + (60 * 60 * 24 * 180)
				]);
				await NTStaking.connect(alice.signer).withdraw(
					ASSETS.S1_CITIZEN.id,
					citizenHandOfCitadel
				);

				// Confirm that the citizen balances are correct.
				let ownerOne = await NTCitizenDeploy.ownerOf(citizenId1);
				ownerOne.should.be.equal(bob.address);
				let ownerTwo = await NTCitizenDeploy.ownerOf(citizenNoVault);
				ownerTwo.should.be.equal(alice.address);
				let vaultOwner = await vaultBox.ownerOf(vaultIdNoVault);
				vaultOwner.should.be.equal(alice.address);
				let ownerThree = await NTCitizenDeploy.ownerOf(citizenHandOfCitadel);
				ownerThree.should.be.equal(alice.address);
			});
			
			// Test the timelock on withdrawing the S1 Citizens.
			it('S1 Citizens cannot be withdrawn early', async () => {
	
				// Confirm that Bob cannot withdraw his S1 Citizen early.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24 * 29)
				]);
				await expect(
					NTStaking.connect(bob.signer).withdraw(
						ASSETS.S1_CITIZEN.id,
						citizenId1
					)
				).to.be.revertedWith('TimelockNotCleared');
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					aliceStakeTime + (60 * 60 * 24 * 89)
				]);
				await expect(
					NTStaking.connect(alice.signer).withdraw(
						ASSETS.S1_CITIZEN.id,
						citizenNoVault
					)
				).to.be.revertedWith('TimelockNotCleared');
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					aliceStakeTime + (60 * 60 * 24 * 179)
				]);
				await expect(
					NTStaking.connect(alice.signer).withdraw(
						ASSETS.S1_CITIZEN.id,
						citizenHandOfCitadel
					)
				).to.be.revertedWith('TimelockNotCleared');

				// Confirm that the citizen balances are correct.
				let ownerOne = await NTCitizenDeploy.ownerOf(citizenId1);
				ownerOne.should.be.equal(NTStaking.address);
				let ownerTwo = await NTCitizenDeploy.ownerOf(citizenNoVault);
				ownerTwo.should.be.equal(NTStaking.address);
				let vaultOwner = await vaultBox.ownerOf(vaultIdNoVault);
				vaultOwner.should.be.equal(NTStaking.address);
				let ownerThree = await NTCitizenDeploy.ownerOf(citizenHandOfCitadel);
				ownerThree.should.be.equal(NTStaking.address);
			});

			// Confirm that callers cannot steal S1 Citizens.
			it('cannot withdraw unowned S1 Citizens', async () => {
	
				// Confirm that Bob cannot withdraw Alice's S1 Citizen.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24 * 30)
				]);
				await expect(
					NTStaking.connect(bob.signer).withdraw(
						ASSETS.S1_CITIZEN.id,
						citizenHandOfCitadel
					)
				).to.be.revertedWith('CannotWithdrawUnownedS1');
			});

			// Confirm that callers cannot boost other Citizens.
			it('cannot stake BYTES into unowned S1 Citizens', async () => {
	
				// Activate the ability to stake BYTES into Citizens.
				await NTStaking.connect(owner.signer).configurePools(
					[
						{
							assetType: ASSETS.BYTES.id,
							daoTax: 0,
							rewardWindows: [
								{
									startTime: 0,
									reward: 0
								}
							]
						}
					]
				);

				// Prevent wasting BYTES.
				await expect(
					NTStaking.connect(bob.signer).stake(
						ASSETS.BYTES.id,
						TIMELOCK_OPTION_IDS['30'],
						ethers.utils.parseEther('200'),
						citizenHandOfCitadel,
						1
					)
				).to.be.revertedWith('CannotStakeIntoUnownedCitizen');
				await expect(
					NTStaking.connect(bob.signer).stake(
						ASSETS.BYTES.id,
						TIMELOCK_OPTION_IDS['30'],
						ethers.utils.parseEther('200'),
						ethers.BigNumber.from(4),
						1
					)
				).to.be.revertedWith('CannotStakeIntoUnownedCitizen');
			});

			// Simulate BYTES 2.0 staking.
			describe('with staked BYTES', function () {
				beforeEach(async () => {

					// Activate the ability to stake BYTES into Citizens.
					await NTStaking.connect(owner.signer).configurePools(
						[
							{
								assetType: ASSETS.BYTES.id,
								daoTax: 0,
								rewardWindows: [
									{
										startTime: 0,
										reward: 0
									}
								]
							}
						]
					);

					// Bob maximally-stakes his Citizen.
					await NTStaking.connect(bob.signer).stake(
						ASSETS.BYTES.id,
						TIMELOCK_OPTION_IDS['30'],
						ethers.utils.parseEther('2000'),
						citizenId1,
						1
					);

					// Get the time at which Bob staked.
					let priorBlockNumber = await ethers.provider.getBlockNumber();
					let priorBlock = await ethers.provider.getBlock(priorBlockNumber);
					bobStakeTime = priorBlock.timestamp;

					// Alice maximally-stakes her Citizens.
					await NTStaking.connect(alice.signer).stake(
						ASSETS.BYTES.id,
						TIMELOCK_OPTION_IDS['30'],
						ethers.utils.parseEther('2000'),
						citizenNoVault,
						1
					);
					await NTStaking.connect(alice.signer).stake(
						ASSETS.BYTES.id,
						TIMELOCK_OPTION_IDS['30'],
						ethers.utils.parseEther('2000'),
						citizenHandOfCitadel,
						1
					);

					// Get the time at which Alice staked.
					priorBlockNumber = await ethers.provider.getBlockNumber();
					priorBlock = await ethers.provider.getBlock(priorBlockNumber);
					aliceStakeTime = priorBlock.timestamp;
				});

				// Test Alice and Bob's stake with a reward rate-change mid-stake.
				it('S1 Citizens give correct reward', async function () {

					// Confirm that Bob's S1 Citizen has the expected staking state.
					let bobStakedS1 = await NTStaking.stakedS1(bob.address, citizenId1);
					bobStakedS1.points.should.be.equal(1200);

					// Confirm Bob's current staker position.
					let bobS1Position = await NTStaking.getStakerPosition(
						bob.address,
						ASSETS.S1_CITIZEN.id
					);
					bobS1Position.should.deep.equal([ ethers.BigNumber.from(1) ]);

					// Confirm Bob's total staker position.
					let bobPosition = await NTStaking.getStakerPositions(bob.address);
					bobPosition.stakedS1Citizens[0].citizenId.should.be.equal(
						ethers.BigNumber.from(1)
					);

					// Confirm that Alice's S1 Citizen has the expected staking state.
					let aliceStakedS1 = await NTStaking.stakedS1(
						alice.address,
						citizenNoVault
					);
					aliceStakedS1.points.should.be.equal(1625);
					let aliceStakedS1Hand = await NTStaking.stakedS1(
						alice.address,
						citizenHandOfCitadel
					);

					// S1 Hand Citizens are explicitly treated as if they have '?' Vaults.
					aliceStakedS1Hand.points.should.be.equal(2350);

					// Confirm Alice's current staker position.
					let aliceS1Position = await NTStaking.getStakerPosition(
						alice.address,
						ASSETS.S1_CITIZEN.id
					);
					aliceS1Position.should.deep.equal([
						ethers.BigNumber.from(2),
						ethers.BigNumber.from(3)
					]);

					// Confirm Alice's total staker position.
					let alicePosition = await NTStaking.getStakerPositions(alice.address);
					alicePosition.stakedS1Citizens[0].citizenId.should.be.equal(
						ethers.BigNumber.from(2)
					);
					alicePosition.stakedS1Citizens[1].citizenId.should.be.equal(
						ethers.BigNumber.from(3)
					);

					// Retrieve the current balances of BYTES.
					let daoBalanceInitial = await NTBytes2_0.balanceOf(treasury.address);
					let aliceBalanceInitial = await NTBytes2_0.balanceOf(alice.address);

					// Simulate Bob staking for 12 hours.
					let bobBalanceInitial = await NTBytes2_0.balanceOf(bob.address);
					await ethers.provider.send('evm_setNextBlockTimestamp', [
						bobStakeTime + (60 * 60 * 12)
					]);
					await NTCitizenDeploy.connect(bob.signer).getReward();

					// Confirm Bob and the DAO received their proper share.
					let bobBalance = await NTBytes2_0.balanceOf(bob.address);
					bobBalance.sub(bobBalanceInitial).should.be.closeTo(
						ethers.BigNumber.from('22492753623188400000'),
						ethers.BigNumber.from('1000000000')
					);
					let daoBalanceBob = await NTBytes2_0.balanceOf(treasury.address);
					daoBalanceBob.sub(daoBalanceInitial).should.be.closeTo(
						ethers.BigNumber.from('695652173913044000'),
						ethers.BigNumber.from('1000000000')
					);

					// Simulate a change in reward rates 16-hours into Alice's stake.
					await ethers.provider.send('evm_setNextBlockTimestamp', [
						aliceStakeTime + (60 * 60 * 16)
					]);
					await NTStaking.connect(owner.signer).configurePools(
						[
							{
								assetType: ASSETS.S1_CITIZEN.id,
								daoTax: S1_DAO_SHARE,
								rewardWindows: [
									{
										startTime: 0,
										reward: ethers.utils.parseEther('200').div(60 * 60 * 24)
									},
									{
										startTime: aliceStakeTime + (60 * 60 * 16),
										reward: ethers.utils.parseEther('150').div(60 * 60 * 24)
									}
								]
							}
						]
					);

					// Simulate Alice staking for 24 hours.
					await ethers.provider.send('evm_setNextBlockTimestamp', [
						aliceStakeTime + (60 * 60 * 24)
					]);
					await NTCitizenDeploy.connect(alice.signer).getReward();

					// Confirm Alice and the DAO received their proper share.
					let aliceBalance = await NTBytes2_0.balanceOf(alice.address);
					aliceBalance.sub(aliceBalanceInitial).should.be.closeTo(
						ethers.BigNumber.from('136596618357488000000'),
						ethers.BigNumber.from('1000000000')
					);
					let daoBalanceAlice = await NTBytes2_0.balanceOf(treasury.address);
					daoBalanceAlice.sub(daoBalanceBob).should.be.closeTo(
						ethers.BigNumber.from('4224637681159420000'),
						ethers.BigNumber.from('1000000000')
					);
				});

				// Test withdrawing the S1 Citizens with BYTES.
				it('withdrawing S1 returns staked BYTES', async () => {
		
					// Check the outflow of BYTES held directly by the staker.
					let stakerBalanceInitial = await NTBytes2_0.balanceOf(
						NTStaking.address
					);

					// Confirm that Bob can withdraw his S1 Citizen.
					await ethers.provider.send('evm_setNextBlockTimestamp', [
						bobStakeTime + (60 * 60 * 24 * 30)
					]);
					await NTStaking.connect(bob.signer).withdraw(
						ASSETS.S1_CITIZEN.id,
						citizenId1
					);
					await ethers.provider.send('evm_setNextBlockTimestamp', [
						aliceStakeTime + (60 * 60 * 24 * 90)
					]);
					await NTStaking.connect(alice.signer).withdraw(
						ASSETS.S1_CITIZEN.id,
						citizenNoVault
					);
					await ethers.provider.send('evm_setNextBlockTimestamp', [
						aliceStakeTime + (60 * 60 * 24 * 180)
					]);
					await NTStaking.connect(alice.signer).withdraw(
						ASSETS.S1_CITIZEN.id,
						citizenHandOfCitadel
					);

					// Confirm that the staker has returned the escrow BYTES.
					let stakerBalance = await NTBytes2_0.balanceOf(NTStaking.address);
					stakerBalanceInitial.sub(stakerBalance).should.be.equal(
						ethers.utils.parseEther('6000')
					);

					// Confirm that the citizen balances are correct.
					let ownerOne = await NTCitizenDeploy.ownerOf(citizenId1);
					ownerOne.should.be.equal(bob.address);
					let ownerTwo = await NTCitizenDeploy.ownerOf(citizenNoVault);
					ownerTwo.should.be.equal(alice.address);
					let vaultOwner = await vaultBox.ownerOf(vaultIdNoVault);
					vaultOwner.should.be.equal(alice.address);
					let ownerThree = await NTCitizenDeploy.ownerOf(citizenHandOfCitadel);
					ownerThree.should.be.equal(alice.address);
				});
			});
		});

		// Simulate S2 Citizen staking.
		describe('with staked S2 Citizens', function () {
			let bobStakeTime;
			beforeEach(async () => {

				// Stake Bob's S2 Citizens.
				await NTStaking.connect(bob.signer).stake(
					ASSETS.S2_CITIZEN.id,
					TIMELOCK_OPTION_IDS['30'],
					s2One,
					0,
					0
				);
				await NTStaking.connect(bob.signer).stake(
					ASSETS.S2_CITIZEN.id,
					TIMELOCK_OPTION_IDS['90'],
					s2Two,
					0,
					0
				);
	
				// Get the time at which Bob staked.
				let priorBlockNumber = await ethers.provider.getBlockNumber();
				let priorBlock = await ethers.provider.getBlock(priorBlockNumber);
				bobStakeTime = priorBlock.timestamp;
			});

			// Test Bob's staked S2 Citizens.
			it('S2 Citizens give correct reward', async function () {

				// Validate the correctness of Bob's staker state.
				let bobPosition = await NTStaking.getStakerPositions(bob.address);
				bobPosition.stakedS2Citizens[0].citizenId.should.be.equal(
					ethers.BigNumber.from(1)
				);
				bobPosition.stakedS2Citizens[0].points.should.be.equal(
					ethers.BigNumber.from(100)
				);
				bobPosition.stakedS2Citizens[1].citizenId.should.be.equal(
					ethers.BigNumber.from(2)
				);
				bobPosition.stakedS2Citizens[1].points.should.be.equal(
					ethers.BigNumber.from(125)
				);

				// Jump to one day after Bob's S2 stake.
				let bobBalance = await NTBytes2_0.balanceOf(bob.address);
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24)
				]);
	
				// Verify correct reward totals.
				await NTCitizenDeploy.connect(bob.signer).getReward();
				let bobBalanceInitial = bobBalance;
				bobBalance = await NTBytes2_0.balanceOf(bob.address);
				bobBalance.sub(bobBalanceInitial).should.be.closeTo(
					ethers.BigNumber.from('97000000000000000000'),
					ethers.BigNumber.from('100000000000000000')
				);
			});

			// Test withdrawing the S2 Citizens.
			it('S2 Citizens can be withdrawn', async () => {
				
				// Confirm that Bob can withdraw his S2 Citizens.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24 * 30)
				]);
				await NTStaking.connect(bob.signer).withdraw(
					ASSETS.S2_CITIZEN.id,
					s2One
				);
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24 * 90)
				]);
				await NTStaking.connect(bob.signer).withdraw(
					ASSETS.S2_CITIZEN.id,
					s2Two
				);

				// Confirm that the citizen balances are correct.
				let ownerOne = await NTOuterCitizenDeploy.ownerOf(s2One);
				ownerOne.should.be.equal(bob.address);
				let ownerTwo = await NTOuterCitizenDeploy.ownerOf(s2Two);
				ownerTwo.should.be.equal(bob.address);
			});

			// Test the timelock on withdrawing the S2 Citizens.
			it('S2 Citizens cannot be withdrawn early', async () => {
	
				// Confirm that Bob cannot withdraw his S2 Citizens early.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24 * 15)
				]);
				await expect(
					NTStaking.connect(bob.signer).withdraw(
						ASSETS.S2_CITIZEN.id,
						s2One
					)
				).to.be.revertedWith('TimelockNotCleared');
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24 * 45)
				]);
				await expect(
					NTStaking.connect(bob.signer).withdraw(
						ASSETS.S2_CITIZEN.id,
						s2Two
					)
				).to.be.revertedWith('TimelockNotCleared');

				// Confirm that the citizen balances are correct.
				let ownerOne = await NTOuterCitizenDeploy.ownerOf(s2One);
				ownerOne.should.be.equal(NTStaking.address);
				let ownerTwo = await NTOuterCitizenDeploy.ownerOf(s2Two);
				ownerTwo.should.be.equal(NTStaking.address);
			});

			// Confirm that callers cannot steal S2 Citizens.
			it('cannot withdraw unowned S2 Citizens', async () => {
	
				// Confirm that Bob can withdraw his S2 Citizens.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24 * 30)
				]);
				await expect(
					NTStaking.connect(bob.signer).withdraw(
						ASSETS.S2_CITIZEN.id,
						ethers.BigNumber.from('3')
					)
				).to.be.revertedWith('CannotWithdrawUnownedS2');
			});

			// Confirm that callers cannot boost other Citizens.
			it('cannot stake BYTES into unowned S2 Citizens', async () => {

				// Activate the ability to stake BYTES into Citizens.
				await NTStaking.connect(owner.signer).configurePools(
					[
						{
							assetType: ASSETS.BYTES.id,
							daoTax: 0,
							rewardWindows: [
								{
									startTime: 0,
									reward: 0
								}
							]
						}
					]
				);

				// Prevent wasting BYTES.
				await expect(
					NTStaking.connect(bob.signer).stake(
						ASSETS.BYTES.id,
						TIMELOCK_OPTION_IDS['30'],
						ethers.utils.parseEther('200'),
						ethers.BigNumber.from(3),
						2
					)
				).to.be.revertedWith('CannotStakeIntoUnownedCitizen');
			});

			// Simulate BYTES 2.0 staking.
			describe('with staked BYTES', function () {
				beforeEach(async () => {

					// Activate the ability to stake BYTES into Citizens.
					await NTStaking.connect(owner.signer).configurePools(
						[
							{
								assetType: ASSETS.BYTES.id,
								daoTax: 0,
								rewardWindows: [
									{
										startTime: 0,
										reward: 0
									}
								]
							}
						]
					);

					// Bob maximally-stakes his Citizens.
					await NTStaking.connect(bob.signer).stake(
						ASSETS.BYTES.id,
						TIMELOCK_OPTION_IDS['30'],
						ethers.utils.parseEther('200'),
						s2One,
						2
					);
					await NTStaking.connect(bob.signer).stake(
						ASSETS.BYTES.id,
						TIMELOCK_OPTION_IDS['30'],
						ethers.utils.parseEther('200'),
						s2Two,
						2
					);

					// Get the time at which Bob staked.
					let priorBlockNumber = await ethers.provider.getBlockNumber();
					let priorBlock = await ethers.provider.getBlock(priorBlockNumber);
					bobStakeTime = priorBlock.timestamp;
				});

				// Test Bob's stake.
				it('S2 Citizens give correct reward', async function () {

					// Validate the correctness of Bob's staker state.
					let bobPosition = await NTStaking.getStakerPositions(bob.address);
					bobPosition.stakedS2Citizens[0].citizenId.should.be.equal(
						ethers.BigNumber.from(1)
					);
					bobPosition.stakedS2Citizens[0].points.should.be.equal(
						ethers.BigNumber.from(200)
					);
					bobPosition.stakedS2Citizens[1].citizenId.should.be.equal(
						ethers.BigNumber.from(2)
					);
					bobPosition.stakedS2Citizens[1].points.should.be.equal(
						ethers.BigNumber.from(225)
					);

					// Jump to one day after Bob's S2 stake.
					let bobBalance = await NTBytes2_0.balanceOf(bob.address);
					await ethers.provider.send('evm_setNextBlockTimestamp', [
						bobStakeTime + (60 * 60 * 24)
					]);
		
					// Verify correct reward totals.
					await NTCitizenDeploy.connect(bob.signer).getReward();
					let bobBalanceInitial = bobBalance;
					bobBalance = await NTBytes2_0.balanceOf(bob.address);
					bobBalance.sub(bobBalanceInitial).should.be.closeTo(
						ethers.BigNumber.from('97000000000000000000'),
						ethers.BigNumber.from('100000000000000000')
					);
				});

				// Test withdrawing the S2 Citizens with BYTES.
				it('withdrawing S2 returns staked BYTES', async () => {
		
					// Check the outflow of BYTES held directly by the staker.
					let stakerBalanceInitial = await NTBytes2_0.balanceOf(
						NTStaking.address
					);

					// Confirm that Bob can withdraw his S2 Citizens.
					await ethers.provider.send('evm_setNextBlockTimestamp', [
						bobStakeTime + (60 * 60 * 24 * 30)
					]);
					await NTStaking.connect(bob.signer).withdraw(
						ASSETS.S2_CITIZEN.id,
						s2One
					);
					await ethers.provider.send('evm_setNextBlockTimestamp', [
						bobStakeTime + (60 * 60 * 24 * 90)
					]);
					await NTStaking.connect(bob.signer).withdraw(
						ASSETS.S2_CITIZEN.id,
						s2Two
					);

					// Confirm that the citizen balances are correct.
					let ownerOne = await NTOuterCitizenDeploy.ownerOf(s2One);
					ownerOne.should.be.equal(bob.address);
					let ownerTwo = await NTOuterCitizenDeploy.ownerOf(s2Two);
					ownerTwo.should.be.equal(bob.address);

					// Confirm that the staker has returned the escrow BYTES.
					let stakerBalance = await NTBytes2_0.balanceOf(NTStaking.address);
					stakerBalanceInitial.sub(stakerBalance).should.be.equal(
						ethers.utils.parseEther('400')
					);
				});
			});
		});

		// Simulate LP staking.
		describe('with staked LP tokens', function () {
			let aliceStakeTime, bobStakeTime;
			beforeEach(async () => {

				// Configure the LP token contract address on the staker.
				await NTStaking.connect(owner.signer).configureLP(LPToken.address);

				// Stake Alice's LP tokens for 30 days.
				await NTStaking.connect(alice.signer).stake(
					ASSETS.LP.id,
					TIMELOCK_OPTION_IDS['30'],
					ethers.utils.parseEther('40'),
					0,
					0
				);
				let priorBlockNumber = await ethers.provider.getBlockNumber();
				let priorBlock = await ethers.provider.getBlock(priorBlockNumber);
				aliceStakeTime = priorBlock.timestamp;

				// Stake Bob's LP tokens for 1080 days.
				await NTStaking.connect(bob.signer).stake(
					ASSETS.LP.id,
					TIMELOCK_OPTION_IDS['1080'],
					ethers.utils.parseEther('10'),
					0,
					0
				);
				priorBlockNumber = await ethers.provider.getBlockNumber();
				priorBlock = await ethers.provider.getBlock(priorBlockNumber);
				bobStakeTime = priorBlock.timestamp;
			});

			// Test the LP token stake.
			it('LP tokens give correct reward', async function () {

				// Validate the correctness of Alice's staker state.
				let alicePosition = await NTStaking.getStakerPositions(alice.address);
				alicePosition.stakedLPPosition.amount.should.be.equal(
					ethers.utils.parseEther('40')
				);
				alicePosition.stakedLPPosition.points.should.be.equal(4000);
	
				// Validate the correctness of Bob's staker state.
				let bobPosition = await NTStaking.getStakerPositions(bob.address);
				bobPosition.stakedLPPosition.amount.should.be.equal(
					ethers.utils.parseEther('10')
				);
				bobPosition.stakedLPPosition.points.should.be.equal(4000);
	
				// Jump to one day after Bob's LP stake.
				let aliceBalance = await NTBytes2_0.balanceOf(alice.address);
				let bobBalance = await NTBytes2_0.balanceOf(bob.address);
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24)
				]);
	
				// Verify correct reward totals.
				await NTCitizenDeploy.connect(bob.signer).getReward();
				let bobBalanceInitial = bobBalance;
				bobBalance = await NTBytes2_0.balanceOf(bob.address);
				bobBalance.sub(bobBalanceInitial).should.be.closeTo(
					ethers.BigNumber.from('24250000000000000000'),
					ethers.BigNumber.from('100000000000000000')
				);
				await NTCitizenDeploy.connect(alice.signer).getReward();
				let aliceBalanceInitial = aliceBalance;
				aliceBalance = await NTBytes2_0.balanceOf(alice.address);
				aliceBalance.sub(aliceBalanceInitial).should.be.closeTo(
					ethers.BigNumber.from('24250000000000000000'),
					ethers.BigNumber.from('100000000000000000')
				);
			});

			// Test withdrawing LP tokens.
			it('LP tokens can be withdrawn', async () => {

				// Withdraw Alice's LP tokens.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					aliceStakeTime + (60 * 60 * 24 * 30)
				]);
				let aliceInitialLpBalance = await LPToken.balanceOf(alice.address);
				await NTStaking.connect(alice.signer).withdraw(
					ASSETS.LP.id,
					ethers.utils.parseEther('40')
				);
				let aliceLpBalance = await LPToken.balanceOf(alice.address);
				aliceLpBalance.sub(aliceInitialLpBalance).should.be.equal(
					ethers.utils.parseEther('40')
				);

				// Withdraw Bob's LP tokens.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24 * 1080)
				]);
				let bobInitialLpBalance = await LPToken.balanceOf(bob.address);
				await NTStaking.connect(bob.signer).withdraw(
					ASSETS.LP.id,
					ethers.utils.parseEther('10')
				);
				let bobLpBalance = await LPToken.balanceOf(bob.address);
				bobLpBalance.sub(bobInitialLpBalance).should.be.equal(
					ethers.utils.parseEther('10')
				);

				// Confirm that callers can stake LP tokens with a new multiplier now.
				await NTStaking.connect(alice.signer).stake(
					ASSETS.LP.id,
					TIMELOCK_OPTION_IDS['180'],
					ethers.utils.parseEther('40'),
					0,
					0
				);
				await NTStaking.connect(bob.signer).stake(
					ASSETS.LP.id,
					TIMELOCK_OPTION_IDS['180'],
					ethers.utils.parseEther('10'),
					0,
					0
				);
			});

			// Test the timelock on withdrawing the LP tokens.
			it('LP tokens cannot be withdrawn early', async () => {

				// Confirm that Bob cannot withdraw his S2 Citizens early.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					aliceStakeTime + (60 * 60 * 24 * 29)
				]);
				await expect(
					NTStaking.connect(alice.signer).withdraw(
						ASSETS.LP.id,
						ethers.utils.parseEther('40')
					)
				).to.be.revertedWith('TimelockNotCleared');
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					bobStakeTime + (60 * 60 * 24 * 1079)
				]);
				await expect(
					NTStaking.connect(bob.signer).withdraw(
						ASSETS.LP.id,
						ethers.utils.parseEther('10')
					)
				).to.be.revertedWith('TimelockNotCleared');

				// Confirm that the LP balances are correct.
				let stakerBalance = await LPToken.balanceOf(NTStaking.address);
				stakerBalance.should.be.equal(ethers.utils.parseEther('50'));
			});

			// Confirm staker enforces withdrawal limits.
			it('cannot withdraw unowned LP tokens', async () => {

				// Withdraw Alice's LP tokens.
				await ethers.provider.send('evm_setNextBlockTimestamp', [
					aliceStakeTime + (60 * 60 * 24 * 30)
				]);
				await expect(
					NTStaking.connect(alice.signer).withdraw(
						ASSETS.LP.id,
						ethers.utils.parseEther('41')
					)
				).to.be.revertedWith('NotEnoughLPTokens');

				// Confirm that the LP balances are correct.
				let stakerBalance = await LPToken.balanceOf(NTStaking.address);
				stakerBalance.should.be.equal(ethers.utils.parseEther('50'));
			});

			// Confirm staker enforces timelock matching.
			it('cannot stake LPs with mismatched timelock', async () => {
				await expect(
					NTStaking.connect(alice.signer).stake(
						ASSETS.LP.id,
						TIMELOCK_OPTION_IDS['90'],
						ethers.utils.parseEther('40'),
						0,
						0
					)
				).to.be.revertedWith('MismatchedTimelock');
			});
		});
	});
});
