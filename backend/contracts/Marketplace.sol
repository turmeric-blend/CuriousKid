// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./EIP2981/ERC2981ContractWideRoyalties.sol";

contract Marketplace is Pausable, Ownable, ReentrancyGuard {
    //// --- initialize --- ////
    struct Listing {
        address seller;
        uint256 price;
    }
    mapping(address => mapping(uint256 => Listing)) public listings;
    mapping(address => uint256) public balance;

    //// --- main functions --- ////
    function listToken(
        address _contractAddress,
        uint256 _tokenId,
        uint256 _price
    ) external {
        ERC721 contractToken = ERC721(_contractAddress);
        require(
            contractToken.ownerOf(_tokenId) == msg.sender,
            "Not owner of token."
        );
        require(
            contractToken.isApprovedForAll(msg.sender, address(this)) ||
                contractToken.getApproved(_tokenId) == address(this),
            "This contract is not approved to handle token(s) of owner."
        );
        // please use _contractAddress's -- setApprovalForAll() OR approve() -- to allow this contract (marketplace) to handle your tokens
        // setApprovalForAll: https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#IERC721-setApprovalForAll-address-bool-
        // approve: https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#IERC721-approve-address-uint256-
        require(_price > 0, "Set price above zero.");
        listings[_contractAddress][_tokenId] = Listing(msg.sender, _price);
    }

    function delistToken(address _contractAddress, uint256 _tokenId) external {
        ERC721 contractToken = ERC721(_contractAddress);
        require(
            contractToken.ownerOf(_tokenId) == msg.sender,
            "Not owner of token."
        );
        Listing memory saleInfo = listings[_contractAddress][_tokenId];
        require(saleInfo.price > 0, "Token not listed.");
        listings[_contractAddress][_tokenId] = Listing(address(0), 0);
    }

    function purchaseToken(address _contractAddress, uint256 _tokenId)
        external
        payable
    {
        ERC721 contractToken = ERC721(_contractAddress);

        Listing memory saleInfo = listings[_contractAddress][_tokenId];
        require(
            saleInfo.seller != address(0),
            "0 address in sale list! Code Error."
        ); // this should never be called
        require(msg.sender != saleInfo.seller, "You are token owner!");
        require(saleInfo.price > 0, "Token not for sale.");
        require(msg.value >= saleInfo.price, "Insufficient Funds"); // * 1 == amount=1

        // split
        ERC2981ContractWideRoyalties contractRoyalty = ERC2981ContractWideRoyalties(
                _contractAddress
            );
        (address royaltyReceiver, uint256 royaltyValue) = contractRoyalty
            .royaltyInfo(0, msg.value); // currently, first argument doesn't matter
        uint256 sellerValue = msg.value - royaltyValue;

        listings[_contractAddress][_tokenId] = Listing(address(0), 0); // delist token first for safety against re-entrant attack

        balance[royaltyReceiver] += royaltyValue;
        balance[saleInfo.seller] += sellerValue;

        contractToken.safeTransferFrom(
            saleInfo.seller,
            msg.sender,
            _tokenId,
            ""
        ); // transfer NFT
    }

    function withdraw() external nonReentrant {
        // TODO: TEST this fn must be payable?
        require(balance[msg.sender] > 0, "Account is not due payment.");
        uint256 amount = balance[msg.sender];
        balance[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to send coins.");
    }

    //// --- utils functions --- ////

    function entitledToFunds() external view returns (uint256) {
        return balance[msg.sender];
    }

    function contractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

/** Features Upgrades:
1.  make money stay in contract first (map which address owns how much), and require seller to "claim", 
    if don't claim after X time, that amount is "forfeit"
2.  auction within timeframe
 */
