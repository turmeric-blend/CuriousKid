# Curious Kid - NFT Project
### NFT as a collectable

![alt](https://github.com/turmeric-blend/CuriousKid/blob/master/backend/assets_demo/images/demo.gif)

## Description

- Mint your very own Curious Kid from a collection size of 128
- Curious users can mint their very own Curious Kid via <link-to-website>
- Curious Kid guarantees that each NFT minted is unique
- It's contract allow creators to have stable earnings
- Perfect as gifts to kids. No time like the present to get them started on their blockchain journey.

## How to use

Curious Kid consists of 2 parts, the backend and frontend.

### Backend - requires both python and node.js
0. npm install
1. Change the `assets_demo` folder name to `assets`
2. Open `NFT Art Generator.ipynb`, and follow the instructions and each cell
3. `assets/images/main` and `assets/metadata/main` folder should be populated with 8 images and metadata respectively
4. and these should have been uploaded to nft.storage
5. copy the CIDs and replace them with the CIDs in `initBaseURI` and `temporaryURI` of deploy/1_deploy.js
6. run `npx hardhat deploy --network rinkeby` to deploy and try it out!
7. copy deployed_contract_details folder into frontend folder's src folder to get started with the DAPP to interact with contract

### Frontend
0. npm install

## Testing
```
~$ npx hardhat test
```



# TODO: clean all TODOs
