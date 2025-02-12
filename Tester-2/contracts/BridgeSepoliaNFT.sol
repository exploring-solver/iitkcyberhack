// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC721Mintable is IERC721 {
    function mint(address to, uint256 tokenId) external;
    function burn(uint256 tokenId) external;
}

contract BridgeSepoliaNFT is Ownable {
    IERC721Mintable public wrappedNFT;
    address public remoteBridge;

    event Released(address indexed user, uint256 tokenId);
    event Burned(address indexed user, uint256 tokenId);

    constructor(address _wrappedNFT, address owner) Ownable(owner) {
        wrappedNFT = IERC721Mintable(_wrappedNFT);
    }

    function setRemoteBridge(address _remoteBridge) external onlyOwner {
        remoteBridge = _remoteBridge;
    }

    // Release wrapped NFT on the destination chain
    function release(address user, uint256 tokenId) external onlyOwner {
        wrappedNFT.mint(user, tokenId);
        emit Released(user, tokenId);
    }

    // Burn wrapped NFT on the destination chain
    function burn(uint256 tokenId) external {
        require(wrappedNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        wrappedNFT.burn(tokenId);
        emit Burned(msg.sender, tokenId);
    }
}