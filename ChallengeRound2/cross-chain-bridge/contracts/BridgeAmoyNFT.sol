// BridgeAmoyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC721Mintable is IERC721 {
    function mint(address to) external returns (uint256);
    function burn(uint256 tokenId) external;
}

contract BridgeAmoyNFT is Ownable {
    IERC721Mintable public nativeNFT;
    address public remoteBridge;
    
    mapping(uint256 => bool) public lockedTokens;

    event Locked(address indexed user, uint256 tokenId);
    event Unlocked(address indexed user, uint256 tokenId);
    event Minted(address indexed to, uint256 tokenId);

    constructor(address _nativeNFT, address owner) Ownable(owner) {
        nativeNFT = IERC721Mintable(_nativeNFT);
    }

    function setRemoteBridge(address _remoteBridge) external onlyOwner {
        remoteBridge = _remoteBridge;
    }

    // Added mint function to create new NFTs
    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = nativeNFT.mint(to);
        emit Minted(to, tokenId);
        return tokenId;
    }

    // Lock NFT on the source chain
    function lock(uint256 tokenId) external {
        require(!lockedTokens[tokenId], "Token already locked");
        require(nativeNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        
        nativeNFT.transferFrom(msg.sender, address(this), tokenId);
        lockedTokens[tokenId] = true;
        emit Locked(msg.sender, tokenId);
    }

    // Unlock NFT on the source chain
    function unlock(address user, uint256 tokenId) external onlyOwner {
        require(lockedTokens[tokenId], "Token not locked");
        lockedTokens[tokenId] = false;
        nativeNFT.transferFrom(address(this), user, tokenId);
        emit Unlocked(user, tokenId);
    }
}