// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Vault} from "./Vault.sol";
import {VaultDeployer} from "./VaultDeployer.sol";

interface IReceiver is IERC165 {
    function onReport(bytes calldata metadata, bytes calldata report) external;
}

contract CommissionManager is IReceiver, ReentrancyGuard {
    enum Action {
        LockCommission,
        SettleCommission,
        Swap
    }

    // position of a strategist in a token, measured in the token and the amount spent to acquire it. The cost is used to determine profit or loss when the position is closed
    struct Position {
        uint256 held;
        uint256 cost;
    }

    // the strategist's share of a closed trade's profit
    uint256 public constant COMMISSION_BPS = 1000;

    mapping(address vault => mapping(address strategist => mapping(address held => mapping(address paidIn => Position))))
        public positions;

    VaultDeployer public immutable vaultDeployer;
    address public immutable forwarder;
    address public immutable workflowOwner;

    event CommissionLocked(address indexed vault, address indexed token, uint256 amount);
    event CommissionSettled(address indexed vault, address indexed strategist, address indexed token, uint256 amount);
    event SwapExecuted(address indexed vault, address indexed tokenIn, address indexed tokenOut, uint256 spent, uint256 received);
    event TradeClosed(address indexed vault, address indexed strategist, address indexed token, uint256 cost, uint256 proceeds);

    error OnlyForwarder();
    error InvalidWorkflowOwner();
    error InvalidChain();
    error InvalidAddress();
    error ZeroAmount();
    error VaultNotFound();

    // comission manager deploys the vault deployer contract
    constructor(address _forwarder, address _workflowOwner, address _swapRouter) {
        if (_forwarder == address(0)) revert InvalidAddress();
        if (_workflowOwner == address(0)) revert InvalidAddress();
        forwarder = _forwarder;
        workflowOwner = _workflowOwner;
        vaultDeployer = new VaultDeployer(address(this), _swapRouter);
    }

    // the forwarder calls this function with a report from a workflow
    function onReport(bytes calldata metadata, bytes calldata report) external nonReentrant {
        if (msg.sender != forwarder) revert OnlyForwarder();
        if (address(bytes20(metadata[42:62])) != workflowOwner) revert InvalidWorkflowOwner();

        (uint256 chainId, Action action) = abi.decode(report, (uint256, Action));

        // report signatures don't name a chain, so the payload has to
        if (chainId != block.chainid) revert InvalidChain();

        if (action == Action.Swap) return _swap(report);

        (,, address investor, address strategist, address token, uint256 amount) =
            abi.decode(report, (uint256, Action, address, address, address, uint256));

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

    function _swap(bytes calldata report) private {
        (
            ,
            ,
            address investor,
            address strategist,
            address tokenIn,
            uint256 amountIn,
            address tokenOut,
            uint256 minAmountOut,
            bytes memory routerData
        ) = abi.decode(report, (uint256, Action, address, address, address, uint256, address, uint256, bytes));

        if (strategist == address(0)) revert InvalidAddress();

        address vault = vaultDeployer.vaultOf(investor);
        if (vault == address(0)) revert VaultNotFound();

        (uint256 spent, uint256 received) =
            Vault(payable(vault)).executeSwap(tokenIn, amountIn, tokenOut, minAmountOut, routerData);
        emit SwapExecuted(vault, tokenIn, tokenOut, spent, received);

        _updatePositions(vault, strategist, tokenIn, tokenOut, spent, received);
    }

    // Each swap first closes the previous position to realize profit or loss in tokenOut.
    // Any remaining amount opens a new position. Since CRE workflows are stateless,
    // this accounting must happen onchain in the same transaction as the swap.
    function _updatePositions(address vault, address strategist, address tokenIn, address tokenOut, uint256 spent, uint256 received) private {
        Position storage open = positions[vault][strategist][tokenIn][tokenOut];
        uint256 closed = Math.min(spent, open.held);
        uint256 proceeds;

        if (closed > 0) {
            uint256 cost = Math.mulDiv(open.cost, closed, open.held);
            proceeds = Math.mulDiv(received, closed, spent);
            open.held -= closed;
            open.cost -= cost;
            emit TradeClosed(vault, strategist, tokenOut, cost, proceeds);

            // a loss pays nothing and isn't carried over to later trades.
            if (proceeds > cost) {
                _payCommission(vault, strategist, tokenOut, Math.mulDiv(proceeds - cost, COMMISSION_BPS, 10_000));
            }
        }

        if (spent > closed) {
            Position storage opened = positions[vault][strategist][tokenOut][tokenIn];
            opened.held += received - proceeds;
            opened.cost += spent - closed;
        }
    }

    function _payCommission(address vault, address strategist, address token, uint256 amount) private {
        if (amount == 0) return;

        Vault(payable(vault)).lockCommission(token, amount);
        emit CommissionLocked(vault, token, amount);

        // If the strategist can't receive the commission, don't revert the investor's trade. Keep the commission locked for later settlement
        try Vault(payable(vault)).requestTransfer(strategist, token, amount) {
            emit CommissionSettled(vault, strategist, token, amount);
        } catch {}
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
