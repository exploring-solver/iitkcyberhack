// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./DecentralizedRelayer.sol";
interface IERC20Mintable is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}
contract BridgeSepolia is AccessControl, ReentrancyGuard {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    DecentralizedRelayer public relayer;

    IERC20Mintable public wrappedToken;
    address public remoteBridge;
    bytes32 public merkleRoot;

    mapping(bytes32 => bool) public processedTransfers;
    uint256 public nonce;

    event Released(
        address indexed token,
        address indexed to,
        uint256 amount,
        bytes32 transferId
    );

    event Burned(
        address indexed token,
        address indexed from,
        uint256 amount,
        uint256 nonce,
        bytes32 transferId
    );

    event MerkleRootUpdated(bytes32 newRoot);

    constructor(address _wrappedToken, address _relayer) {
        wrappedToken = IERC20Mintable(_wrappedToken);
        relayer = DecentralizedRelayer(_relayer);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setRemoteBridge(
        address _remoteBridge
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        remoteBridge = _remoteBridge;
    }

    function updateMerkleRoot(bytes32 newRoot) external onlyRole(RELAYER_ROLE) {
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    function release(
        address user,
        uint256 amount,
        bytes32[] calldata merkleProof,
        bytes32 transferId
    ) external nonReentrant onlyRole(RELAYER_ROLE) {
        require(!processedTransfers[transferId], "Transfer already processed");

        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(user, amount, transferId));
        require(
            MerkleProof.verify(merkleProof, merkleRoot, leaf),
            "Invalid merkle proof"
        );

        processedTransfers[transferId] = true;
        wrappedToken.mint(user, amount);

        emit Released(address(wrappedToken), user, amount, transferId);
    }

    function burn(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        nonce++;

        require(
            wrappedToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        wrappedToken.burn(address(this), amount);

        bytes32 transferId = keccak256(
            abi.encodePacked(msg.sender, amount, nonce)
        );

        relayer.requestTransfer(
            transferId,
            msg.sender,
            amount,
            keccak256("SEPOLIA"),
            keccak256("AMOY")
        );

        emit Burned(
            address(wrappedToken),
            msg.sender,
            amount,
            nonce,
            transferId
        );
    }

    function addRelayer(
        address _relayerAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(RELAYER_ROLE, _relayerAddress);
    }

    function removeRelayer(
        address _relayerAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(RELAYER_ROLE, _relayerAddress);
    }
}
