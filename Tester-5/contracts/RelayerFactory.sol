// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DecentralizedRelayer.sol";

contract RelayerFactory {
    event RelayerDeployed(address relayerAddress);
    
    function deploy(bytes32 salt) external returns (address) {
        DecentralizedRelayer relayer = new DecentralizedRelayer{salt: salt}();
        relayer.initialize(msg.sender);  // Initialize with deployer as admin
        emit RelayerDeployed(address(relayer));
        return address(relayer);
    }

    function computeAddress(bytes32 salt) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(type(DecentralizedRelayer).creationCode)
            )
        );
        return address(uint160(uint256(hash)));
    }
}