// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// BridgeAmoy.sol
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./DecentralizedRelayer.sol";

interface IERC20Mintable is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

contract BridgeAmoy is AccessControl, ReentrancyGuard {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    DecentralizedRelayer public relayer;

    IERC20Mintable public token;
    address public remoteBridge;
    bytes32 public merkleRoot;

    mapping(bytes32 => bool) public processedTransfers;
    uint256 public nonce;

    event Locked(
        address indexed token,
        address indexed from,
        uint256 amount,
        uint256 nonce,
        bytes32 transferId
    );

    event Unlocked(
        address indexed token,
        address indexed to,
        uint256 amount,
        bytes32 transferId
    );

    event MerkleRootUpdated(bytes32 newRoot);

    constructor(address _token, address _relayer) {
        token = IERC20Mintable(_token);
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

    function lock(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        // Check if the bridge contract has the RELAYER_ROLE
        require(
            relayer.hasRole(RELAYER_ROLE, address(this)),
            "Bridge must have RELAYER_ROLE"
        );

        // Save the current nonce
        uint256 currentNonce = nonce;
        nonce++;

        // Check token balance before transfer
        require(
            token.balanceOf(msg.sender) >= amount,
            "Insufficient token balance"
        );

        // Check allowance before transfer
        require(
            token.allowance(msg.sender, address(this)) >= amount,
            "Insufficient token allowance"
        );

        // Perform the transfer
        bool transferred = token.transferFrom(
            msg.sender,
            address(this),
            amount
        );
        require(transferred, "Token transfer failed");

        // Generate transfer ID
        bytes32 transferId = keccak256(
            abi.encodePacked(msg.sender, amount, currentNonce, block.timestamp)
        );

        // Request transfer through relayer
        try
            relayer.requestTransfer(
                transferId,
                msg.sender,
                amount,
                keccak256("AMOY"),
                keccak256("SEPOLIA")
            )
        {
            emit Locked(
                address(token),
                msg.sender,
                amount,
                currentNonce,
                transferId
            );
        } catch Error(string memory reason) {
            // If relayer call fails, revert the whole transaction
            revert(
                string(abi.encodePacked("Relayer request failed: ", reason))
            );
        }
    }

    function unlock(
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
        require(token.transfer(user, amount), "Transfer failed");

        emit Unlocked(address(token), user, amount, transferId);
    }

    function getContractState()
        external
        view
        returns (
            uint256 bridgeBalance,
            uint256 userBalance,
            uint256 userAllowance,
            bool hasRelayerRole
        )
    {
        bridgeBalance = token.balanceOf(address(this));
        userBalance = token.balanceOf(msg.sender);
        userAllowance = token.allowance(msg.sender, address(this));
        hasRelayerRole = relayer.hasRole(RELAYER_ROLE, address(this));
    }
    // Change the parameter names in these functions
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
