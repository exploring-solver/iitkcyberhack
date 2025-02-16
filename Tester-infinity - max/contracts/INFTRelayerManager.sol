// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IERC721Mintable is IERC721 {
    function mint(address to, uint256 tokenId) external;
}

interface IERC721Burnable is IERC721 {
    function burn(uint256 tokenId) external;
}

interface IAmoyNFT is IERC721 {
    function transferOwnership(address newOwner) external;
    function owner() external view returns (address);
    function mint(address to) external returns (uint256);
    function burn(uint256 tokenId) external;
}

interface ISepoliaNFT is IERC721Mintable, IERC721Burnable {
    function transferOwnership(address newOwner) external;
    function owner() external view returns (address);
}

interface INFTRelayerManager {
    function verifyRelayer(address relayer, bytes32[] calldata proof) external view returns (bool);
    function generateRequestId(
        address user,
        address recipient,
        uint256 tokenId,
        uint256 nonce,
        uint256 sourceChainId,
        uint256 targetChainId
    ) external pure returns (bytes32);
}