# Neo Tokyo contest details
- Total Prize Pool: Sum of below awards
  - HM awards: $42,500 USDC
  - QA report awards: $5,000 USDC
  - Gas report awards: $2,500 USDC
  - Judge + presort awards: $10,000 USDC
  - Scout awards: $500 USDC
- Join [C4 Discord](https://discord.gg/code4rena) to register
- Submit findings [using the C4 form](https://code4rena.com/contests/2023-03-neo-tokyo-contest/submit)
- [Read our guidelines for more details](https://docs.code4rena.com/roles/wardens)
- Starts  March 08, 2023 20:00 UTC
- Ends March 15, 2023 20:00 UTC

## Automated Findings / Publicly Known Issues

Automated findings output for the contest can be found [here](https://gist.github.com/Picodes/01427c59b07c651699136589541159a7) within an hour of contest opening.

*Note for C4 wardens: Anything included in the automated findings output is considered a publicly known issue and is ineligible for awards.*

# Overview

The Neo Tokyo ecosystem can be complicated to explain. To request any additional clarification, please contact Tim Clancy. Any answered questions will be added to an FAQ section.
- Twitter [@_Enoch](http://twitter.com/_Enoch)
- Telegram (@TimTinkers)
- Discord (0x Tim Clancy#0001)

[Neo Tokyo](https://neotokyo.codes) is an NFT ecosystem consisting of:
- [Neo Tokyo S1 Identities](https://etherscan.io/address/0x86357a19e5537a8fba9a004e555713bc943a66c0) stored for testing here in this repository as [`beckLoot.sol`](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/s1/beckLoot.sol).
- [Neo Tokyo S1 Vaults](https://etherscan.io/address/0xab0b0dd7e4eab0f9e31a539074a03f1c1be80879) stored for testing here in this repository as [`vaultBox.sol`](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/s1/vaultBox.sol).
- [Neo Tokyo S1 Items](https://etherscan.io/address/0x0938e3f7ac6d7f674fed551c93f363109bda3af9) stored for testing here in this repository as [`NTItems.sol`](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/s1/NTItems.sol).
- [Neo Tokyo S1 Land](https://etherscan.io/address/0x3c54b798b3aad4f6089533af3bdbd6ce233019bb) stored for testing here in this repository as [`NTLandDeploy.sol`](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/s1/NTLandDeploy.sol).
- [Neo Tokyo BYTES 1.0](https://etherscan.io/address/0x7d647b1a0dcd5525e9c6b3d14be58f27674f8c95) stored for testing here in this repository as [`BYTESContract.sol`](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/s1/BYTESContract.sol).
- [Neo Tokyo S1 Citizens](https://etherscan.io/address/0xb668beb1fa440f6cf2da0399f8c28cab993bdd65) stored for testing here in this repository as [`NTCitizenDeploy.sol`](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/s1/NTCitizenDeploy.sol). Neo Tokyo S1 Citizens are currently created by burning BYTES 1.0 tokens and combining an S1 Identity, S1 Item, S1 Land, and *optionally* an S1 Vault. As part of these contracts, this S1 Citizen creation process will begin using the new [BYTES 2.0](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/staking/BYTES2.sol) contract.

Similarly to the Neo Tokyo S1 Citizens, there exists an ecosystem of Neo Tokyo S2 Citizens:
- [Neo Tokyo S2 Identities](https://etherscan.io/address/0x698fbaaca64944376e2cdc4cad86eaa91362cf54) stored for testing here in this repository as [`NTOuterIdentity.sol`](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/s2/NTOuterIdentity.sol).
- [Neo Tokyo S2 Items](https://etherscan.io/address/0x7ac66d40d80d2d8d1e45d6b5b10a1c9d1fd69354) stored for testing here in this repository as [`NTS2Items.sol`](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/s2/NTS2Items.sol).
- [Neo Tokyo S2 Land](https://etherscan.io/address/0xf90980ae7a44e2d18b9615396ff5e9252f1df639) stored for testing here in this repository as [`NTS2LandDeploy.sol`](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/s2/NTS2LandDeploy.sol).
- [Neo Tokyo S2 Citizens](https://etherscan.io/address/0x9b091d2e0bb88ace4fe8f0fab87b93d8ba932ec4) stored for testing here in this repository as [`NTOuterCitizenDeploy.sol`](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/s2/NTOuterCitizenDeploy.sol). The Neo Tokyo S2 Citizen is created by combining the other component pieces, though that fact is irrelevant to the specifics of this staking system.

The Neo Tokyo staking program operates as follows:
- Holders of the existing Neo Tokyo BYTES 1.0 tokens may migrate them via upgrading into BYTES 2.0 tokens.
- Two thirds of burnt BYTES 2.0 tokens are reminted to the Neo Tokyo treasury.
- Holders of Neo Tokyo S1 Citizens, S2 Citizens, or BYTES 2.0 LP tokens may stake those assets into an escrow-based smart contract that holds those assets and rewards stakers with BYTES 2.0 tokens.
- The staker is a competitive system where stakers compete for a fixed emission rate in each of the S1 Citizen, S2 Citizen, and LP token staking pools.
- Stakers may choose to lock their assets for some period of time, preventing withdrawal, in exchange for a multiplying bonus to their share of points in competing for BYTES 2.0 token emissions.
- S1 Citizens all contain Identity component items. These Identities each have a "Credit Yield" trait which can be deduced from the S1 Citizen's total reward rate and the reward rate of any component Vault. S1 Citizens are each given a configurable point score based on the value of this "Credit Yield" trait.
- S1 Citizens may optionally contain a component Vault. S1 Citizens receive a multiplying bonus to their share of points based on the reward credit multiplier trait of their component Vault.
- S1 Citizens without a component Vault may also be staked directly with a non-component Vault to receive the same bonus as if that Vault were a component of the S1 Citizen.
- S1 Citizens have classes. The specific "Hand of the Citadel" class receives a bonus equivalent to having a `?`-tier Vault.
- S2 Citizens are all given the same point weight. This point weight can be modified by a timelock-based multiplier.
- Staking participants may also stake BYTES 2.0 tokens into their S1 or S2 Citizens in order to boost the points weight of those Citizens at a rate of 200 BYTES per point.
- S1 Citizens with a Vault (either component or directly-staked) have a maximum number of BYTES 2.0 tokens that may be staked to them equal to a configurable `VAULT_CAP` value.
- S1 Citizens with no associated Vault and all S2 Citizens have a maximum number of BYTES 2.0 tokens that may be staked to them equal to a configurable `NO_VAULT_CAP` value.
- When an S1 Citizen is withdrawn, any associated Vault and staked BYTES are also withdrawn.
- When an S2 Citizen is withdrawn, any staked BYTES are also withdrawn.
- Users may claim their accrued tokens at any time. Tokens are accrued block-by-block.
- When tokens are claimed, a configurable share of emitted BYTES 2.0 tokens is minted to the Neo Tokyo DAO treasury.

We are aware that a staker will continue earning their timelocked bonus after fulfilling their entire timelock duration. This is expected.

# Scope

The only contracts that are in scope for this contest are the two listed below, excluding any concerns regarding centralization or malicious administrator risk.

| Contract | SLOC | Purpose | Libraries used |  
| ----------- | ----------- | ----------- | ----------- |
| [BYTES2.sol](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/staking/BYTES2.sol) (partial, see below) | 88 | the new Neo Tokyo ERC-20 | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |
| [NeoTokyoStaker.sol](https://github.com/code-423n4/2023-03-neotokyo/blob/main/contracts/staking/NeoTokyoStaker.sol) (partial, see below) | 881 | the new Neo Tokyo staker | [`@openzeppelin/*`](https://openzeppelin.com/contracts/) |

We are already aware of some gas optimizations that we have opted not to make for the sake of clarity and simplicity, which we believe ultimately improves security. For each in-scope function we will note gas optimizations that we do not consider to be in-scope.

We are aware that specific assumptions about the Neo Tokyo ecosystem mean that structs can likely be packed more efficiently. Therefore we consider any gas optimization based on more efficiently aligning structs to be trivial and out of scope.

The `BYTES2` contract is the implementation of the new Neo Tokyo BYTES 2.0 smart contract, which will be configured across the entire ecosystem using existing Neo Tokyo administrative calls such as `NTCitizenDeploy.setBytesAddress`.

Within this contract, the only functions in scope are:
- `BYTES2.upgradeBytes`, which is intended to be called by any holder of the existing Neo Tokyo BYTES 1.0 ERC-20 token to let them convert some amount of their BYTES 1.0 tokens into BYTES 2.0 tokens.
- `BYTE2.getReward`, which is intended to be the primary entry-point for a staking caller to claim earned BYTES 2.0 tokens.
-- There may exist a more optimal way to perform this mint of BYTES than calculating the mintable BYTES totals through performing the cross-contract call to `NeoTokyoStaker.claimReward`. We don't care about this optimization if it should exist.
- `BYTES2.burn`, which is intended to use the `PermitControl` role system to allow configured administrative callers in the Neo Tokyo ecosystem to burn BYTES 2.0 tokens on behalf of users with no approval required. A finding related to a potential token holder's inability to directly burn their own ERC-20 tokens is out of scope. Any finding related to the centralized risk of an administrator maliciously burning all of a holder's tokens is out of scope. Any finding related to not being in perfect compliance with the ERC-20 standard is out of scope.
- `BYTES2.updateReward`, which is a no-op intended to let the BYTES 2.0 contract prevent functionality in the `NTCitizenDeploy` contract from breaking (namely `getReward`, `transferFrom`, and `safeTransferFrom`).
- `BYTES2.updateRewardOnMint`, which is a no-op intended to let the BYTES 2.0 contract prevent functionality in the `NTCitizenDeploy` contract from breaking (namely `createCitizen`).

The `NeoTokyoStaker` contract implements the new staking methodology in the Neo Tokyo ecosystem by which holders of Neo Tokyo Citizens (both S1 and S2) and holders of a future BYTES 2.0 LP token may earn BYTES 2.0 tokens. Excluding the initial migration by holders from BYTES 1.0 tokens to BYTES 2.0 tokens using `BYTES2.upgradeBytes`, the logic implemented in this contract is intended to be the only means by which new BYTES 2.0 tokens may be earned.

Within this contract, the only functions in scope are:
- `NeoTokyoStaker.getCreditYield`, which is intended to accurately deduce the otherwise-unavailable string "Credit Yield" trait of a Neo Tokyo S1 Citizen given its token ID and potential Vault ID.
- `NeoTokyoStaker.getConfiguredVaultMultiplier`, which is intended to accurately retrieve the administrator-configured values of Neo Tokyo vault configuration.
- `NeoTokyoStaker.getStakerPosition` and `NeoTokyoStaker.getStakerPositions`, which are intended to give accurate observability into the state of a particular staker's position across various staked assets.
- `NeoTokyoStaker._assetTransferFrom` and `NeoTokyoStaker._assetTransfer`, which are intended to support transfer of the Neo Tokyo S1 Citizens, S2 Citizens, BYTES 2.0 ERC-20 tokens, and future BYTES 2.0 LP tokens to and from the Neo Tokyo escrow-based staker contract. The only assets these functions operate on should be configurable by an administrator. Any findings related to any problems caused by malicious assets configured by administrators are therefore not valid.
- `NeoTokyoStaker._stakeS1Citizen`/`NeoTokyoStaker._stakeS2Citizen`/`NeoTokyoStaker._stakeBytes`/`NeoTokyoStaker._stakeLP`/`NeoTokyoStaker.stake`, which are intended to support staking various assets for being held in escrow by the Neo Tokyo staker contract. Ensuring the safety of these functions are a primary focus of this audit; staking logic should behave correctly and barring malicious administrator activity staker assets should always be recoverable.
- `NeoTokyoStaker.getPoolReward` and `NeoTokyoStaker.claimReward`, which are respectively intended to accurately calculate the pending rewards of a staker and permit the claiming of rewards through the `BYTES2.getReward` entry-point. Ensuring the safety and accuracy of these functions are a primary focus of this audit; barring malicious administrator activity stakers should receive the BYTES 2.0 tokens that they are entitled to without earning excessive tokens.
- `NeoTokyoStaker._withdrawS1Citizen`/`NeoTokyoStaker._withdrawS2Citizen`/`NeoTokyoStaker._withdrawLP`/`NeoTokyoStaker.withdraw`, which are intended to support withdrawing various assets that have been previously staked. Ensuring the safety and accuracy of these functions are a primary focus of this audit; withdrawing logic should behave correctly and barring malicious administrator activity withdrawing staker assets should always function correctly.

## Out of scope

Every file and contract function **not explicitly listed above is considered out of scope** for this contest in terms of both security and gas optimization. Any changes to the smart contracts which are stylistic in nature are also out of scope.

This includes the entire existing Neo Tokyo ecosystem consisting of the deployed mainnet versions of `beckLoot` (Neo Tokyo S1 Identities), `vaultBox` (Neo Tokyo S1 Vaults), `NTItems` (Neo Tokyo S1 Items), `NTLandDeploy` (Neo Tokyo S1 Land), `BYTESContract` (Neo Tokyo BYTES 1.0), `NTBytesBridge` (Neo Tokyo BYTES 1.0 Bridge), `NTCitizenDeploy` (Neo Tokyo S1 Citizen), `NTOuterIdentity` (Neo Tokyo S2 Identities), `NTS2Items` (Neo Tokyo S2 Items), `NTS2LandDeploy` (Neo Tokyo S2 Land), `NTOuterCitizenDeploy` (Neo Tokyo S2 Citizens).

This also includes the specific testing mock contracts `IdentityMint`, `VaultMint`, `CitizenMint`, and `LPToken`. These testing contracts are used to prepare mock data for their relevant Neo Tokyo ecosystem assets; in the production Neo Tokyo ecosystem this data was prepared using different administrative mechanisms assumed to be correct.

This also includes the `IByteContract`, `IGenericGetter` and `IStaker` interface contracts.

This also includes **any** OpenZeppelin dependencies being imported. Specifically `ReentrancyGuard`, `ERC20`, and `IERC20` are used in our two in-scope contracts. We assume these contracts to be safe. We know there may exist more gas-optimized alternatives to these contracts but that consideration remains out of scope.

This also includes the `PermitControl` dependency used for administrative access control. This is a well-tested contract that we consider completely out of scope.

This also includes any concerns about centralization or administrative functions in the smart contracts. We are aware of the damage that could be caused by both a malicious administrator or administrative misconfiguration. We will negate these concerns via other mechanisms (timelocks, future DAO caller, etc.) assuming the underlying safety of the relevant staking mechanisms. Specifically, these functions are completely out of scope in terms of both administrative functionality and gas optimization:
- `BYTES2.changeStakingContractAddress`, which is intended to let an administrator change the potential `NeoTokyoStaker` contract address.
- `BYTES2.changeTreasuryContractAddress`, which is intended to let an administrator change the address of the Neo Tokyo DAO treasury.
- `NeoTokyoStaker.configureLP`, which is intended to let an administrator change the address of the LP token.
- `NeoTokyoStaker.lockLP`, which is intended to let an administrator lock the LP token address against future changes.
- `NeoTokyoStaker.configureTimelockOptions`, which is intended to let an administrator configure available timelock staking options.
- `NeoTokyoStaker.configureIdentityCreditYields`, which is intended to let an administrator configure the available Neo Tokyo S1 Identity "Credit Yield" strings corresponding to S1 Citizen reward rate and Vault reward rate pairs.
- `NeoTokyoStaker.configureIdentityCreditPoints`, which is intended to let an administrator configure the points weight earned by each configured Neo Tokyo S1 Identity "Credit Yield" trait.
- `NeoTokyoStaker.configureVaultCreditMultipliers`, which is intended to let an administrator configure the point multipliers earned by each Citizen's component Vault.
- `NeoTokyoStaker.configurePools`, which is intended to let an administrator configure the reward points accrued by a particular asset type across a particular time window.
- `NeoTokyoStaker.configureCaps`, which is intended to let an administrator configure the respective Neo Tokyo S1 and S2 Citizen staking caps.

One exception that we consider out of scope for gas optimization but in scope for any security issues unrelated to a malicious administrator is the legacy reward-claiming flow of calling `NTCitizenDeploy.getReward`, which ultimately calls `BYTES2.getReward`. We support this legacy flow for historic UI reasons and would consider a security finding to be relevant.

# Additional Context

The most novel feature of this smart contract is perhaps the ability to boost the point weight of a staked S1 or S2 Citizen by depositing BYTES 2.0 tokens into the Citizen. Otherwise, this staking system is a rather straightforward timelocked staker where callers compete for a fixed emissions rate, similar to many previous implementations such as Chef Nomi's `MasterChef` staker for Sushi.

## Scoping Details 
```
- If you have a public code repo, please share it here: This contest repo is the only public code repo at this time.
- How many contracts are in scope?: 2
- Total SLoC for these contracts?: 969
- How many external imports are there?: 8
- How many separate interfaces and struct definitions are there for the contracts within scope?: 11
- Does most of your code generally use composition or inheritance?: Inheritance
- How many external calls?: 10
- What is the overall line coverage percentage provided by your tests?: 80
- Is there a need to understand a separate part of the codebase / get context in order to audit this part of the protocol?: True
- Please describe required context: The Neo Tokyo ecosystem consists of several NFT drops that were performed over time. These NFTs may ultimately be combined together to form a new type of NFT which is involved in this staking contract. Several of the details for staking logic are dictated by the independent component NFTs that were used in combining.
- Does it use an oracle?: No
- Does the token conform to the ERC20 standard?: True
- Are there any novel or unique curve logic or mathematical models?: There is nothing particularly novel here. The staking logic is essentially a Chef Nomi MasterChef-style competitive staker for fixed ERC-20 token emissions.
- Does it use a timelock function?: True
- Is it an NFT?: True
- Does it have an AMM?: False
- Is it a fork of a popular project?: False  
- Does it use rollups?: False
- Is it multi-chain?: False
- Does it use a side-chain?: False
- Describe any specific areas you would like addressed: We are most particularly concerned about ensuring that there is no way for a user to lose access to their staked NFTs or ERC-20 tokens. We are secondarily concerned about ensuring that there is no way for an attacker to earn excessive token emissions for their staking.
```

# Tests

To build the project from a fresh `git clone`, perform the following.
1. Install dependencies using `npm install`.
2. Run the test cases using `npx hardhat test`.
3. The Hardhat gas reporter is configured in `hardhat.config.js` and should provide automatic gas reporting for the relevant contracts used in testing.

## Scripts

In the [scripts](https://github.com/code-423n4/2023-03-neotokyo/tree/main/scripts) folder, you will find a `determine-citizen-yields.js` file along with an `output.txt` file that it generated. You should not need this information for testing, but it is included here to illustrate the method of deducing a Neo Tokyo S1 Citizen's component Identity "Credit Yield" trait as provided to the staker via `NeoTokyoStaker.configureIdentityCreditPoints`.
