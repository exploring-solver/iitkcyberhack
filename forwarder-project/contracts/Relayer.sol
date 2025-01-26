// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Forwarder.sol";  // Import the Forwarder contract

contract Relayer is ReentrancyGuard {
    using ECDSA for bytes32;

    address public owner;
    Forwarder public forwarder;  // Forwarder contract instance

    mapping(address => uint256) public nonces;

    event Relayed(address indexed user, address indexed forwarder, address indexed token, uint256 amount, uint256 nonce);

    constructor(address payable _forwarder) {
        owner = msg.sender;
        forwarder = Forwarder(_forwarder); // Set the forwarder contract address
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _; 
    }

    // Function to relay ERC20 transfer
    function relayERC20(
        address token,
        address to,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external nonReentrant {
        require(nonce == nonces[msg.sender]++, "Invalid nonce");

        // Verify the user's signature
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, token, to, amount, nonce));
        require(_recoverSigner(messageHash, signature) == msg.sender, "Invalid signature");

        // Forward the transaction via the Forwarder contract
        forwarder.forwardERC20(token, to, amount, nonce, signature);

        // Emit event for relayed transaction
        emit Relayed(msg.sender, address(forwarder), token, amount, nonce);
    }

    // Function to relay ERC721 transfer
    function relayERC721(
        address token,
        address to,
        uint256 tokenId,
        uint256 nonce,
        bytes memory signature
    ) external nonReentrant {
        require(nonce == nonces[msg.sender]++, "Invalid nonce");

        // Verify the user's signature
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, token, to, tokenId, nonce));
        require(_recoverSigner(messageHash, signature) == msg.sender, "Invalid signature");

        // Forward the transaction via the Forwarder contract
        forwarder.forwardERC721(token, to, tokenId, nonce, signature);

        // Emit event for relayed transaction
        emit Relayed(msg.sender, address(forwarder), token, tokenId, nonce);
    }

    // Helper function to recover the signer's address from the signature
    function _recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        return ECDSA.recover(ethSignedMessageHash, signature);
    }

    // Owner can withdraw ETH for gas
    receive() external payable {}

    function withdrawETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
