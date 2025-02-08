// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Forwarder is ReentrancyGuard {
    using ECDSA for bytes32;

    address public owner;

    mapping(address => uint256) public nonces;

    event Forwarded(address indexed from, address indexed to, uint256 value, uint256 nonce);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function forwardERC20(
        address token,
        address to,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external nonReentrant {
        require(nonce == nonces[msg.sender]++, "Invalid nonce");
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, token, to, amount, nonce));
        require(_recoverSigner(messageHash, signature) == msg.sender, "Invalid signature");

        IERC20(token).transferFrom(msg.sender, to, amount);
        emit Forwarded(msg.sender, to, amount, nonce);
    }

    function forwardERC721(
        address token,
        address to,
        uint256 tokenId,
        uint256 nonce,
        bytes memory signature
    ) external nonReentrant {
        require(nonce == nonces[msg.sender]++, "Invalid nonce");
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, token, to, tokenId, nonce));
        require(_recoverSigner(messageHash, signature) == msg.sender, "Invalid signature");

        IERC721(token).safeTransferFrom(msg.sender, to, tokenId);
        emit Forwarded(msg.sender, to, tokenId, nonce);
    }

    //function _recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
      //  return hash.toEthSignedMessageHash().recover(signature);
    //}
    function _recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        // Implementing Ethereum Signed Message prefix
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        return ECDSA.recover(ethSignedMessageHash, signature);
    }


    // Fallback function to receive ETH for gas
    receive() external payable {}

    // Owner can withdraw remaining ETH
    function withdrawETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
