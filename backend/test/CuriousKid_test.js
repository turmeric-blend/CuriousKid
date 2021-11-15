// currently only supports testing in local network
// npx hardhat coverage --testfiles "test/*.js" | TODO: can't test internal/private fn/lines

const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("Curious Kid Contract", function () {

    let linkTokenMockContract
    let vrfCoordinatorMockContract
    let curiousKidContract
    let CuriousKid
    let accounts
    let curiousKidContract0
    let curiousKidContract1

    let maxTokens
    let maxTokensAllowedPerAddress
    let feeWei
    let hiddenURI
    let initBaseURI
    let temporaryURI
    let percentageRoyalty
    let vrfCoordinator
    let linkToken
    let keyHash
    let feeLink

    async function fundWithLink() {
        const linkTokenMockContract_ = new ethers.Contract(linkTokenMockContract.address, linkTokenMockContract.interface, accounts[0])
        var tx = await linkTokenMockContract_.transfer(curiousKidContract.address, ethers.utils.parseEther("0.0003"))
        await tx.wait()
    }

    before(async function () {
        const LinkTokenMock = await ethers.getContractFactory("LinkToken")
        const linkTokenMock = await LinkTokenMock.deploy()
        linkTokenMockContract = await linkTokenMock.deployed()

        const VRFCoordinatorMock = await ethers.getContractFactory("VRFCoordinatorMock")
        const vrfCoordinatorMock = await VRFCoordinatorMock.deploy(linkTokenMockContract.address)
        vrfCoordinatorMockContract = await vrfCoordinatorMock.deployed()

        maxTokens = 16
        maxTokensAllowedPerAddress = 6
        feeWei = ethers.utils.parseEther("10")
        hiddenURI = true
        initBaseURI = "https://gateway.pinata.cloud/ipfs/test-only/"
        temporaryURI = "https://gateway.pinata.cloud/ipfs/test-only/hidden.json"
        percentageRoyalty = 10
        linkToken = linkTokenMockContract.address
        vrfCoordinator = vrfCoordinatorMockContract.address
        keyHash = "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4" // from chainId: 80001
        feeLink = ethers.utils.parseEther("0.0001") // 0.0001 Link "100000000000000" // from chainId: 80001

        CuriousKid = await ethers.getContractFactory("CuriousKid")
    })

    beforeEach(async function () {
        const curiousKid = await CuriousKid.deploy(maxTokens, maxTokensAllowedPerAddress, feeWei, hiddenURI, initBaseURI, temporaryURI, percentageRoyalty, vrfCoordinator, linkToken, keyHash, feeLink)
        curiousKidContract = await curiousKid.deployed()
        accounts = await ethers.getSigners()

        await fundWithLink()

        curiousKidContract0 = new ethers.Contract(curiousKidContract.address, curiousKidContract.interface, accounts[0])
        curiousKidContract1 = new ethers.Contract(curiousKidContract.address, curiousKidContract.interface, accounts[1])
    })

    describe("Variables at Constructor", function () {
        it("Should be set as specified by argument inputs", async function () {
            expect(await curiousKidContract.totalTokensRemaining()).to.equal(maxTokens)
            expect(await curiousKidContract.maxTokensAllowedPerAddress()).to.equal(maxTokensAllowedPerAddress)
            expect(await curiousKidContract.feeWei()).to.equal(feeWei)
            expect(await curiousKidContract.hiddenURI()).to.equal(hiddenURI)
        })
    })

    describe("Royalty Value & Recipient at Constructor", function () {
        it("Should be the correct percentage value of input value", async function () {
            const inputValue = ethers.utils.parseEther("123")
            const royalty = await curiousKidContract.royaltyInfo(0, inputValue) // first argument doesn't matter
            const royaltyValue = String((percentageRoyalty * 100 * inputValue) / 10000)
            expect(royalty.royaltyAmount.toString()).to.equal(royaltyValue)
            const accounts = await ethers.getSigners()
            expect(royalty.receiver).to.equal(accounts[0].address)
        })
    })

    describe("listMintedTokensIds", function () {
        it("Should be zero length", async function () {
            expect(await curiousKidContract.listMintedTokensIds.length).to.equal(0)
        })
    })

    describe("onlyOwner", function () {
        it("Should pass", async function () {
            const tx = await curiousKidContract0.pause()
            await tx.wait()
            expect(tx.confirmations).to.equal(1)
        })

        it("Should revert if not owner", async function () {
            await expect(curiousKidContract1.pause()).to.be.revertedWith("Ownable: caller is not the owner")
        })
    })

    describe("whenNotPaused", function () {
        it("Should modified functions not callable when paused", async function () {
            var tx = await curiousKidContract.requestRandomIndex()
            await tx.wait()
            expect(tx.confirmations).to.equal(1)

            var tx = await curiousKidContract.pause()
            await tx.wait()
            await expect(curiousKidContract.requestRandomIndex()).to.be.revertedWith("Pausable: paused")
        })
    })

    describe("revealURI", function () {
        it("Should revert if hiddenURI initially false", async function () {
            const curiousKid = await CuriousKid.deploy(maxTokens, maxTokensAllowedPerAddress, feeWei, false, initBaseURI, temporaryURI, percentageRoyalty, vrfCoordinator, linkToken, keyHash, feeLink)
            curiousKidContract = await curiousKid.deployed()
            await expect(curiousKidContract.revealURI()).to.be.revertedWith("URI already revealed.")
        })

        it("Should set hiddenURI == false, if hiddenURI initially true", async function () {
            const curiousKid = await CuriousKid.deploy(maxTokens, maxTokensAllowedPerAddress, feeWei, true, initBaseURI, temporaryURI, percentageRoyalty, vrfCoordinator, linkToken, keyHash, feeLink)
            curiousKidContract = await curiousKid.deployed()
            const tx = await curiousKidContract.revealURI()
            await tx.wait()
            expect(await curiousKidContract.hiddenURI()).to.equal(false)
        })
    })

    describe("hideURI", function () {
        it("Should revert if hiddenURI initially true", async function () {
            const curiousKid = await CuriousKid.deploy(maxTokens, maxTokensAllowedPerAddress, feeWei, true, initBaseURI, temporaryURI, percentageRoyalty, vrfCoordinator, linkToken, keyHash, feeLink)
            curiousKidContract = await curiousKid.deployed()
            await expect(curiousKidContract.hideURI()).to.be.revertedWith("URI already hidden.")
        })

        it("Should set hiddenURI == true, if hiddenURI initially false", async function () {
            const curiousKid = await CuriousKid.deploy(maxTokens, maxTokensAllowedPerAddress, feeWei, false, initBaseURI, temporaryURI, percentageRoyalty, vrfCoordinator, linkToken, keyHash, feeLink)
            curiousKidContract = await curiousKid.deployed()
            const tx = await curiousKidContract.hideURI()
            await tx.wait()
            expect(await curiousKidContract.hiddenURI()).to.equal(true)
        })
    })

    describe("setMaxTokensMintablePerAddress", function () {
        it("Should revert if setting same max value", async function () {
            await expect(curiousKidContract.setMaxTokensMintablePerAddress(6)).to.be.revertedWith("Trying to set same max value.")
        })

        it("Should revert if setting max value less than zero", async function () {
            await expect(curiousKidContract.setMaxTokensMintablePerAddress(0)).to.be.revertedWith("Minimum of 1.")
        })

        it("Should set new max value", async function () {
            const maxTokensLower = 3
            var tx = await curiousKidContract.setMaxTokensMintablePerAddress(maxTokensLower)
            await tx.wait()
            expect(await curiousKidContract.maxTokensAllowedPerAddress()).to.equal(maxTokensLower)

            const maxTokensHigher = 9
            var tx = await curiousKidContract.setMaxTokensMintablePerAddress(maxTokensHigher)
            await tx.wait()
            expect(await curiousKidContract.maxTokensAllowedPerAddress()).to.equal(maxTokensHigher)
        })
    })

    describe("setMintFee", function () {
        it("Should revert if setting same fee value", async function () {
            await expect(curiousKidContract.setMintFee(ethers.utils.parseEther("10"))).to.be.revertedWith("Trying to set same fee value.")
        })

        it("Should set new fee value", async function () {
            const new_fee = ethers.utils.parseEther("11")
            var tx = await curiousKidContract.setMintFee(new_fee)
            await tx.wait()
            expect(await curiousKidContract.feeWei()).to.equal(new_fee)
        })
    })

    describe("setRoyalties", function () {
        it("Should revert if royalty percentage is beyond: 0 <= _percentageRoyalty <= 100", async function () {
            await expect(curiousKidContract.setRoyalties(accounts[0].address, 101)).to.be.revertedWith("0 <= _percentageRoyalty <= 100")
        })

        it("Should set new royalty recipient and value", async function () {
            const newRoyaltyPerc = 55
            const tx = curiousKidContract.setRoyalties(accounts[2].address, newRoyaltyPerc)

            const inputValue = ethers.utils.parseEther("123")
            const royalty = await curiousKidContract.royaltyInfo(0, inputValue) // first argument doesn't matter
            const royaltyValue = String((newRoyaltyPerc * 100 * inputValue) / 10000)
            expect(royalty.royaltyAmount.toString()).to.equal(royaltyValue)
            expect(royalty.receiver).to.equal(accounts[2].address)
        })

    })

    describe("enterWhitelist", function () {
        it("Should revert if entering owner", async function () {
            await expect(curiousKidContract.enterWhitelist(accounts[0].address)).to.be.revertedWith("Owner is beyond whitelist.")
        })

        it("Should revert if entering address already inside", async function () {
            const tx = await curiousKidContract.enterWhitelist(accounts[1].address)
            await tx.wait()
            await expect(curiousKidContract.enterWhitelist(accounts[1].address)).to.be.revertedWith("Already in whitelist.")
        })

        it("Should enter address into whitelist", async function () {
            const tx = await curiousKidContract.enterWhitelist(accounts[2].address)
            await tx.wait()
            expect(await curiousKidContract.inWhitelist(accounts[2].address)).to.equal(true)
        })
    })

    describe("exitWhitelist", function () {
        it("Should revert address not inside", async function () {
            await expect(curiousKidContract.exitWhitelist(accounts[1].address)).to.be.revertedWith("Not in whitelist.")
        })

        it("Should remove address from whitelist", async function () {
            var tx = await curiousKidContract.enterWhitelist(accounts[2].address)
            await tx.wait()
            expect(await curiousKidContract.inWhitelist(accounts[2].address)).to.equal(true)

            var tx = await curiousKidContract.exitWhitelist(accounts[2].address)
            await tx.wait()
            expect(await curiousKidContract.inWhitelist(accounts[2].address)).to.equal(false)
        })
    })

    describe("contractBalance", function () {
        it("Should return 0 at deployment", async function () {
            expect(await curiousKidContract.contractBalance()).to.equal(0)
        })

    })

    describe("withdraw", function () {
        it("Should withdraw all funds in contract", async function () {
            const balanceOld = await accounts[0].getBalance()

            expect(await curiousKidContract.contractBalance()).to.equal(0)

            // supply contract with funds
            const mintFee = await curiousKidContract1.feeWei()
            const overrides = { value: mintFee.toString() } // https://ethereum.stackexchange.com/a/93559/82768
            var tx = await curiousKidContract1.requestRandomIndex(overrides)
            await tx.wait()

            expect(await curiousKidContract.contractBalance()).to.not.equal(0)

            var tx = await curiousKidContract0.withdraw()
            await tx.wait()
            const balanceNew = await accounts[0].getBalance()

            expect(await curiousKidContract.contractBalance()).to.equal(0)
            expect(parseInt(balanceNew)).to.be.greaterThan(parseInt(balanceOld))
        })
    })

    describe("pause", function () {
        it("Should revert if already paused", async function () {
            await expect(curiousKidContract.unpause()).to.be.revertedWith("Pausable: not paused") // makes sure contract is unpaused first
            const tx = await curiousKidContract.pause()
            await tx.wait()
            await expect(curiousKidContract.pause()).to.be.revertedWith("Pausable: paused")
        })

    })

    describe("unpause", function () {
        it("Should revert if already unpaused", async function () {
            await expect(curiousKidContract.unpause()).to.be.revertedWith("Pausable: not paused")
        })

    })

    describe("requestRandomIndex", function () {

        it("Should allow pass if owner", async function () {
            expect(accounts[0].address).to.equal(await curiousKidContract.owner())
            var tx = await curiousKidContract0.requestRandomIndex()
            await tx.wait()
            expect(tx.confirmations).to.equal(1)
        })

        it("Should allow pass if in whitelist", async function () {
            expect(accounts[1].address).to.not.equal(await curiousKidContract.owner())
            expect(await curiousKidContract.inWhitelist(accounts[1].address)).to.equal(false)
            var tx = await curiousKidContract.enterWhitelist(accounts[1].address)
            expect(await curiousKidContract.inWhitelist(accounts[1].address)).to.equal(true)

            var tx = await curiousKidContract1.requestRandomIndex()
            await tx.wait()
            expect(tx.confirmations).to.equal(1)
        })

        it("Should allow pass if feeWei == 0", async function () {
            const curiousKid = await CuriousKid.deploy(maxTokens, maxTokensAllowedPerAddress, 0, hiddenURI, initBaseURI, temporaryURI, percentageRoyalty, vrfCoordinator, linkToken, keyHash, feeLink)
            curiousKidContract = await curiousKid.deployed()

            await fundWithLink()

            const curiousKidContract1 = new ethers.Contract(curiousKidContract.address, curiousKidContract.interface, accounts[1])
            var tx = await curiousKidContract1.requestRandomIndex()
            await tx.wait()
            expect(tx.confirmations).to.equal(1)
        })

        it("Should revert if not owner or not in whitelist, and feeWei == 0", async function () {
            await expect(curiousKidContract1.requestRandomIndex()).to.be.revertedWith("Insufficient Funds")
        })

        it("Should set caller's address to true in processingMint", async function () {
            var tx = await curiousKidContract0.requestRandomIndex()
            await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)
        })

        it("Should set caller's address to false in processingMint when VRF response with fulfillRandomness", async function () {
            var tx = await curiousKidContract0.requestRandomIndex()
            var receipt = await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)
            // manually trigger fulfillRandomness
            var tx = await vrfCoordinatorMockContract.callBackWithRandomness(receipt.events[3].topics[1], 12345, curiousKidContract.address)
            await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(false)
        })

        it("Should revert if same address calling twice before first mint is complete", async function () {
            var tx = await curiousKidContract0.requestRandomIndex()
            await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)
            await expect(curiousKidContract0.requestRandomIndex()).to.be.revertedWith("Minting in progress. Please wait.")
        })

        it("Should allow if different address calls the same function even though first mint not complete", async function () {
            var tx = await curiousKidContract0.requestRandomIndex()
            await tx.wait()
            expect(tx.confirmations).to.equal(1)
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)

            const mintFee = await curiousKidContract.feeWei()
            const overrides = { value: mintFee.toString() } // https://ethereum.stackexchange.com/a/93559/82768
            const curiousKidContract1 = new ethers.Contract(curiousKidContract.address, curiousKidContract.interface, accounts[1])
            var tx = await curiousKidContract1.requestRandomIndex(overrides)
            await tx.wait()
            expect(tx.confirmations).to.equal(1)
            expect(await curiousKidContract.processingMint(accounts[1].address)).to.equal(true)
        })

        it("Should revert if max tokens per address reached for non owner", async function () {
            const curiousKid = await CuriousKid.deploy(maxTokens, 1, feeWei, hiddenURI, initBaseURI, temporaryURI, percentageRoyalty, vrfCoordinator, linkToken, keyHash, feeLink)
            curiousKidContract = await curiousKid.deployed()

            await fundWithLink()

            const mintFee = await curiousKidContract.feeWei()
            const overrides = { value: mintFee.toString() } // https://ethereum.stackexchange.com/a/93559/82768
            const curiousKidContract1 = new ethers.Contract(curiousKidContract.address, curiousKidContract.interface, accounts[1])
            var tx = await curiousKidContract1.requestRandomIndex(overrides)
            var receipt = await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[1].address)).to.equal(true)
            // manually trigger fulfillRandomness
            var tx = await vrfCoordinatorMockContract.callBackWithRandomness(receipt.events[3].topics[1], 12345, curiousKidContract.address)
            await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[1].address)).to.equal(false)

            // try to mint again
            await expect(curiousKidContract1.requestRandomIndex(overrides)).to.be.revertedWith("Reached maximum amount of token allowed per address.")

            // use another account to try and mint
            const curiousKidContract0 = new ethers.Contract(curiousKidContract.address, curiousKidContract.interface, accounts[0])
            var tx = await curiousKidContract0.requestRandomIndex()
            await tx.wait()
            expect(tx.confirmations).to.equal(1)

        })

        it("Should NOT revert if max tokens per address reached for owner", async function () {
            const curiousKid = await CuriousKid.deploy(maxTokens, 1, feeWei, hiddenURI, initBaseURI, temporaryURI, percentageRoyalty, vrfCoordinator, linkToken, keyHash, feeLink)
            curiousKidContract = await curiousKid.deployed()

            await fundWithLink()

            const curiousKidContract0 = new ethers.Contract(curiousKidContract.address, curiousKidContract.interface, accounts[0])
            var tx = await curiousKidContract0.requestRandomIndex()
            var receipt = await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)
            // manually trigger fulfillRandomness
            var tx = await vrfCoordinatorMockContract.callBackWithRandomness(receipt.events[3].topics[1], 12345, curiousKidContract.address)
            await tx.wait()
            expect(tx.confirmations).to.equal(1)
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(false)

            // try to mint again
            var tx = await curiousKidContract0.requestRandomIndex()
            var receipt = await tx.wait()
            expect(tx.confirmations).to.equal(1)
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)
        })

        it("Should revert if all tokens minted", async function () {
            const curiousKid = await CuriousKid.deploy(1, maxTokensAllowedPerAddress, feeWei, hiddenURI, initBaseURI, temporaryURI, percentageRoyalty, vrfCoordinator, linkToken, keyHash, feeLink)
            curiousKidContract = await curiousKid.deployed()

            await fundWithLink()

            const curiousKidContract0 = new ethers.Contract(curiousKidContract.address, curiousKidContract.interface, accounts[0])
            var tx = await curiousKidContract0.requestRandomIndex()
            var receipt = await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)
            // manually trigger fulfillRandomness
            var tx = await vrfCoordinatorMockContract.callBackWithRandomness(receipt.events[3].topics[1], 12345, curiousKidContract.address)
            await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(false)

            // try to mint again
            await expect(curiousKidContract0.requestRandomIndex()).to.be.revertedWith("Token pool empty!")

            // use another account to try and mint
            const mintFee = await curiousKidContract.feeWei()
            const overrides = { value: mintFee.toString() } // https://ethereum.stackexchange.com/a/93559/82768
            const curiousKidContract1 = new ethers.Contract(curiousKidContract.address, curiousKidContract.interface, accounts[1])
            await expect(curiousKidContract1.requestRandomIndex(overrides)).to.be.revertedWith("Token pool empty!")
        })
    })

    describe("getTokensOwned", function () {
        it("Should return a non-empty array of tokens for address that mint", async function () {
            expect((await curiousKidContract.getTokensOwned(accounts[0].address)).length).to.equal(0)

            var tx = await curiousKidContract0.requestRandomIndex()
            var receipt = await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)
            // manually trigger fulfillRandomness
            var tx = await vrfCoordinatorMockContract.callBackWithRandomness(receipt.events[3].topics[1], 12345, curiousKidContract.address)
            await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(false)

            expect((await curiousKidContract.getTokensOwned(accounts[0].address)).length).to.equal(1)
        })
    })

    describe("mintedTokens & mintedTokensSize", function () {
        it("Should a non-empty array containing all the tokens minted by all addresses", async function () {
            expect((await curiousKidContract.mintedTokens()).length).to.equal(0)
            expect((await curiousKidContract.mintedTokensSize())).to.equal(0)

            var tx = await curiousKidContract0.requestRandomIndex()
            var receipt = await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)
            // manually trigger fulfillRandomness
            var tx = await vrfCoordinatorMockContract.callBackWithRandomness(receipt.events[3].topics[1], 12345, curiousKidContract.address)
            await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(false)

            expect((await curiousKidContract.mintedTokens()).length).to.equal(1)
            expect((await curiousKidContract.mintedTokensSize())).to.equal(1)

            const mintFee = await curiousKidContract.feeWei()
            const overrides = { value: mintFee.toString() }
            var tx = await curiousKidContract1.requestRandomIndex(overrides)
            var receipt = await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[1].address)).to.equal(true)
            // manually trigger fulfillRandomness
            var tx = await vrfCoordinatorMockContract.callBackWithRandomness(receipt.events[3].topics[1], 12345, curiousKidContract.address)
            await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[1].address)).to.equal(false)

            expect((await curiousKidContract.mintedTokens()).length).to.equal(2)
            expect((await curiousKidContract.mintedTokensSize())).to.equal(2)
        })
    })

    describe("tokenURI", function () {
        it("Should show 'hidden' token URI if token has been minted", async function () {
            var tx = await curiousKidContract0.requestRandomIndex()
            var receipt = await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)
            // manually trigger fulfillRandomness
            var tx = await vrfCoordinatorMockContract.callBackWithRandomness(receipt.events[3].topics[1], 12345, curiousKidContract.address)
            await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(false)

            const mintedToken = parseInt((await curiousKidContract.mintedTokens()).toString())

            expect(await curiousKidContract.tokenURI(mintedToken)).to.equal(temporaryURI)
        })

        it("Should show token URI if token has been minted and hiddenURI == false", async function () {
            var tx = await curiousKidContract0.requestRandomIndex()
            var receipt = await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(true)
            // manually trigger fulfillRandomness
            var tx = await vrfCoordinatorMockContract.callBackWithRandomness(receipt.events[3].topics[1], 12345, curiousKidContract.address)
            await tx.wait()
            expect(await curiousKidContract.processingMint(accounts[0].address)).to.equal(false)

            const mintedToken = (await curiousKidContract.mintedTokens()).toString()

            var tx = await curiousKidContract.revealURI()
            await tx.wait()

            if (mintedToken.length == 1) {
                expect(await curiousKidContract.tokenURI(mintedToken)).to.equal(`${initBaseURI}00${mintedToken}.json`)
            } else if (mintedToken.length == 2) {
                expect(await curiousKidContract.tokenURI(mintedToken)).to.equal(`${initBaseURI}0${mintedToken}.json`)
            } else if (mintedToken.length == 3) {
                expect(await curiousKidContract.tokenURI(mintedToken)).to.equal(`${initBaseURI}${mintedToken}.json`)
            } else {
                // TODO: add here for larger NFT collections
            }

        })

        it("Should revert if token has not been minted", async function () {
            await expect(curiousKidContract.tokenURI(1)).to.be.revertedWith("ERC721URIStorage: URI query for nonexistent token")
        })
    })

})

/**
 * auto fund with link: https://github.com/smartcontractkit/hardhat-starter-kit/blob/7d1801dfcfd8ba7cd600fe0cda711b09f3ac0897/test/unit/RandomNumberConsumer_unit_test.js#L27
 */