import { ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
// @ts-ignore
import SCR4ABI from './deployed_contract_details/CuriousKid/abi.json'
// @ts-ignore
import SCR4Address from './deployed_contract_details/CuriousKid/address.json'

import { Router } from "@angular/router";
import { ethers } from "ethers";
import { providers } from "ethers";
import Swal from 'sweetalert2';
import { HostListener } from "@angular/core";
import { Subject, Subscription } from "rxjs";


const CONTRACT_ADDRESS = SCR4Address.address
const ETHERSCAN_RINKEBY = `https://rinkeby.etherscan.io/address/${CONTRACT_ADDRESS}`
const CHAIN = "rinkeby"
const CHAIN_MAP = { 1: "mainnet", 3: "ropsten", 4: "rinkeby", 5: "goerli", 42: "kovan" }
const CHAIN_MAP_INV = { mainnet: 1, ropsten: 3, rinkeby: 4, goerli: 5, kovan: 42 }
const OPENSEA_COLECTION = "https://testnets.opensea.io/collection/sample-rp9bndqvpq"

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    window: any
    ethereum: any

    metaMaskInstalled = false;
    connected = false;
    connectedToTheRightChain = false;

    userWalletDetails: walletDetails

    contractDetails: contractDetails

    subscription: Subscription;
    statefulWalletDetails: Subject<walletDetails>;

    mintedTokenCount = 0;
    imageURLs: any = []

    nftTokensOwned = 0;
    isLoading = false;

    disableMintingButton = false;
    mintingProcessButton = false;

    mintingProcessCompleted = false;

    interval: any;

    constructor(private readonly router: Router, private _cdr: ChangeDetectorRef) {

        this.contractDetails = {
            address: CONTRACT_ADDRESS
        }

        this.userWalletDetails = {
            provider: null,
            signer: null,
            signerAddress: null,
            signerBalance: null,
            signerChainId: null,
            // signerChainName: null
        }

        // detecting changes in the view component / component logic
        setInterval(() => {
            // require view to be updated
            this._cdr.detectChanges();
            console.log('detecting changes')
        }, 1000);


        // setting intervals to check processing mint - for the minting button state
        setInterval(async () => {

            // console.log('checking processing mint')

            await this.processingMintState()
            // await this.retrieveUpdatedStatus()

        }, 1000);

        // setting intervals to update latest status - 2.5secs
        setInterval(async () => {

            await this.retrieveUpdatedStatus()

        }, 2500);


    }

    ngOnInit() {

        console.log('init app')
        console.log('metamask installed = ', this.isMetaMaskInstalled())

        console.log('userWalletDetails', this.userWalletDetails)

        // @ts-ignore
        window.ethereum.on('chainChanged', (chainId) => {
            // Handle the new chain.
            // Correctly handling chain changes can be complicated.
            // We recommend reloading the page unless you have good reason not to.

            console.log('chain id inside chainChanged', chainId)

            if (chainId !== '0x4') {

                Swal.fire({
                    title: 'We have detected you changed your network',
                    text: 'Press OK to reload the page',
                    icon: 'warning',
                    showCancelButton: false,
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.reload();
                    }

                })

            }

            console.log('we out from chainChanged')


        });

        // @ts-ignore
        window.ethereum.on('accountsChanged', async (accounts) => {

            console.log('we in accounts changed')
            console.log('accounts', accounts)

            await this.switchAccountDetails();

        });


    }

    async processingMintState() {

        if (this.userWalletDetails.signerAddress !== null) {

            const provider = new ethers.providers.Web3Provider(window.ethereum)

            const signer = provider.getSigner()
            const signerAddress = await signer.getAddress()

            const contract_read = new ethers.Contract(CONTRACT_ADDRESS, SCR4ABI.abi, provider)
            // @ts-ignore
            const processingMint = await contract_read.processingMint(signerAddress)
            console.log('processingMint value - ', processingMint)

            if (processingMint === true) {
                this.mintingProcessButton = true;
                this.mintingProcessCompleted = false;
                console.log('we minting too too too')

            } else {
                this.mintingProcessButton = false;
                this.mintingProcessCompleted = true;
                console.log('not minting too too')
            }

            // after finish, set an interval of 5 secs to get latest data
            // if (this.mintingProcessCompleted && !this.mintingProcessButton) {
            //
            // this.interval = setInterval(async () => {
            //
            //   console.log('5 secs interval')
            //
            //   await this.retrieveUpdatedStatus()
            //
            // }, 1000);
            //
            // setTimeout( () => {
            //   clearInterval(this.interval)
            // }, 5000)
            //
            //
            // }


        }


    }

    async retrieveUpdatedStatus() {

        if (this.userWalletDetails.signerAddress !== null) {

            console.log('retrieving status')

            const provider = new ethers.providers.Web3Provider(window.ethereum)

            const signer = provider.getSigner()
            const signerAddress = await signer.getAddress()
            const signerBalance = await signer.getBalance()
            const signerChainId = await signer.getChainId()
            // // const signerChainName = 
            // console.log(CHAIN_MAP[signerChainId])

            await this.getMintedCount()
            await this.getTokensOwned(signerAddress)

        }

    }

    async connectButton() {

        // connect to the meta mask account
        // @ts-ignore
        await window.ethereum.request({ method: 'eth_requestAccounts' })

        await this.retrieveWalletDetails();
    }

    async changeNetwork() {
        console.log('changing start')


        // check if metamask installed
        if (window.ethereum) {

            try {
                // changing the hexadecimal appropriate network here
                // @ts-ignore
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x4' }], // chainId must be in hexadecimal numbers
                });

                await this.retrieveWalletDetails();

            } catch (error) {

                // @ts-ignore
                await Swal.fire({
                    icon: 'error',
                    title: 'Error Detected',
                    text: error,
                })


            }


        }


    }


    async retrieveWalletDetails() {

        // retrieve provider from ethers JS
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)

        const signer = provider.getSigner()
        const signerAddress = await signer.getAddress()
        const signerBalance = await signer.getBalance()
        const signerChainId = await signer.getChainId()

        console.log('signer', signer)
        console.log('signerAddress', signerAddress)
        console.log('signerBalance', signerBalance)
        console.log('signerChainId', signerChainId)

        this.userWalletDetails.signerAddress = signerAddress
        this.userWalletDetails.signerBalance = ethers.utils.formatEther(signerBalance)
        this.userWalletDetails.signerChainId = signerChainId

        //testing
        // this.statefulWalletDetails.subscribe(
        // 	this.statefulWalletDetails.asObservable
        // )

        console.log('CHAIN_MAP_INV[CHAIN]', CHAIN_MAP_INV[CHAIN])
        console.log('userWalletDetails', this.userWalletDetails)

        this.connected = true;

        // connect to the right chain ID
        if (this.userWalletDetails.signerChainId === CHAIN_MAP_INV[CHAIN]) {
            console.log('sheesh yes sir connected to the right one')
            this.connectedToTheRightChain = true;
        } else {
            console.log('connected to the wrong chain')
            this.connectedToTheRightChain = false;
        }

        if (this.connected && this.connectedToTheRightChain) {
            await this.getMintedCount()
            await this.getTokensOwned(signerAddress)
        }

    }

    async switchAccountDetails() {

        // set to null again the items
        this.userWalletDetails.signerAddress = null;
        this.userWalletDetails.signerBalance = null;
        this.userWalletDetails.signerChainId = null

        console.log('switch acccount init', this.userWalletDetails)

        // retrieve provider from ethers JS
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)

        const signer = provider.getSigner()
        const signerAddress = await signer.getAddress()
        const signerBalance = await signer.getBalance()
        const signerChainId = await signer.getChainId()

        console.log('signer', signer)
        console.log('signerAddress', signerAddress)
        console.log('signerBalance', signerBalance)
        console.log('signerChainId', signerChainId)

        this.userWalletDetails.signerAddress = signerAddress
        this.userWalletDetails.signerBalance = ethers.utils.formatEther(signerBalance)
        this.userWalletDetails.signerChainId = signerChainId

        await this.getMintedCount()
        await this.getTokensOwned(signerAddress)
    }

    async mintTokens() {

        console.log('start minting')

        // contstructing a provider
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)

        // taking a signer object
        const signer = provider.getSigner()
        const signerAddress = await signer.getAddress()
        const signerBalance = await signer.getBalance()
        const signerChainId = await signer.getChainId()

        try {
            const contract_read = new ethers.Contract(CONTRACT_ADDRESS, SCR4ABI.abi, provider)
            const contract_write = new ethers.Contract(CONTRACT_ADDRESS, SCR4ABI.abi, signer)
            // @ts-ignore
            const contractOwner = await contract_read.owner()
            console.log('contract owner', contractOwner)
            // @ts-ignore
            const inWhitelist = await contract_read.inWhitelist(signerAddress)
            console.log('inWhitelist', inWhitelist)

            if (signerAddress === contractOwner || inWhitelist) {
                // @ts-ignore
                const transaction = await contract_write.requestRandomIndex()
                await transaction.wait()
            } else {
                // @ts-ignore
                const mintFee = await contract_read.feeWei()
                const overrides = { value: mintFee.toNumber() } // https://ethereum.stackexchange.com/a/93559/82768
                // @ts-ignore
                const transaction = await contract_write.requestRandomIndex(overrides)
                await transaction.wait()
            }

            await Swal.fire(
                'Minting Successful!',
                'Please wait for a while as the blockchain is processing your query.',
                'success'
            )


        } catch (error) {
            // @ts-ignore
            if (error.code === 4001) {
                // @ts-ignore
                alert(error.message)
            } else {
                // @ts-ignore
                alert(error.error.message)
            }
        }


    }

    isMetaMaskInstalled() {
        let ethereum: any;

        // @ts-ignore
        return Boolean(window.ethereum && window.ethereum.isMetaMask)
    }

    isProperNetwork() {
        return Boolean(this.userWalletDetails.signerChainId === CHAIN_MAP_INV[CHAIN])
    }

    async getMintedCount() {
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract_read = new ethers.Contract(CONTRACT_ADDRESS, SCR4ABI.abi, provider)
        // @ts-ignore
        const count = await contract_read.mintedTokensSize()
        this.mintedTokenCount = count;
        // console.log('mintedtokenCount', this.mintedTokenCount)
        // console.log('decimal mintedtokenCount', parseInt(String(this.mintedTokenCount), 10))

        // set a condition if 16 full already - disable the button
        if (this.mintedTokenCount == 128) {
            this.disableMintingButton = true;
        } else {
            this.disableMintingButton = false;
        }

    }

    async getTokensOwned(signerAddress: any) {

        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract_read = new ethers.Contract(CONTRACT_ADDRESS, SCR4ABI.abi, provider)

        // @ts-ignore
        const tokensOwned = await contract_read.getTokensOwned(signerAddress)

        // console.log('tokensOwned', tokensOwned)

        const tokenURIs = []
        for (const tokenId of tokensOwned) {
            // @ts-ignore
            const tokenURI = await contract_read.tokenURI(tokenId.toNumber())
            tokenURIs.push(tokenURI)
        }

        // console.log('tokenURIs', tokenURIs)

        // set amount of tokens owned
        this.nftTokensOwned = tokenURIs.length;

        // after owning token, then you parse the fucking uri

        // init back the items - to 0 to prevent bug
        this.imageURLs = []

        for (let i = 0; i < tokenURIs.length; i++) {
            const api = await fetch(tokenURIs[i])
            const data = await api.json()
            await this.imageURLs.push(data.image)
        }

        // console.log('imageURLs', this.imageURLs)


    }


}

export interface contractDetails {
    address: any,
}

export interface walletDetails {
    provider: any,
    signer: any,
    signerAddress: any,
    signerBalance: any,
    signerChainId: any,
    // signerChainName: any,
}

declare global {
    interface Window {
        // @ts-ignore
        ethereum: any;
    }
}