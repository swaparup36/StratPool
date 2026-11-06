// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Vault} from "./Vault.sol";

contract VaultDeployer {
    address public immutable commissionManagerAddress;
    address public immutable swapRouter;

    mapping(address => address) public vaultOf;

    event VaultCreated(address indexed investor, address indexed vault);

    error VaultAlreadyExists();
    error InvalidAddress();

    constructor(address _commissionManagerAddress, address _swapRouter) {
        if (_commissionManagerAddress == address(0)) revert InvalidAddress();
        if (_swapRouter == address(0)) revert InvalidAddress();

        commissionManagerAddress = _commissionManagerAddress;
        swapRouter = _swapRouter;
    }

    function createVault() external returns (address vaultAddress) {
        if (vaultOf[msg.sender] != address(0)) {
            revert VaultAlreadyExists();
        }

        Vault vault = new Vault(msg.sender, commissionManagerAddress, swapRouter);

        vaultAddress = address(vault);
        vaultOf[msg.sender] = vaultAddress;

        emit VaultCreated(msg.sender, vaultAddress);
    }

    function getVault(address investor) external view returns (address) {
        return vaultOf[investor];
    }
}
