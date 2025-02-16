// BridgeAmoyNFTV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IAmoyNFT is IERC721 {
    function mint(address to) external returns (uint256);
    function burn(uint256 tokenId) external;
}

interface INFTRelayerManager {
    function verifyRelayer(address relayer, bytes32[] calldata proof) external view returns (bool);
    function generateRequestId(
        address user,
        address recipient,
        uint256 tokenId,
        uint256 nonce,
        uint256 sourceChainId,
        uint256 targetChainId
    ) external pure returns (bytes32);
}

contract BridgeAmoyNFTV2 is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IAmoyNFT public nft;
    INFTRelayerManager public relayerManager;
    mapping(bytes32 => bool) public processedRequests;
    mapping(uint256 => bool) public bridgedTokens;

    event LockRequested(
        bytes32 indexed requestId,
        address indexed user,
        address indexed recipient,
        uint256 tokenId
    );

    event TransferProcessed(
        bytes32 indexed requestId,
        address indexed executor,
        bool success
    );

    constructor(
        address _nft,
        address _relayerManager,
        address admin
    ) {
        nft = IAmoyNFT(_nft);
        relayerManager = INFTRelayerManager(_relayerManager);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function lockWithRelay(
        uint256 tokenId,
        address recipient
    ) external nonReentrant whenNotPaused {
        require(!bridgedTokens[tokenId], "Token already bridged");
        require(recipient != address(0), "Invalid recipient");
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nft.getApproved(tokenId) == address(this), "Bridge not approved");

        // Transfer NFT to bridge
        nft.transferFrom(msg.sender, address(this), tokenId);
        bridgedTokens[tokenId] = true;

        bytes32 requestId = relayerManager.generateRequestId(
            msg.sender,
            recipient,
            tokenId,
            block.timestamp,
            block.chainid,
            11155111 // Sepolia chain ID
        );

        emit LockRequested(requestId, msg.sender, recipient, tokenId);
    }

    function unlock(
        bytes32 requestId,
        address recipient,
        uint256 tokenId,
        bytes32[] calldata relayerProof
    ) external nonReentrant whenNotPaused {
        require(relayerManager.verifyRelayer(msg.sender, relayerProof), "Invalid relayer");
        require(!processedRequests[requestId], "Request already processed");
        require(recipient != address(0), "Invalid recipient");
        require(bridgedTokens[tokenId], "Token not bridged");

        processedRequests[requestId] = true;
        bridgedTokens[tokenId] = false;

        nft.transferFrom(address(this), recipient, tokenId);
        emit TransferProcessed(requestId, msg.sender, true);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Emergency recovery function
    function emergencyWithdraw(
        uint256 tokenId,
        address to
    ) external onlyRole(ADMIN_ROLE) {
        require(to != address(0), "Invalid recipient");
        nft.transferFrom(address(this), to, tokenId);
        bridgedTokens[tokenId] = false;
    }
}