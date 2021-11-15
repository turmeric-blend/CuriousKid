let { networkConfig } = require('../scripts/utils')

module.exports = async ({
    deployments,
    getNamedAccounts,
    getChainId,

}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()

    if (chainId == 31337) { // deploy mocks if in local development network
        log("Currently on local development network, deploying mocks!")
        const linkToken = await deploy('LinkToken', { from: deployer, log: true })
        // await deploy('EthUsdAggregator', {
        //     contract: 'MockV3Aggregator',
        //     from: deployer,
        //     log: true,
        //     args: [DECIMALS, INITIAL_PRICE]
        // })
        await deploy('VRFCoordinatorMock', {
            from: deployer,
            log: true,
            args: [linkToken.address]
        })
        log("# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #")
        log("# # # # # # # # # # # # # # # # # # # # Mocks Deployed! # # # # # # # # # # # # # # # # # # # #")
        log("# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #")
        log("# # # You are deploying to a local network, you'll need a local network running to interact # #")
        log("# # # Please run `npx hardhat console` to interact with the deployed smart contracts! # # # # #")
        log("# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #")
    }
}