// BridgeSepoliaNFTV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ISepoliaNFT is IERC721 {
    function mint(address to, uint256 tokenId) external;
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

contract BridgeSepoliaNFTV2 is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    ISepoliaNFT public wrappedNFT;
    INFTRelayerManager public relayerManager;
    mapping(bytes32 => bool) public processedRequests;
    mapping(uint256 => bool) public bridgedTokens;

    event ReleaseRequested(
        bytes32 indexed requestId,
        address indexed recipient,
        uint256 tokenId
    );

    event TransferProcessed(
        bytes32 indexed requestId,
        address indexed executor,
        bool success
    );

    constructor(
        address _wrappedNFT,
        address _relayerManager,
        address admin
    ) {
        wrappedNFT = ISepoliaNFT(_wrappedNFT);
        relayerManager = INFTRelayerManager(_relayerManager);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function release(
        bytes32 requestId,
        address recipient,
        uint256 tokenId,
        bytes32[] calldata relayerProof
    ) external nonReentrant whenNotPaused {
        require(relayerManager.verifyRelayer(msg.sender, relayerProof), "Invalid relayer");
        require(!processedRequests[requestId], "Request already processed");
        require(recipient != address(0), "Invalid recipient");
        require(!bridgedTokens[tokenId], "Token already bridged");

        processedRequests[requestId] = true;
        bridgedTokens[tokenId] = true;

        wrappedNFT.mint(recipient, tokenId);
        emit TransferProcessed(requestId, msg.sender, true);
    }

    function burnWithRelay(
        uint256 tokenId,
        address recipient
    ) external nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient");
        require(wrappedNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(wrappedNFT.getApproved(tokenId) == address(this), "Bridge not approved");
        require(bridgedTokens[tokenId], "Token not bridged");

        bytes32 requestId = relayerManager.generateRequestId(
            msg.sender,
            recipient,
            tokenId,
            block.timestamp,
            block.chainid,
            421613 // Amoy chain ID
        );

        bridgedTokens[tokenId] = false;
        wrappedNFT.burn(tokenId);
        emit ReleaseRequested(requestId, recipient, tokenId);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Emergency functions
    function emergencyMint(
        address to,
        uint256 tokenId
    ) external onlyRole(ADMIN_ROLE) {
        require(to != address(0), "Invalid recipient");
        wrappedNFT.mint(to, tokenId);
        bridgedTokens[tokenId] = true;
    }

    function emergencyBurn(
        uint256 tokenId
    ) external onlyRole(ADMIN_ROLE) {
        wrappedNFT.burn(tokenId);
        bridgedTokens[tokenId] = false;
    }
}