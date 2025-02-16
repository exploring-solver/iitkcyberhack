// BridgeAmoyV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAmoyToken is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

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

contract BridgeAmoyV2 is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IAmoyToken public token;
    IRelayerManager public relayerManager;
    mapping(bytes32 => bool) public processedRequests;
    uint256 public maxTransferAmount;
    uint256 public minTransferAmount;
    
    event LockRequested(
        bytes32 indexed requestId,
        address indexed user,
        address indexed recipient,
        uint256 amount
    );

    event TransferProcessed(
        bytes32 indexed requestId,
        address indexed executor,
        bool success
    );

    event BridgeLimitsUpdated(
        uint256 newMinAmount,
        uint256 newMaxAmount
    );

    constructor(
        address _token, 
        address _relayerManager,
        address admin,
        uint256 _minTransferAmount,
        uint256 _maxTransferAmount
    ) {
        token = IAmoyToken(_token);
        relayerManager = IRelayerManager(_relayerManager);
        minTransferAmount = _minTransferAmount;
        maxTransferAmount = _maxTransferAmount;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function lockWithRelay(
        uint256 amount,
        address recipient
    ) external nonReentrant whenNotPaused {
        require(amount >= minTransferAmount, "Amount below minimum");
        require(amount <= maxTransferAmount, "Amount above maximum");
        require(recipient != address(0), "Invalid recipient");
        
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        bytes32 requestId = relayerManager.generateRequestId(
            msg.sender,
            recipient,
            amount,
            block.timestamp,
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
    ) external nonReentrant whenNotPaused {
        require(relayerManager.verifyRelayer(msg.sender, relayerProof), "Invalid relayer");
        require(!processedRequests[requestId], "Request already processed");
        require(recipient != address(0), "Invalid recipient");
        require(amount >= minTransferAmount, "Amount below minimum");
        require(amount <= maxTransferAmount, "Amount above maximum");
        
        processedRequests[requestId] = true;
        
        bool success = token.transfer(recipient, amount);
        emit TransferProcessed(requestId, msg.sender, success);
        
        require(success, "Transfer failed");
    }

    function updateTransferLimits(
        uint256 _minAmount,
        uint256 _maxAmount
    ) external onlyRole(ADMIN_ROLE) {
        require(_minAmount <= _maxAmount, "Invalid limits");
        minTransferAmount = _minAmount;
        maxTransferAmount = _maxAmount;
        emit BridgeLimitsUpdated(_minAmount, _maxAmount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Emergency recovery function
    function emergencyWithdraw(
        address token_,
        address to,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) {
        require(to != address(0), "Invalid recipient");
        IERC20(token_).transfer(to, amount);
    }
}