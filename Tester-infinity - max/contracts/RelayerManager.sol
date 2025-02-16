// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract RelayerManager is ReentrancyGuard {
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

    constructor(bytes32 _relayerMerkleRoot) {
        relayerMerkleRoot = _relayerMerkleRoot;
    }

    function updateRelayerRoot(bytes32 _newRoot) external {
        // Add access control here
        relayerMerkleRoot = _newRoot;
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
}