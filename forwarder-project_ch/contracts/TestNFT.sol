// contracts/TestNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TestNFT is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("TestNFT", "TNFT") {}

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://myapi.com/metadata/";
    }

    function safeMint(address to) public {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _tokenIdCounter += 1;
    }
}
