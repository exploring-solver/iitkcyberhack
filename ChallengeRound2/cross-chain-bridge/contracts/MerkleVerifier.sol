// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleVerifier is Ownable {
    bytes32 public merkleRoot;
    
    // Events for better transparency
    event MerkleRootUpdated(bytes32 oldRoot, bytes32 newRoot);
    event LeafVerified(bytes32 indexed leaf, bool verified);
    
    // Pass the initial owner (msg.sender) to the Ownable constructor
    constructor(bytes32 _merkleRoot) Ownable(msg.sender) {
        merkleRoot = _merkleRoot;
    }
    
    // Ability to update the Merkle root
    function updateMerkleRoot(bytes32 _newRoot) external onlyOwner {
        bytes32 oldRoot = merkleRoot;
        merkleRoot = _newRoot;
        emit MerkleRootUpdated(oldRoot, _newRoot);
    }
    
    function verify(bytes32[] calldata proof, bytes32 leaf) external view returns (bool) {
        bool isValid = MerkleProof.verify(proof, merkleRoot, leaf);
        // emit LeafVerified(leaf, isValid);
        return isValid;
    }
    
    // Batch verification for gas optimization
    function verifyMultiple(bytes32[][] calldata proofs, bytes32[] calldata leaves) 
        external 
        view
        returns (bool[] memory results) 
    {
        require(proofs.length == leaves.length, "Length mismatch");
        results = new bool[](leaves.length);
        
        for (uint256 i = 0; i < leaves.length; i++) {
            results[i] = MerkleProof.verify(proofs[i], merkleRoot, leaves[i]);
            // emit LeafVerified(leaves[i], results[i]);
        }
        return results;
    }
}
