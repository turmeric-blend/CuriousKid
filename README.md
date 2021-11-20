# Curious Kid - NFT Project
### NFT as a collectable

![alt](https://github.com/turmeric-blend/CuriousKid/blob/master/backend/assets_demo/images/demo.gif)

## Description

- Mint your very own Curious Kid from a collection size of 128
- Curious users can mint their very own Curious Kid via <link-to-website>
- Curious Kid guarantees that each NFT minted is unique
- It's contract allow creators to have stable earnings
- Perfect as gifts to kids. No time like the present to get them started on their blockchain journey.

# TODO: add explanation/diagrams on how it works, features(how is it different)

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
```
# TODO: frontend

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



# TODO: clean all TODOs
