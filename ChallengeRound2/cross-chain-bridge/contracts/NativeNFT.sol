// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NativeNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    constructor(string memory name, string memory symbol, address owner) 
        ERC721(name, symbol)
        Ownable(owner)
    {}

    function mint(address to) external onlyOwner returns (uint256) {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        _safeMint(to, newTokenId);
        return newTokenId;
    }

    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }
}