import { SimpleToken, SimpleSwap } from '../typechain'
import { ethers } from 'hardhat'
import { BigNumber } from "ethers";

async function deploySimpleSwap() {
	const stakingTokenDeposit = BigNumber.from('5').pow('18').mul('10'); 
	const SimpleToken = await ethers.getContractFactory('SimpleToken')
	console.log('starting deploying tokens...')
	const token0 = await SimpleToken.deploy('TokenA', 'TKA') as SimpleToken
	console.log('Token A deployed with address: ' + token0.address)
	const token1 = await SimpleToken.deploy('TokenB', 'TKB') as SimpleToken
	console.log('Token B deployed with address: ' + token1.address)

	const SimpleSwap = await ethers.getContractFactory('SimpleSwap')
	console.log('starting deploying staking...')
	const simpleSwap = await SimpleSwap.deploy(token0.address, token1.address, 2000, 50) as SimpleSwap
	console.log('Staking deployed with address: ' + simpleSwap.address)

	await token1.transfer(simpleSwap.address, stakingTokenDeposit);
}

deploySimpleSwap()
.then(() => process.exit(0))
.catch(error => {
	console.error(error)
	process.exit(1)
})
