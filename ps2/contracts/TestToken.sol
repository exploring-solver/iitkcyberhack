// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract TestToken is ERC20Permit {
    constructor(uint256 initialSupply) ERC20("Test Token", "TEST") ERC20Permit("Test Token") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    // Function to mint tokens for testing
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
} 