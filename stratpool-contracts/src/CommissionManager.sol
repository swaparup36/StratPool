// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Vault} from "./Vault.sol";
import {VaultDeployer} from "./VaultDeployer.sol";

interface IReceiver is IERC165 {
    function onReport(bytes calldata metadata, bytes calldata report) external;
}

contract CommissionManager is IReceiver, ReentrancyGuard {
    enum Action {
        LockCommission,
        SettleCommission
    }

    VaultDeployer public immutable vaultDeployer;
    address public immutable forwarder;
    address public immutable workflowOwner;

    event CommissionLocked(address indexed vault, address indexed token, uint256 amount);
    event CommissionSettled(address indexed vault, address indexed strategist, address indexed token, uint256 amount);

    error OnlyForwarder();
    error InvalidWorkflowOwner();
    error InvalidChain();
    error InvalidAddress();
    error ZeroAmount();
    error VaultNotFound();

    // comission manager deploys the vault deployer contract
    constructor(address _forwarder, address _workflowOwner) {
        if (_forwarder == address(0)) revert InvalidAddress();
        if (_workflowOwner == address(0)) revert InvalidAddress();
        forwarder = _forwarder;
        workflowOwner = _workflowOwner;
        vaultDeployer = new VaultDeployer(address(this));
    }

    // Called by the forwarder when a report is received from the workflow. The report contains the action to take (lock or settle commission), the investor, the strategist, the token, and the amount
    function onReport(bytes calldata metadata, bytes calldata report) external nonReentrant {
        if (msg.sender != forwarder) revert OnlyForwarder();
        if (address(bytes20(metadata[42:62])) != workflowOwner) revert InvalidWorkflowOwner();

        (uint256 chainId, Action action, address investor, address strategist, address token, uint256 amount) =
            abi.decode(report, (uint256, Action, address, address, address, uint256));

        // Report signatures don't name a chain, so the payload has to
        if (chainId != block.chainid) revert InvalidChain();
        if (amount == 0) revert ZeroAmount();

        address vault = vaultDeployer.vaultOf(investor);
        if (vault == address(0)) revert VaultNotFound();

        if (action == Action.LockCommission) {
            Vault(payable(vault)).lockCommission(token, amount);
            emit CommissionLocked(vault, token, amount);
        } else {
            if (strategist == address(0)) revert InvalidAddress();
            Vault(payable(vault)).requestTransfer(strategist, token, amount);
            emit CommissionSettled(vault, strategist, token, amount);
        }
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
