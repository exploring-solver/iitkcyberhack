// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

contract Forwarder is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
        uint256 validUntil;
    }

    mapping(address => uint256) private _nonces;
    mapping(bytes32 => bool) private _executed;

    event TransactionForwarded(
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        bool success
    );

    constructor() Ownable(msg.sender) {}

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function verify(
        ForwardRequest memory req,
        bytes calldata signature
    ) public pure returns (bool) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(
                    abi.encode(
                        req.from,
                        req.to,
                        req.value,
                        req.gas,
                        req.nonce,
                        req.data,
                        req.validUntil
                    )
                )
            )
        );
        address signer = ECDSA.recover(digest, signature);
        return signer == req.from;
    }

    function execute(
        ForwardRequest memory req,
        bytes calldata signature
    ) public payable nonReentrant returns (bool, bytes memory) {
        require(block.timestamp <= req.validUntil, "Request expired");
        require(_nonces[req.from] == req.nonce, "Invalid nonce");

        // Skip signature check if called internally via permit flow
        if (msg.sender != address(this)) {
            require(verify(req, signature), "Invalid signature");
        }

        _nonces[req.from]++;
        bytes32 hash = keccak256(abi.encode(req, signature));
        require(!_executed[hash], "Request already executed");
        _executed[hash] = true;

        (bool success, bytes memory returndata) = req.to.call{
            gas: req.gas,
            value: req.value
        }(req.data);

        emit TransactionForwarded(
            req.from,
            req.to,
            req.value,
            req.data,
            success
        );

        if (!success) {
            // If the call failed, bubble up the revert reason
            if (returndata.length > 0) {
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert("Forward request failed");
            }
        }

        return (success, returndata);
    }

    function forwardERC20Transfer(
        address token,
        address from,
        address to,
        uint256 amount,
        bytes calldata signature
    ) external nonReentrant returns (bool) {
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
            nonce: _nonces[from],
            data: data,
            validUntil: block.timestamp + 3600
        });

        (bool success, ) = execute(req, signature);
        require(success, "ERC20 forward failed");
        return success;
    }

    function forwardERC721Transfer(
        address token,
        address from,
        address to,
        uint256 tokenId,
        bytes calldata signature
    ) external nonReentrant returns (bool) {
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
            nonce: _nonces[from],
            data: data,
            validUntil: block.timestamp + 3600
        });

        (bool success, ) = execute(req, signature);
        require(success, "ERC721 forward failed");
        return success;
    }

    function forwardERC20TransferWithPermit(
        address token,
        address from,
        address to,
        uint256 amount,
        uint256 fee, // Add fee parameter
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant returns (bool) {
        require(msg.sender == to, "Only recipient can execute");
        require(token != address(0), "Invalid token address");
        require(from != address(0), "Invalid from address");
        require(to != address(0), "Invalid to address");
        require(amount > 0, "Amount must be greater than 0");
        require(deadline >= block.timestamp, "Permit expired");

        // Permit for amount + fee
        IERC20Permit(token).permit(
            from,
            address(this),
            amount + fee,
            deadline,
            v,
            r,
            s
        );

        // Transfer main amount to recipient
        require(
            IERC20(token).transferFrom(from, to, amount),
            "Transfer failed"
        );

        // Transfer fee to relayer
        if (fee > 0) {
            require(
                IERC20(token).transferFrom(from, msg.sender, fee),
                "Fee transfer failed"
            );
        }

        return true;
    }

    receive() external payable {}

    // Add an event for debugging
    event Debug(string message);
}
