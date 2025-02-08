// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Rel {
    event ERC20Relayed(address indexed user, address indexed token, address indexed recipient, uint256 amount, uint256 nonce);
    event ERC721Relayed(address indexed user, address indexed token, address indexed recipient, uint256 tokenId, uint256 nonce);

    mapping(address => uint256) public nonces;

    function relayERC20(
        address user,
        address token,
        address recipient,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(nonces[user] == nonce, "Invalid nonce");

        // Recreate the hash
        bytes32 messageHash = keccak256(abi.encodePacked(user, token, recipient, amount, nonce));

        // Recover the signer from the signature
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address signer = recoverSigner(ethSignedMessageHash, signature);

        require(signer == user, "Invalid signature");

        // Update the nonce for the user
        nonces[user]++;

        // Transfer the ERC20 tokens (requires approval)
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0xa9059cbb, recipient, amount)
        ); // Transfer function selector
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Token transfer failed");

        emit ERC20Relayed(user, token, recipient, amount, nonce);
    }

    function relayERC721(
        address user,
        address token,
        address recipient,
        uint256 tokenId,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(nonces[user] == nonce, "Invalid nonce");

        // Recreate the hash
        bytes32 messageHash = keccak256(abi.encodePacked(user, token, recipient, tokenId, nonce));

        // Recover the signer from the signature
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address signer = recoverSigner(ethSignedMessageHash, signature);

        require(signer == user, "Invalid signature");

        // Update the nonce for the user
        nonces[user]++;

        // Transfer the ERC721 token (requires approval)
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0x23b872dd, user, recipient, tokenId)
        ); // TransferFrom function selector
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Token transfer failed");

        emit ERC721Relayed(user, token, recipient, tokenId, nonce);
    }

    function recoverSigner(bytes32 hash, bytes memory signature) public pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        // Check the signature length
        if (signature.length != 65) {
            return address(0);
        }
        // Divide the signature in r, s and v variables
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        // Version of signature should be 27 or 28, but 0 and 1 are also possible
        if (v < 27) {
            v += 27;
        }
        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return address(0);
        } else {
            return ecrecover(hash, v, r, s);
        }
    }
}
