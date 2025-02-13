// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NativeNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    AccessControl,
    Pausable
{
    using Strings for uint256;

    uint256 private _tokenIds;
    string private _baseTokenURI;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    event NFTMinted(address indexed to, uint256 tokenId, string uri);
    event NFTBurned(uint256 tokenId);
    event BaseURISet(string baseURI);

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function mint(
        address to,
        string memory uri
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        _tokenIds++;
        uint256 tokenId = _tokenIds;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit NFTMinted(to, tokenId, uri);
        return tokenId;
    }

    function burn(
        uint256 tokenId
    ) external onlyRole(BURNER_ROLE) whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(
            isApprovedForAll(_ownerOf(tokenId), _msgSender()) ||
                _ownerOf(tokenId) == _msgSender(),
            "Not approved or owner"
        );

        _burn(tokenId);
        emit NFTBurned(tokenId);
    }

    function setBaseURI(
        string memory baseURI
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = baseURI;
        emit BaseURISet(baseURI);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Required overrides for multiple inheritance
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // function _burn(uint256 tokenId) internal override(ERC721) {
    //     super._burn(tokenId);
    // }
}
