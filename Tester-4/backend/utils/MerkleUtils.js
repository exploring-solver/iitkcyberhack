const { MerkleTree } = require('merkletreejs');
const { ethers } = require('ethers');
const keccak256 = require('keccak256');

class MerkleUtils {
  static createTree(transfers) {
    const leaves = transfers.map(transfer => this.generateLeaf(transfer));
    return new MerkleTree(leaves, keccak256, {
      sortPairs: true,
      hashLeaves: false
    });
  }

  static generateLeaf(transfer) {
    const encoded = ethers.solidityPacked(
      ['address', 'uint256', 'bytes32'],
      [
        transfer.user,
        transfer.amount.toString(),
        transfer.transferId || ethers.hexlify(ethers.randomBytes(32))
      ]
    );
    return ethers.keccak256(encoded);
  }

  static verifyProof(proof, leaf, root, tree) {
    return tree.verify(proof, leaf, root);
  }
}

module.exports = MerkleUtils;