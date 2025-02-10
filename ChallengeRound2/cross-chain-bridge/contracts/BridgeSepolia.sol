// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Define interfaces for mintable and burnable ERC20 tokens
interface IERC20Mintable is IERC20 {
    function mint(address to, uint256 amount) external;
}

interface IERC20Burnable is IERC20 {
    function burn(address from, uint256 amount) external;
}

contract BridgeSepolia is Ownable {
    IERC20Mintable public wrappedToken; // Use IERC20Mintable for minting
    address public remoteBridge;

    event Released(address indexed user, uint256 amount);
    event Burned(address indexed user, uint256 amount);

    constructor(address _wrappedToken, address owner) Ownable(owner) {
        wrappedToken = IERC20Mintable(_wrappedToken); // Initialize with IERC20Mintable
    }

    function setRemoteBridge(address _remoteBridge) external onlyOwner {
        remoteBridge = _remoteBridge;
    }

    // Release wrapped tokens on the destination chain (called by the bridge on the source chain)
    function release(address user, uint256 amount) external onlyOwner {
        wrappedToken.mint(user, amount); // Mint wrapped tokens
        emit Released(user, amount);
    }

    // Burn wrapped tokens on the destination chain
    function burn(uint256 amount) external {
        require(wrappedToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        IERC20Burnable(address(wrappedToken)).burn(address(this), amount); // Burn wrapped tokens
        emit Burned(msg.sender, amount);
    }

    // ✅ Function to mint Wrapped Tokens via the bridge
    function mintWrappedToken(address to, uint256 amount) external onlyOwner {
        wrappedToken.mint(to, amount);
    }
}