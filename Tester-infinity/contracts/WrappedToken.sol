// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WrappedToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, address owner)
        ERC20(name, symbol)
        Ownable(owner)
    {}

    // Mint wrapped tokens (only callable by the bridge)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Burn wrapped tokens (only callable by the bridge)
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}