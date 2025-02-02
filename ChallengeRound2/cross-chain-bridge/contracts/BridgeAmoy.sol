// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20Mintable is IERC20 {
    function mint(address to, uint256 amount) external;
}

contract BridgeAmoy is Ownable {
    IERC20Mintable public token;
    address public remoteBridge;

    event Locked(address indexed user, uint256 amount);
    event Unlocked(address indexed user, uint256 amount);

    constructor(address _token, address owner) Ownable(owner) {
        token = IERC20Mintable(_token);
    }

    function setRemoteBridge(address _remoteBridge) external onlyOwner {
        remoteBridge = _remoteBridge;
    }

    // Lock tokens on the source chain
    function lock(uint256 amount) external {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Locked(msg.sender, amount);
    }

    // Unlock tokens on the source chain (called by the bridge on the destination chain)
    function unlock(address user, uint256 amount) external onlyOwner {
        require(token.transfer(user, amount), "Transfer failed");
        emit Unlocked(user, amount);
    }
}