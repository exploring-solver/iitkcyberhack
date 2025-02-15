// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// Chain A Gateway Contract
contract ChainAGateway is AccessControl, ReentrancyGuard {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    
    mapping(address => mapping(uint256 => bool)) public processedNonces;
    uint256 public nonce;
    
    event Locked(
        address indexed token,
        address indexed from,
        uint256 amount,
        uint256 nonce,
        bool isERC721,
        uint256 tokenId
    );
    
    event Unlocked(
        address indexed token,
        address indexed to,
        uint256 amount,
        uint256 nonce,
        bool isERC721,
        uint256 tokenId
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
    }
    
    function lockERC20(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        nonce++;
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        emit Locked(token, msg.sender, amount, nonce, false, 0);
    }
    
    function lockERC721(address token, uint256 tokenId) external nonReentrant {
        nonce++;
        
        IERC721(token).transferFrom(msg.sender, address(this), tokenId);
        
        emit Locked(token, msg.sender, 1, nonce, true, tokenId);
    }
    
    function unlock(
        address token,
        address to,
        uint256 amount,
        uint256 _nonce,
        bool isERC721,
        uint256 tokenId,
        bytes memory signature
    ) external onlyRole(RELAYER_ROLE) nonReentrant {
        require(!processedNonces[to][_nonce], "Nonce already processed");
        
        bytes32 message = keccak256(abi.encodePacked(token, to, amount, _nonce, isERC721, tokenId));
        require(verify(message, signature), "Invalid signature");
        
        processedNonces[to][_nonce] = true;
        
        if (isERC721) {
            IERC721(token).transferFrom(address(this), to, tokenId);
        } else {
            IERC20(token).transfer(to, amount);
        }
        
        emit Unlocked(token, to, amount, _nonce, isERC721, tokenId);
    }
    
    function verify(bytes32 message, bytes memory signature) internal pure returns (bool) {
        bytes32 ethMessage = MessageHashUtils.toEthSignedMessageHash(message);
        address signer = ECDSA.recover(ethMessage, signature);
        // Here you would verify the signer is authorized
        return signer != address(0);
    }
}

// Chain B Gateway Contract (Wrapped Tokens)
contract ChainBGateway is AccessControl, ReentrancyGuard {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    
    mapping(address => mapping(uint256 => bool)) public processedNonces;
    mapping(address => address) public wrappedTokens;
    
    event Minted(
        address indexed originalToken,
        address indexed to,
        uint256 amount,
        uint256 nonce,
        bool isERC721,
        uint256 tokenId
    );
    
    event Burned(
        address indexed originalToken,
        address indexed from,
        uint256 amount,
        uint256 nonce,
        bool isERC721,
        uint256 tokenId
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
    }
    
    function mint(
        address originalToken,
        address to,
        uint256 amount,
        uint256 nonce,
        bool isERC721,
        uint256 tokenId,
        bytes memory signature
    ) external onlyRole(RELAYER_ROLE) nonReentrant {
        require(!processedNonces[to][nonce], "Nonce already processed");
        
        bytes32 message = keccak256(abi.encodePacked(originalToken, to, amount, nonce, isERC721, tokenId));
        require(verify(message, signature), "Invalid signature");
        
        processedNonces[to][nonce] = true;
        address wrappedToken = wrappedTokens[originalToken];
        
        if (isERC721) {
            IWrappedERC721(wrappedToken).mint(to, tokenId);
        } else {
            IWrappedERC20(wrappedToken).mint(to, amount);
        }
        
        emit Minted(originalToken, to, amount, nonce, isERC721, tokenId);
    }
    
    function burn(
        address originalToken,
        uint256 amount,
        bool isERC721,
        uint256 tokenId
    ) external nonReentrant {
        address wrappedToken = wrappedTokens[originalToken];
        require(wrappedToken != address(0), "Token not supported");
        
        if (isERC721) {
            IWrappedERC721(wrappedToken).burn(tokenId);
        } else {
            IWrappedERC20(wrappedToken).burn(msg.sender, amount);
        }
        
        emit Burned(originalToken, msg.sender, amount, block.number, isERC721, tokenId);
    }
    
    function registerWrappedToken(address originalToken, address wrappedToken) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(wrappedTokens[originalToken] == address(0), "Token already registered");
        wrappedTokens[originalToken] = wrappedToken;
    }
    
    function verify(bytes32 message, bytes memory signature) internal view returns (bool) {
        bytes32 ethMessage = MessageHashUtils.toEthSignedMessageHash(message);
        address signer = ECDSA.recover(ethMessage, signature);
        return hasRole(RELAYER_ROLE, signer);
    }
}

// Interfaces for wrapped tokens
interface IWrappedERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

interface IWrappedERC721 {
    function mint(address to, uint256 tokenId) external;
    function burn(uint256 tokenId) external;
}