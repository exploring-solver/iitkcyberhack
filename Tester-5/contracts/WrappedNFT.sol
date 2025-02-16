// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract WrappedNFT is ERC721, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public originalNFT;
    uint256 public originalChainId;

    // Mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    event NFTMinted(address indexed to, uint256 tokenId);
    event NFTBurned(uint256 tokenId);
    event URISet(uint256 indexed tokenId, string uri);

    constructor(
        string memory name,
        string memory symbol,
        address _originalNFT,
        uint256 _originalChainId
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        originalNFT = _originalNFT;
        originalChainId = _originalChainId;
    }

    function mint(address to, uint256 tokenId) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        _safeMint(to, tokenId);
        emit NFTMinted(to, tokenId);
    }

    function burn(uint256 tokenId) 
        external 
        onlyRole(BURNER_ROLE) 
        whenNotPaused 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _burn(tokenId);
        emit NFTBurned(tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory uri) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _tokenURIs[tokenId] = uri;
        emit URISet(tokenId, uri);
    }

    function tokenURI(uint256 tokenId) 
        public 
        view 
        virtual 
        override 
        returns (string memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Override required by Solidity
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}


