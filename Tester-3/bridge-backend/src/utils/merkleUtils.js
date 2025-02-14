const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

function generateMerkleTree(transactions) {
    const leaves = transactions.map(tx => keccak256(JSON.stringify(tx)));
    return new MerkleTree(leaves, keccak256, { sortPairs: true });
}

function getMerkleRoot(tree) {
    return tree.getRoot().toString('hex');
}

function verifyMerkleProof(leaf, proof, root) {
    const leafHash = keccak256(leaf);
    return tree.verify(proof, leafHash, root);
}

module.exports = {
    generateMerkleTree,
    getMerkleRoot,
    verifyMerkleProof
};