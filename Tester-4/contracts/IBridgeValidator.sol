// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBridgeValidator {
    function validateTransfer(
        address token,
        address from,
        address to,
        uint256 amount,
        bytes32[] calldata proof
    ) external view returns (bool);
}

