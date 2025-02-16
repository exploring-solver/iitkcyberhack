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

// Interface for the Native Token on Amoy
interface IAmoyToken is IERC20Mintable {
    function transferOwnership(address newOwner) external;
    function owner() external view returns (address);
}

contract BridgeAmoyV2 is Ownable, ReentrancyGuard {
    IAmoyToken public token;
    IRelayerManager public relayerManager;
    mapping(bytes32 => bool) public processedRequests;

    event LockRequested(
        bytes32 indexed requestId,
        address indexed user,
        address indexed recipient,
        uint256 amount
    );

    constructor(
        address _token, 
        address _relayerManager,
        address owner
    ) Ownable(owner) {
        token = IAmoyToken(_token);
        relayerManager = IRelayerManager(_relayerManager);
    }

    function lockWithRelay(
        uint256 amount,
        address recipient
    ) external nonReentrant {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        bytes32 requestId = relayerManager.generateRequestId(
            msg.sender,
            recipient,
            amount,
            block.timestamp, // Using timestamp as nonce
            block.chainid,
            11155111 // Sepolia chain ID
        );
        
        emit LockRequested(requestId, msg.sender, recipient, amount);
    }

    function unlock(
        bytes32 requestId,
        address recipient,
        uint256 amount,
        bytes32[] calldata relayerProof
    ) external nonReentrant {
        require(relayerManager.verifyRelayer(msg.sender, relayerProof), "Invalid relayer");
        require(!processedRequests[requestId], "Request already processed");
        
        processedRequests[requestId] = true;
        require(token.transfer(recipient, amount), "Transfer failed");
    }
}
