import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, network } from 'hardhat';
import { expect, assert } from 'chai';
import { BigNumber } from "ethers";

import Web3 from 'web3';
import { SimpleSwap, SimpleToken} from '../typechain';

// @ts-ignore
const web3 = new Web3(network.provider) as Web3;

//mocha step
describe('Contract: SimpleSwap', () => {
    const depositTotal = BigNumber.from('10').pow('18').mul('10');
    const stakingTokenDeposit = depositTotal.div(2);

    let tokenA: SimpleToken;
    let tokenB: SimpleToken;
    let simpleSwap: SimpleSwap;

    let owner: SignerWithAddress;
    let user0: SignerWithAddress;
    let user1: SignerWithAddress;

    beforeEach(async () => {
		[owner, user0, user1] = await ethers.getSigners();
        let SimpleToken = await ethers.getContractFactory('SimpleToken');
        let SimpleSwap = await ethers.getContractFactory('SimpleSwap');

        tokenA = await SimpleToken.deploy('Token A', 'TKA') as SimpleToken;
        tokenB = await SimpleToken.deploy('Token B', 'TKB') as SimpleToken;

        // rate = 2.000; fee = 0.05
        simpleSwap = await SimpleSwap.deploy(tokenA.address, tokenB.address, 2000, 50) as SimpleSwap;

        // we need some token B in order to change token A to token B
        tokenB.transfer(simpleSwap.address, stakingTokenDeposit);
	});

    describe('Deployment', () => {
		it('Chech simple Swap contract token balance', async () => {
			expect(await tokenB.balanceOf(simpleSwap.address)).to.equal(stakingTokenDeposit);
			expect(await tokenB.balanceOf(owner.address)).to.equal(depositTotal.sub(stakingTokenDeposit));
		});
    });

	describe('Owner side functions checking', () => {
		it('Withdraw all B tokens from the contract', async () => {
			expect(await simpleSwap.withdraw(tokenB.address, stakingTokenDeposit))
            .to.emit(simpleSwap, 'LogOwnerAction').withArgs(0, stakingTokenDeposit);
            
            expect(await tokenB.balanceOf(owner.address)).to.equal(depositTotal);
            expect(await tokenB.balanceOf(simpleSwap.address)).to.equal(0);
		});

		it('Change swap fee', async () => {
			const newFee = BigNumber.from('20');

            expect(await simpleSwap.setFeePercent(newFee)).to.emit(simpleSwap, 'LogOwnerAction')
            .withArgs(1, newFee);
            expect(await simpleSwap.feePercent()).to.equal(newFee);
		});

		it('Change token A address', async () => {
            await simpleSwap.setTokenA(tokenB.address)
            expect(await simpleSwap.tokenA()).to.equal(tokenB.address);
		});     

		it('Change token B address', async () => {
            await simpleSwap.setTokenB(tokenA.address)
            expect(await simpleSwap.tokenB()).to.equal(tokenA.address);
		});
	});

    describe('User side functions checking', () => {
		it('Swap A token to B token', async () => {
            await tokenA.transfer(user0.address, stakingTokenDeposit);
            await tokenA.connect(user0).approve(simpleSwap.address, depositTotal);

            const feePercent = await simpleSwap.feePercent();
            const rate = await simpleSwap.rate();
            const tokenAAmount = BigNumber.from('400');
            const tokenBAmount = BigNumber.from(1000).sub(feePercent).mul(tokenAAmount).mul(rate).div(1000000);

			expect(await simpleSwap.connect(user0).swap(tokenAAmount))
            .to.emit(simpleSwap, 'LogSwap').withArgs(user0.address, tokenAAmount, tokenBAmount);
            
            expect(await tokenB.balanceOf(user0.address)).to.equal(tokenBAmount);
		});
    });
});
