// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CommissionManager} from "../src/CommissionManager.sol";

contract Deploy is Script {
    function run() external returns (CommissionManager manager) {
        address forwarder = vm.envAddress("CRE_FORWARDER");
        address workflowOwner = vm.envAddress("CRE_WORKFLOW_OWNER");
        address swapRouter = vm.envAddress("UNISWAP_UNIVERSAL_ROUTER");

        vm.startBroadcast();
        manager = new CommissionManager(forwarder, workflowOwner, swapRouter);
        vm.stopBroadcast();

        console.log("CommissionManager:", address(manager));
        console.log("VaultDeployer:", address(manager.vaultDeployer()));
    }
}
