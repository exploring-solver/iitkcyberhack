// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface IERC721Mintable is IERC721 {
    function mint(address to, uint256 tokenId) external;
    function burn(uint256 tokenId) external;
}

contract BridgeSepoliaNFT is AccessControl, ReentrancyGuard {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    
    IERC721Mintable public wrappedNFT;
    address public remoteBridge;
    
    mapping(address => mapping(uint256 => bool)) public processedNonces;
    uint256 public nonce;

    event Released(
        address indexed user, 
        uint256 tokenId, 
        uint256 nonce
    );
    event Burned(
        address indexed user, 
        uint256 tokenId, 
        uint256 nonce
    );

    constructor(address _wrappedNFT) {
        wrappedNFT = IERC721Mintable(_wrappedNFT);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
    }

    function setRemoteBridge(address _remoteBridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        remoteBridge = _remoteBridge;
    }

    // Release wrapped NFT on the destination chain (called by relayer)
    function release(
        address user, 
        uint256 tokenId, 
        uint256 _nonce,
        bytes memory signature
    ) external nonReentrant onlyRole(RELAYER_ROLE) {
        require(!processedNonces[user][_nonce], "Nonce already processed");
        
        bytes32 message = keccak256(abi.encodePacked(
            address(wrappedNFT),
            user,
            tokenId,
            _nonce
        ));
        require(verify(message, signature), "Invalid signature");
        
        processedNonces[user][_nonce] = true;
        wrappedNFT.mint(user, tokenId);
        
        emit Released(user, tokenId, _nonce);
    }

    // Burn wrapped NFT on the destination chain
    function burn(uint256 tokenId) external nonReentrant {
        require(wrappedNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        nonce++;
        
        wrappedNFT.burn(tokenId);
        emit Burned(msg.sender, tokenId, nonce);
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