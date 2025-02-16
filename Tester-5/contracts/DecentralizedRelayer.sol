// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DecentralizedRelayer is AccessControl, ReentrancyGuard {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    uint256 public constant MIN_CONFIRMATIONS = 2; // Minimum relayers needed
    
    struct Transfer {
        address user;
        uint256 amount;
        bytes32 sourceChain;
        bytes32 targetChain;
        uint256 timestamp;
        uint256 confirmations;
        bool executed;
        mapping(address => bool) relayerConfirmations;
    }
    
    mapping(bytes32 => Transfer) public transfers;
    uint256 public relayerCount;
    uint256 public requiredConfirmations;
    
    event TransferRequested(
        bytes32 indexed transferId,
        address user,
        uint256 amount,
        bytes32 sourceChain,
        bytes32 targetChain
    );
    
    event TransferConfirmed(
        bytes32 indexed transferId,
        address relayer,
        uint256 confirmations
    );
    
    event TransferExecuted(
        bytes32 indexed transferId,
        address user,
        uint256 amount
    );

    event RelayerAdded(address relayer);
    event RelayerRemoved(address relayer);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
        relayerCount = 1;
        requiredConfirmations = 1;
    }

    function initialize(address admin) external {
        require(
            !hasRole(DEFAULT_ADMIN_ROLE, admin),
            "Already initialized"
        );
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function addRelayer(address relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!hasRole(RELAYER_ROLE, relayer), "Already a relayer");
        grantRole(RELAYER_ROLE, relayer);
        relayerCount++;
        requiredConfirmations = (relayerCount * 2) / 3 + 1; // 2/3 majority
        emit RelayerAdded(relayer);
    }

    function removeRelayer(address relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(hasRole(RELAYER_ROLE, relayer), "Not a relayer");
        revokeRole(RELAYER_ROLE, relayer);
        relayerCount--;
        requiredConfirmations = (relayerCount * 2) / 3 + 1;
        emit RelayerRemoved(relayer);
    }

    function requestTransfer(
        bytes32 transferId,
        address user,
        uint256 amount,
        bytes32 sourceChain,
        bytes32 targetChain
    ) external onlyRole(RELAYER_ROLE) {
        require(!transfers[transferId].executed, "Transfer already executed");
        
        Transfer storage transfer = transfers[transferId];
        transfer.user = user;
        transfer.amount = amount;
        transfer.sourceChain = sourceChain;
        transfer.targetChain = targetChain;
        transfer.timestamp = block.timestamp;
        
        emit TransferRequested(transferId, user, amount, sourceChain, targetChain);
    }

    function confirmTransfer(bytes32 transferId) external onlyRole(RELAYER_ROLE) {
        Transfer storage transfer = transfers[transferId];
        require(!transfer.executed, "Transfer already executed");
        require(!transfer.relayerConfirmations[msg.sender], "Already confirmed");
        
        transfer.relayerConfirmations[msg.sender] = true;
        transfer.confirmations++;
        
        emit TransferConfirmed(transferId, msg.sender, transfer.confirmations);
        
        if (transfer.confirmations >= requiredConfirmations) {
            transfer.executed = true;
            emit TransferExecuted(transferId, transfer.user, transfer.amount);
        }
    }

    function getTransferConfirmations(bytes32 transferId) external view returns (uint256) {
        return transfers[transferId].confirmations;
    }
}