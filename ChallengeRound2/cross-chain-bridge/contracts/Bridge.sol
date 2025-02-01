// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

// contract Bridge is Ownable {
//     IERC20 public token;
//     address public remoteBridge;

//     event Locked(address indexed user, uint256 amount);
//     event Released(address indexed user, uint256 amount);

//     constructor(address _token, address owner) Ownable(owner) { // Pass owner to Ownable constructor
//         token = IERC20(_token);
//     }

//     function setRemoteBridge(address _remoteBridge) external onlyOwner {
//         remoteBridge = _remoteBridge;
//     }

//     function lock(uint256 amount) external {
//         require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
//         emit Locked(msg.sender, amount);
//     }

//     function release(address user, uint256 amount) external onlyOwner {
//         require(token.transfer(user, amount), "Release failed");
//         emit Released(user, amount);
//     }
// }


// Fixed release logic:
// Earlier release() was just transferring not minting, hence we were getting insufficient funds error
// Now it actually mints.abi

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Define an interface for mintable ERC20 tokens
interface IERC20Mintable is IERC20 {
    function mint(address to, uint256 amount) external;
}

contract Bridge is Ownable {
    IERC20Mintable public token;
    address public remoteBridge;

    event Locked(address indexed user, uint256 amount);
    event Released(address indexed user, uint256 amount);

    constructor(address _token, address owner) Ownable(owner) { // Pass owner to Ownable constructor
        token = IERC20Mintable(_token);
    }

    function setRemoteBridge(address _remoteBridge) external onlyOwner {
        remoteBridge = _remoteBridge;
    }

    function lock(uint256 amount) external {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Locked(msg.sender, amount);
    }

    function release(address user, uint256 amount) external onlyOwner {
        token.mint(user, amount); // Mint tokens instead of transferring
        emit Released(user, amount);
    }
}
