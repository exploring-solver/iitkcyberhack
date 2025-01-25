// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Forwarder is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
        uint256 validUntil;
    }

    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public executed;

    event TransactionForwarded(
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data
    );

    constructor() Ownable(msg.sender) {}

    function getNonce(address from) public view returns (uint256) {
        return nonces[from];
    }

    function execute(
        ForwardRequest memory req,
        bytes calldata signature
    ) public payable nonReentrant returns (bool, bytes memory) {
        require(block.timestamp <= req.validUntil, "Request expired");
        require(nonces[req.from] == req.nonce, "Invalid nonce");
        require(verify(req, signature), "Invalid signature");

        nonces[req.from]++;
        bytes32 hash = keccak256(abi.encode(req, signature));
        require(!executed[hash], "Request already executed");
        executed[hash] = true;

        (bool success, bytes memory returndata) = req.to.call{
            gas: req.gas,
            value: req.value
        }(req.data);
        require(success, "Forward request failed");

        emit TransactionForwarded(req.from, req.to, req.value, req.data);
        return (success, returndata);
    }

    function verify(
        ForwardRequest memory req,
        bytes calldata signature
    ) public view returns (bool) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                req.from,
                req.to,
                req.value,
                req.gas,
                req.nonce,
                req.data,
                req.validUntil
            )
        );
        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(digest);
        address signer = ECDSA.recover(hash, signature);
        return signer == req.from;
    }

    function forwardERC20Transfer(
        address token,
        address from,
        address to,
        uint256 amount,
        bytes calldata signature
    ) external nonReentrant {
        bytes memory data = abi.encodeWithSelector(
            IERC20.transferFrom.selector,
            from,
            to,
            amount
        );

        ForwardRequest memory req = ForwardRequest({
            from: from,
            to: token,
            value: 0,
            gas: 100000,
            nonce: nonces[from],
            data: data,
            validUntil: block.timestamp + 3600
        });

        (bool success, ) = execute(req, signature);
        require(success, "ERC20 forward failed");
    }

    function forwardERC721Transfer(
        address token,
        address from,
        address to,
        uint256 tokenId,
        bytes calldata signature
    ) external nonReentrant {
        bytes memory data = abi.encodeWithSelector(
            IERC721.transferFrom.selector,
            from,
            to,
            tokenId
        );

        ForwardRequest memory req = ForwardRequest({
            from: from,
            to: token,
            value: 0,
            gas: 100000,
            nonce: nonces[from],
            data: data,
            validUntil: block.timestamp + 3600
        });

        (bool success, ) = execute(req, signature);
        require(success, "ERC721 forward failed");
    }

    receive() external payable {}
}
