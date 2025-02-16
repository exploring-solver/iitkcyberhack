// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IRelayerManager {
    function verifyRelayer(address relayer, bytes32[] calldata proof) external view returns (bool);
    function generateRequestId(
        address user,
        address recipient,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId,
        uint256 targetChainId
    ) external pure returns (bytes32);
}

// Base interface extending IERC20
interface IERC20Mintable is IERC20 {
    function mint(address to, uint256 amount) external;
}

// Interface for burning capability
interface IERC20Burnable is IERC20 {
    function burn(address from, uint256 amount) external;
}

// Interface for the Wrapped Token on Sepolia (supporting both mint and burn)
interface ISepoliaToken is IERC20Mintable, IERC20Burnable {
    function transferOwnership(address newOwner) external;
    function owner() external view returns (address);
}

contract BridgeSepoliaV2 is Ownable, ReentrancyGuard {
    ISepoliaToken public wrappedToken;
    IRelayerManager public relayerManager;
    mapping(bytes32 => bool) public processedRequests;

    event ReleaseRequested(
        bytes32 indexed requestId,
        address indexed recipient,
        uint256 amount
    );

    constructor(
        address _wrappedToken,
        address _relayerManager,
        address owner
    ) Ownable(owner) {
        wrappedToken = ISepoliaToken(_wrappedToken);
        relayerManager = IRelayerManager(_relayerManager);
    }

    function release(
        bytes32 requestId,
        address recipient,
        uint256 amount,
        bytes32[] calldata relayerProof
    ) external nonReentrant {
        require(relayerManager.verifyRelayer(msg.sender, relayerProof), "Invalid relayer");
        require(!processedRequests[requestId], "Request already processed");
        
        processedRequests[requestId] = true;
        wrappedToken.mint(recipient, amount);
    }

    function burnWithRelay(
        uint256 amount,
        address recipient
    ) external nonReentrant {
        require(wrappedToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        bytes32 requestId = relayerManager.generateRequestId(
            msg.sender,
            recipient,
            amount,
            block.timestamp, // Using timestamp as nonce
            block.chainid,
            421613 // Amoy chain ID
        );
        
        IERC20Burnable(address(wrappedToken)).burn(address(this), amount);
        emit ReleaseRequested(requestId, recipient, amount);
    }
}