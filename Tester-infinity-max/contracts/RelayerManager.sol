// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract RelayerManager is ReentrancyGuard, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct TransferRequest {
        address user;
        address recipient;
        uint256 amount;
        uint256 nonce;
        uint256 sourceChainId;
        uint256 targetChainId;
        bool executed;
    }

    mapping(bytes32 => TransferRequest) public transferRequests;
    mapping(address => uint256) public nonces;
    bytes32 public relayerMerkleRoot;
    
    event TransferRequested(
        bytes32 indexed requestId,
        address indexed user,
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId,
        uint256 targetChainId
    );
    
    event TransferExecuted(
        bytes32 indexed requestId,
        address indexed executor
    );

    event RelayerRootUpdated(
        bytes32 oldRoot,
        bytes32 newRoot,
        address updater
    );

    constructor(bytes32 _relayerMerkleRoot, address admin) {
        relayerMerkleRoot = _relayerMerkleRoot;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function updateRelayerRoot(bytes32 _newRoot) 
        external 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
    {
        bytes32 oldRoot = relayerMerkleRoot;
        relayerMerkleRoot = _newRoot;
        emit RelayerRootUpdated(oldRoot, _newRoot, msg.sender);
    }

    function generateRequestId(
        address user,
        address recipient,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId,
        uint256 targetChainId
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            user,
            recipient,
            amount,
            nonce,
            sourceChainId,
            targetChainId
        ));
    }

    function verifyRelayer(address relayer, bytes32[] calldata proof) 
        public view returns (bool) 
    {
        bytes32 leaf = keccak256(abi.encodePacked(relayer));
        return MerkleProof.verify(proof, relayerMerkleRoot, leaf);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Emergency function to handle stuck transfers
    function emergencyExecuteTransfer(bytes32 requestId)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(!transferRequests[requestId].executed, "Transfer already executed");
        transferRequests[requestId].executed = true;
        emit TransferExecuted(requestId, msg.sender);
    }
}