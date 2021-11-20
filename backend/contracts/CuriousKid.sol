// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./EIP2981/ERC2981ContractWideRoyalties.sol";
import "./ERC721URIStorageV2.sol";

contract CuriousKid is
    ERC721URIStorageV2,
    VRFConsumerBase,
    Pausable,
    Ownable,
    ReentrancyGuard,
    ERC2981ContractWideRoyalties
{
    using Strings for uint256;

    uint256 public totalTokensRemaining;
    uint256 public maxTokensAllowedPerAddress;
    uint256 public feeWei;
    uint256[] public listMintedTokensIds;
    bool public hiddenURI;
    uint256 internal newTokenId;
    string internal baseURI;
    string internal temporaryURI;
    bytes32 internal keyHash;
    uint256 internal feeLink;

    mapping(bytes32 => address) internal mapRequestIndexToAddress;
    mapping(uint256 => uint256) internal mapIndexToTokenId;
    mapping(address => uint256) public mapAddressToLatestTokenId;
    mapping(address => uint256[]) public mapAddressToTokenIds;
    mapping(address => bool) public processingMint;
    mapping(address => bool) public inWhitelist;

    event requestedIndex(bytes32 indexed requestIndex, address requester);

    constructor(
        uint256 _maxTokens, // max total token supply
        uint256 _maxTokensAllowedPerAddress, // max tokens mintable per address
        uint256 _feeWei, // must be in wei
        bool _hiddenURI, // URI show is "hidden"
        string memory _initBaseURI, // CID base
        string memory _temporaryURI, // CID hidden
        uint256 _percentageRoyalty, // between 0 to 100 | (converted to bps internally)
        address _vrfCoordinator, // chainlink's VRF
        address _linkToken, // chainlink's VRF
        bytes32 _keyHash, // chainlink's VRF
        uint256 _feeLink // chainlink's VRF
    ) ERC721("CuriousKid", "CK") VRFConsumerBase(_vrfCoordinator, _linkToken) {
        totalTokensRemaining = _maxTokens;
        maxTokensAllowedPerAddress = _maxTokensAllowedPerAddress;
        feeWei = _feeWei;
        hiddenURI = _hiddenURI;
        baseURI = _initBaseURI;
        temporaryURI = _temporaryURI;
        keyHash = _keyHash;
        feeLink = _feeLink;

        require(_percentageRoyalty <= 100, "0 <= _percentageRoyalty <= 100");
        _setRoyalties(owner(), _percentageRoyalty * 100);
        // TODO: cant seem to run setRoyalties(owner(), _percentageRoyalty); in constructor
    }

    //// --- main functions --- ////

    function requestRandomIndex() public payable nonReentrant whenNotPaused {
        require(
            !processingMint[msg.sender],
            "Minting in progress. Please wait."
        );

        require(totalTokensRemaining > 0, "Token pool empty!");

        if (msg.sender != owner()) {
            require(
                balanceOf(msg.sender) < maxTokensAllowedPerAddress,
                "Reached maximum amount of token allowed per address."
            );
            if (!inWhitelist[msg.sender]) {
                require(msg.value >= feeWei, "Insufficient Funds");
            }
        }

        bytes32 requestIndex = _getRandomNumber();
        mapRequestIndexToAddress[requestIndex] = msg.sender;
        processingMint[msg.sender] = true;
        emit requestedIndex(requestIndex, msg.sender);
    }

    function fulfillRandomness(bytes32 requestIndex, uint256 randomNumber)
        internal
        override
    {
        uint256 newRandomIndex = (randomNumber % totalTokensRemaining); // eg if totalTokensRemaining is 10, newRandomIndex will be 0-9
        assert(newRandomIndex < totalTokensRemaining);
        newTokenId = _getTokenIdAtIndex(newRandomIndex);
        assert(!_exists(newTokenId));
        address minter = mapRequestIndexToAddress[requestIndex];
        mapAddressToLatestTokenId[minter] = newTokenId;
        mapAddressToTokenIds[minter].push(newTokenId);
        _safeMint(minter, newTokenId);

        _setTokenURI(
            newTokenId,
            string(
                abi.encodePacked(
                    _fillTokenName(newTokenId.toString()),
                    newTokenId.toString(),
                    ".json"
                )
            )
        );

        _adjMapIndexToTokenId(newRandomIndex);
        listMintedTokensIds.push(newTokenId);

        assert(balanceOf(minter) == mapAddressToTokenIds[minter].length);
        processingMint[minter] = false;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721URIStorage: URI query for nonexistent token"
        );

        if (hiddenURI) {
            return temporaryURI;
        }

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        if (bytes(base).length == 0) {
            return _tokenURI; // If there is no base URI, return the token URI.
        }

        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI)); // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        }

        return super.tokenURI(tokenId);
    }

    //// --- utils functions --- ////

    function _getRandomNumber() internal returns (bytes32 requestIndex) {
        require(
            LINK.balanceOf(address(this)) >= feeLink,
            "Not enough LINK - fill contract with faucet"
        );
        return requestRandomness(keyHash, feeLink);
    }

    function _getTokenIdAtIndex(uint256 _index)
        internal
        view
        returns (uint256)
    {
        if (mapIndexToTokenId[_index] != 0) {
            return mapIndexToTokenId[_index]; // end position token id at vacant index position
        } else {
            return _index; // index == token id
        }
    }

    function _adjMapIndexToTokenId(uint256 _index) internal {
        mapIndexToTokenId[_index] = _getTokenIdAtIndex(
            totalTokensRemaining - 1
        );
        // mapIndexToTokenId[totalTokensRemaining - 1] = 0; // https://ethereum.stackexchange.com/questions/110848/get-random-number-without-replacement-in-solidity
        totalTokensRemaining -= 1;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function _fillTokenName(string memory _token)
        internal
        pure
        returns (string memory frontName)
    {
        // NFT Specific
        require(bytes(_token).length < 4, "128 tokens max.");
        if (bytes(_token).length == 1) {
            return "00";
        }
        if (bytes(_token).length == 2) {
            return "0";
        }
        return "";
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC2981Base)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    //// --- external functions --- ////

    function getTokensOwned(address _address)
        external
        view
        returns (uint256[] memory)
    {
        return mapAddressToTokenIds[_address];
    }

    function mintedTokens() external view returns (uint256[] memory) {
        // sanity check
        return listMintedTokensIds;
    }

    function mintedTokensSize() external view returns (uint256) {
        // sanity check
        return listMintedTokensIds.length;
    }

    //// --- admin functions --- ////

    function revealURI() external onlyOwner {
        require(hiddenURI, "URI already revealed.");
        hiddenURI = false;
    }

    function hideURI() external onlyOwner {
        require(!hiddenURI, "URI already hidden.");
        hiddenURI = true;
    }

    function setMaxTokensMintablePerAddress(uint256 _max) external onlyOwner {
        require(
            _max != maxTokensAllowedPerAddress,
            "Trying to set same max value."
        );
        require(_max > 0, "Minimum of 1.");
        maxTokensAllowedPerAddress = _max;
    }

    function setMintFee(uint256 _feeWei) external onlyOwner {
        // input must be in wei
        require(_feeWei != feeWei, "Trying to set same fee value.");
        feeWei = _feeWei;
    }

    function setRoyalties(address _recipient, uint256 _percentageRoyalty)
        external
        onlyOwner
    {
        // currently only applies to one address at a time
        // _percentageRoyalty will be converted into a value between 0 to 10000 [basis points] | 100% == 10000 | 0% == 0
        require(_percentageRoyalty <= 100, "0 <= _percentageRoyalty <= 100");
        _setRoyalties(_recipient, _percentageRoyalty * 100);
    }

    function enterWhitelist(address _address) external onlyOwner {
        require(_address != owner(), "Owner is beyond whitelist.");
        require(!inWhitelist[_address], "Already in whitelist.");
        inWhitelist[_address] = true;
    }

    function exitWhitelist(address _address) external onlyOwner {
        require(inWhitelist[_address], "Not in whitelist.");
        inWhitelist[_address] = false;
    }

    function contractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function withdraw() external onlyOwner {
        (bool sent, ) = payable(msg.sender).call{value: address(this).balance}(
            ""
        );
        require(sent, "Failed to send coins.");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
