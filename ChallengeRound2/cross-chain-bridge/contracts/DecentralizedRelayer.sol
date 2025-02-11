// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
contract DecentralizedRelayer is ReentrancyGuard, Pausable {
    using ECDSA for bytes32;

    mapping(address => uint256) public nonces;
    mapping(address => bool) public authorizedRelayers;
    
    uint256 public constant MAX_GAS_PRICE = 500 gwei;
    
    event RelayerUpdated(address indexed relayer, bool authorized);
    event TransactionRelayed(
        address indexed sender, 
        address indexed target, 
        bytes data, 
        uint256 nonce
    );
    
    modifier onlyAuthorizedRelayer() {
        require(authorizedRelayers[msg.sender], "Unauthorized relayer");
        _;
    }
    
    function updateRelayer(address relayer, bool authorized) external {
        authorizedRelayers[relayer] = authorized;
        emit RelayerUpdated(relayer, authorized);
    }
    
    function relayTransaction(
        address sender,
        address target,
        bytes calldata data,
        uint256 nonce,
        bytes calldata signature
    ) public nonReentrant whenNotPaused onlyAuthorizedRelayer {
        require(tx.gasprice <= MAX_GAS_PRICE, "Gas price too high");
        require(nonce == nonces[sender]++, "Invalid nonce");
        
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(sender, target, data, nonce, address(this)))
            )
        );
        
        require(messageHash.recover(signature) == sender, "Invalid signature");
        
        (bool success, ) = target.call{gas: gasleft() - 2000}(data);
        require(success, "Transaction failed");
        
        emit TransactionRelayed(sender, target, data, nonce);
    }
    
    // Add batch relay capability
    function relayTransactions(
        address[] calldata senders,
        address[] calldata targets,
        bytes[] calldata dataArray,
        uint256[] calldata nonces,
        bytes[] calldata signatures
    ) external nonReentrant whenNotPaused onlyAuthorizedRelayer {
        require(
            senders.length == targets.length &&
            targets.length == dataArray.length &&
            dataArray.length == nonces.length &&
            nonces.length == signatures.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < senders.length; i++) {
            relayTransaction(
                senders[i],
                targets[i],
                dataArray[i],
                nonces[i],
                signatures[i]
            );
        }
    }
}