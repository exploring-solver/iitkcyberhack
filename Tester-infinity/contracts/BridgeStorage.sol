// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BridgeStorage is Ownable {
    mapping(bytes32 => bool) public processedTransfers;
    mapping(address => mapping(address => uint256)) public bridgedBalances;
    
    event TransferProcessed(bytes32 indexed transferId);
    
    // Add a constructor to pass the initial owner to Ownable
    constructor() Ownable(msg.sender) {}

    function markTransferProcessed(bytes32 transferId) external onlyOwner {
        require(!processedTransfers[transferId], "Transfer already processed");
        processedTransfers[transferId] = true;
        emit TransferProcessed(transferId);
    }
    
    function updateBridgedBalance(
        address token,
        address user,
        uint256 amount,
        bool add
    ) external onlyOwner {
        if (add) {
            bridgedBalances[token][user] += amount;
        } else {
            require(bridgedBalances[token][user] >= amount, "Insufficient balance");
            bridgedBalances[token][user] -= amount;
        }
    }
}
