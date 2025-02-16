// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IERC721Mintable is IERC721 {
    function mint(address to, uint256 tokenId) external;
}

interface IERC721Burnable is IERC721 {
    function burn(uint256 tokenId) external;
}

interface ISepoliaNFT is IERC721Mintable, IERC721Burnable {
    function transferOwnership(address newOwner) external;
    function owner() external view returns (address);
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

contract BridgeSepoliaNFTV2 is Ownable, ReentrancyGuard {
    ISepoliaNFT public wrappedNFT;
    INFTRelayerManager public relayerManager;
    mapping(bytes32 => bool) public processedRequests;

    event ReleaseRequested(
        bytes32 indexed requestId,
        address indexed recipient,
        uint256 tokenId
    );

    constructor(
        address _wrappedNFT,
        address _relayerManager,
        address owner
    ) Ownable(owner) {
        wrappedNFT = ISepoliaNFT(_wrappedNFT);
        relayerManager = INFTRelayerManager(_relayerManager);
    }

    function release(
        bytes32 requestId,
        address recipient,
        uint256 tokenId,
        bytes32[] calldata relayerProof
    ) external nonReentrant {
        require(relayerManager.verifyRelayer(msg.sender, relayerProof), "Invalid relayer");
        require(!processedRequests[requestId], "Request already processed");
        
        processedRequests[requestId] = true;
        wrappedNFT.mint(recipient, tokenId);
    }

    function burnWithRelay(
        uint256 tokenId,
        address recipient
    ) external nonReentrant {
        require(wrappedNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(wrappedNFT.getApproved(tokenId) == address(this), "Bridge not approved");
        
        bytes32 requestId = relayerManager.generateRequestId(
            msg.sender,
            recipient,
            tokenId,
            block.timestamp,
            block.chainid,
            421613 // Amoy chain ID
        );
        
        wrappedNFT.burn(tokenId);
        emit ReleaseRequested(requestId, recipient, tokenId);
    }
}