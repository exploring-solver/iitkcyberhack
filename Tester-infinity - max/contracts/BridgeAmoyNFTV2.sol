// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IAmoyNFT is IERC721 {
    function transferOwnership(address newOwner) external;
    function owner() external view returns (address);
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

contract BridgeAmoyNFTV2 is Ownable, ReentrancyGuard {
    IAmoyNFT public nft;
    INFTRelayerManager public relayerManager;
    mapping(bytes32 => bool) public processedRequests;

    event LockRequested(
        bytes32 indexed requestId,
        address indexed user,
        address indexed recipient,
        uint256 tokenId
    );

    constructor(
        address _nft, 
        address _relayerManager,
        address owner
    ) Ownable(owner) {
        nft = IAmoyNFT(_nft);
        relayerManager = INFTRelayerManager(_relayerManager);
    }

    function lockWithRelay(
        uint256 tokenId,
        address recipient
    ) external nonReentrant {
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nft.getApproved(tokenId) == address(this), "Bridge not approved");
        
        // Transfer NFT to bridge
        nft.transferFrom(msg.sender, address(this), tokenId);
        
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
    ) external nonReentrant {
        require(relayerManager.verifyRelayer(msg.sender, relayerProof), "Invalid relayer");
        require(!processedRequests[requestId], "Request already processed");
        
        processedRequests[requestId] = true;
        nft.transferFrom(address(this), recipient, tokenId);
    }
}