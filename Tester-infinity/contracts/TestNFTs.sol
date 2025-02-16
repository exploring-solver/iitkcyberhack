// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestNFTs is ERC721, ERC721URIStorage, Ownable {
     uint256 private _tokenIds;

    // Base URI for NFT metadata
    string private _baseTokenURI;

    constructor() ERC721("Test NFTs", "TNFT") Ownable(msg.sender) {
        // Auto-mint 3 NFTs to deployer
        for (uint256 i = 0; i < 3; i++) {
            safeMint(msg.sender, string(abi.encodePacked("ipfs://QmTest/", Strings.toString(i))));
        }
    }

    function safeMint(address to, string memory uri) public onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage)
        returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}