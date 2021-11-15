require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require('hardhat-deploy')
require('solidity-coverage')
require('hardhat-contract-sizer');
require('dotenv').config()

module.exports = {
    solidity: {
        compilers: [
            { version: "0.8.0" }, // MUST SAME AS .sol FILES VERSION !!! IF NOT HAVE VERIFY ISSUE !!!
            { version: "0.4.24" }, // for mocks
            { version: "0.6.6" } // for mocks
        ],
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // // If you want to do some forking, uncomment this
            // forking: {
            //   url: RPC_URL_MAINNET
            // }
        },
        localhost: {},
        rinkeby: {
            url: process.env.RPC_URL_RINKEBY,
            accounts: {
                mnemonic: process.env.MNEMONIC_0,
            },
            saveDeployments: true,
        },
        polygon_mumbai: {
            url: "https://rpc-mumbai.maticvigil.com/",
            accounts: {
                mnemonic: process.env.MNEMONIC_0,
            },
            saveDeployments: true,
        },
        // polygon-mainnet: {
        //     url: "https://polygon-rpc.com/",
        //     // accounts: {
        //     //     mnemonic: process.env.MNEMONIC_0,
        //     // },
        //     saveDeployments: true,
        // },
    },
    etherscan: {
        apiKey: process.env.API_KEY_ETHERSCAN
        // apiKey: process.env.API_KEY_POLYGONSCAN // actually no such thing polygonscan is powered by etherscan: https://github.com/nomiclabs/hardhat/issues/1727#issuecomment-931250893
    },
    namedAccounts: { // by hardhat-deploy
        deployer: {
            default: 0
        }
    },
    mocha: {
        timeout: 2000000 // 20000
    }
}