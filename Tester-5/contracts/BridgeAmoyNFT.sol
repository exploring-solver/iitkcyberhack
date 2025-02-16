// BridgeAmoyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface IERC721Mintable is IERC721 {
    function mint(address to) external returns (uint256);
    function burn(uint256 tokenId) external;
}

contract BridgeAmoyNFT is AccessControl, ReentrancyGuard {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    
    IERC721Mintable public nativeNFT;
    address public remoteBridge;
    
    mapping(uint256 => bool) public lockedTokens;
    mapping(address => mapping(uint256 => bool)) public processedNonces;
    uint256 public nonce;

    event Locked(
        address indexed user, 
        uint256 tokenId, 
        uint256 nonce
    );
    event Unlocked(
        address indexed user, 
        uint256 tokenId, 
        uint256 nonce
    );
    event Minted(
        address indexed to, 
        uint256 tokenId, 
        uint256 nonce
    );

    constructor(address _nativeNFT) {
        nativeNFT = IERC721Mintable(_nativeNFT);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
    }

    function setRemoteBridge(address _remoteBridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        remoteBridge = _remoteBridge;
    }

    // Mint new NFTs (only admin)
    function mint(address to) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        nonce++;
        uint256 tokenId = nativeNFT.mint(to);
        emit Minted(to, tokenId, nonce);
        return tokenId;
    }

    // Lock NFT on the source chain
    function lock(uint256 tokenId) external nonReentrant {
        require(!lockedTokens[tokenId], "Token already locked");
        require(nativeNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        
        nonce++;
        nativeNFT.transferFrom(msg.sender, address(this), tokenId);
        lockedTokens[tokenId] = true;
        
        emit Locked(msg.sender, tokenId, nonce);
    }

    // Unlock NFT on the source chain (called by relayer)
    function unlock(
        address user, 
        uint256 tokenId, 
        uint256 _nonce,
        bytes memory signature
    ) external nonReentrant onlyRole(RELAYER_ROLE) {
        require(lockedTokens[tokenId], "Token not locked");
        require(!processedNonces[user][_nonce], "Nonce already processed");
        
        bytes32 message = keccak256(abi.encodePacked(
            address(nativeNFT),
            user,
            tokenId,
            _nonce
        ));
        require(verify(message, signature), "Invalid signature");
        
        processedNonces[user][_nonce] = true;
        lockedTokens[tokenId] = false;
        nativeNFT.transferFrom(address(this), user, tokenId);
        
        emit Unlocked(user, tokenId, _nonce);
    }

    function verify(bytes32 message, bytes memory signature) internal view returns (bool) {
        bytes32 ethMessage = MessageHashUtils.toEthSignedMessageHash(message);
        address signer = ECDSA.recover(ethMessage, signature);
        return hasRole(RELAYER_ROLE, signer);
    }

    // Add relayer
    function addRelayer(address relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(RELAYER_ROLE, relayer);
    }

    // Remove relayer
    function removeRelayer(address relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(RELAYER_ROLE, relayer);
    }
}