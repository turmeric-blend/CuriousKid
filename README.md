# Curious Kid - NFT Project
### NFT as a collectable

![alt](https://github.com/turmeric-blend/CuriousKid/blob/master/backend/assets_demo/images/demo.gif)

## Description

- Mint your very own Curious Kid from a collection size of 128
- Curious users can mint their very own Curious Kid via <TODO: add link-to-website>
- Curious Kid guarantees that each NFT minted is unique
- It's contract allow creators to have stable earnings
- Perfect as gifts to kids. No time like the present to get them started on their blockchain journey.

## Features

##### 1. Mathematically Guaranteed Uniqueness
![alt](https://github.com/turmeric-blend/CuriousKid/blob/master/backend/assets_demo/math_guaranteed_unique.png)

What is a powerset?
- Given {1,2,3} is in set S
- {(), (1,), (2,), (3,), (1,2), (1,3), (2,3), (1,2,3)} are all subsets of S, which are all the possible unique attribute combinations
- More info: https://www.mathsisfun.com/sets/power-set.html

##### 2. Sets Token URI on-chain
![alt](https://github.com/turmeric-blend/CuriousKid/blob/master/backend/assets_demo/set_onchain_tokenURI.png)

##### 3. EIP-2981 Royalty Standard
Curious Kid implements the EIP-2981 Royalty Standard that allows for marketplaces to implement on-chain royalty. This allows artist and developers to earn their fair share each time a sale on their NFT occurs - backed by the power of decentralization.

##### 4. Mystery & Excitement
Curious Kid owners (deployers) can optionally hide the NFT images even after mint, and reveal it after awhile, to create some fun and excitement around the minting process - perfect for kids, great for learning.
![alt](https://github.com/turmeric-blend/CuriousKid/blob/master/backend/assets_demo/reveal.png)

## How it works

![alt](https://github.com/turmeric-blend/CuriousKid/blob/master/backend/assets_demo/howitworks.png)

## How to use

Curious Kid consists of 2 parts, the backend and frontend.

### Backend - requires both python and node.js
```
~$ cd backend
~$ npm install
```
##### NFT Art Generation
1. Change the `assets_demo` folder name to `assets`
2. Open `NFT Art Generator.ipynb`, and follow the instructions and each cell
3. after going through the notebook, the following should have occured:
    - `assets/images/main` and `assets/metadata/main` folder should be populated with 8 images and metadata respectively
    - image and URI metadata should have been uploaded to nft.storage and obtain CIDs

##### Deploying to Rinkeby
1. copy the CIDs and replace them with the CIDs in `initBaseURI` and `temporaryURI` of deploy/1_deploy.js
2. run `npx hardhat deploy --network rinkeby` to deploy and try it out!
3. deployed_contract_details folder should have been created after deployment, copy this into frontend folder's src folder to get started with the DAPP to interact with contract

### Frontend
```
~$ cd frontend
~$ npm install
~$ npm start
```

## Testing
```
~$ cd backend
~$ npx hardhat test
```
or for a summary of contract test coverage
```
~$ cd backend
~$ npx hardhat coverage
```

## Helpful Tasks

1. check contract size
```
~$ yarn run hardhat size-contracts
```