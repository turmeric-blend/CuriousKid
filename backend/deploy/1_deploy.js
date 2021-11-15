let { networkConfig } = require('../scripts/utils')
const fs = require('fs')

module.exports = async ({
    deployments,
    getNamedAccounts,
    getChainId,

}) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()

    // edit these as needed
    const maxTokens = 128
    const maxTokensAllowedPerAddress = 3
    const feeWei = "100000000000000000000" // 100 MATIC
    const hiddenURI = false
    const initBaseURI = "https://bafybeie7tfvkzrdf2n4f4sutqpu27gdhtbbwcwv74otbpzqmr2x3i4dmq4.ipfs.dweb.link/"
    const temporaryURI = "https://bafybeiexrjqcdzquhnf2uj5rzhavlqg2exerqjzafoi3c4ub6tn3xez4sq.ipfs.dweb.link/hidden.json"
    const percentageRoyalty = 10
    // const vrfCoordinator = networkConfig[chainId]["VRFCoordinator"]
    // const linkToken = networkConfig[chainId]["linkToken"]
    const keyHash = networkConfig[chainId]["keyHash"]
    const feeLink = networkConfig[chainId]["feeLink"]

    let vrfCoordinator
    let linkToken
    if (parseInt(chainId) === 31337) {
        const VRFCoordinatorMock_ = await get('VRFCoordinatorMock')
        const linkToken_ = await get('LinkToken')
        vrfCoordinator = VRFCoordinatorMock_.address
        linkToken = linkToken_.address
    } else {
        vrfCoordinator = networkConfig[chainId]["VRFCoordinator"]
        linkToken = networkConfig[chainId]["linkToken"]
    }

    const args = [maxTokens, maxTokensAllowedPerAddress, feeWei, hiddenURI, initBaseURI, temporaryURI, percentageRoyalty, vrfCoordinator, linkToken, keyHash, feeLink]

    log("----- deploy & verify-----")

    const contract = await deploy("CuriousKid", { // CuriousKid Marketplace
        from: deployer,
        args: args,
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })
    log(`# # # Deployed: ${contract.address}`)
    try {
        if (parseInt(chainId) !== 31337) {
            await sleep(100000) // 1 min zZZ
            // WARNING: might need wait awahile for block confirmations !!!
            await hre.run("verify:verify", { // https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html#using-programmatically
                address: contract.address,
                constructorArguments: args,
                // contract: "contracts/CuriousKid.sol:CuriousKid"
            })
            log(`# # # Verified: ${contract.address}`)
        } else {
            log("No verification needed for local deployment.")
        }
    } catch (error) {
        console.log(error)
    }

    const dir = './deployed_contract_details/CuriousKid/';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const abi = JSON.stringify({ abi: contract.abi })
    const address = JSON.stringify({ address: contract.address })

    fs.writeFileSync(`${dir}abi.json`, abi, function (err) {
        if (err) {
            console.log(err);
        }
    })
    fs.writeFileSync(`${dir}address.json`, address, function (err) {
        if (err) {
            console.log(err);
        }
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}