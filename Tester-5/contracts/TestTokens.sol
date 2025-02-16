// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestTokens is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1M tokens with 18 decimals

    constructor() ERC20("Test Token", "TST") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Optional: Add burn function for testing token destruction
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    // Optional: Add transfer with callback for testing complex scenarios
    function transferWithCallback(address to, uint256 amount) public returns (bool) {
        bool success = transfer(to, amount);
        require(success, "Transfer failed");
        
        // Emit custom event for testing event listeners
        emit TransferWithCallback(msg.sender, to, amount);
        return true;
    }

    event TransferWithCallback(address indexed from, address indexed to, uint256 value);
}