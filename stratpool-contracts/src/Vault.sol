// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

interface IPermit2 {
    function approve(address token, address spender, uint160 amount, uint48 expiration) external;
}

contract Vault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // same address on every chain Uniswap supports
    address public constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    address public immutable investor;
    address public immutable commissionManagerAddress;
    address public immutable swapRouter;

    // locked commission owed per token, which the investor cannot withdraw
    mapping(address token => uint256 amount) public lockedCommission;

    event Deposited(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount);
    event ETHDeposited(address indexed investor, uint256 amount);
    event ETHWithdrawn(address indexed investor, uint256 amount);
    event Transfered(address indexed to, address indexed token, uint256 amount);
    event Swapped(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    error OnlyInvestor();
    error OnlyCommissionManager();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientUnlockedBalance();
    error InsufficientLockedCommission();
    error SwapFailed();
    error InsufficientOutput();
    error ExcessiveInput();

    modifier onlyInvestor() {
        if (msg.sender != investor) revert OnlyInvestor();
        _;
    }

    modifier onlyCommissionManager() {
        if (msg.sender != commissionManagerAddress) revert OnlyCommissionManager();
        _;
    }

    constructor(address _investor, address _commissionManagerAddress, address _swapRouter) {
        if (_investor == address(0)) revert ZeroAddress();
        if (_commissionManagerAddress == address(0)) revert ZeroAddress();
        if (_swapRouter == address(0)) revert ZeroAddress();
        investor = _investor;
        commissionManagerAddress = _commissionManagerAddress;
        swapRouter = _swapRouter;
    }

    // allows ETH trade profit to reach the vault; only the investor or a settlement can move it out
    receive() external payable {}

    function deposit(address token, uint256 amount) external onlyInvestor nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(token, amount);
    }

    function depositETH() external payable onlyInvestor nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        emit ETHDeposited(msg.sender, msg.value);
    }

    function withdraw(address token, uint256 amount) external onlyInvestor nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > unlockedBalance(token)) revert InsufficientUnlockedBalance();

        IERC20(token).safeTransfer(investor, amount);

        emit Withdrawn(token, amount);
    }

    function withdrawETH(uint256 amount) external onlyInvestor nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (amount > unlockedBalance(address(0))) revert InsufficientUnlockedBalance();

        (bool success,) = payable(investor).call{value: amount}("");
        require(success, "ETH transfer failed");

        emit ETHWithdrawn(investor, amount);
    }

    function balanceOf(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function ethBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function unlockedBalance(address token) public view returns (uint256) {
        uint256 balance = _balance(token);
        uint256 locked = lockedCommission[token];
        return balance > locked ? balance - locked : 0;
    }

    function _balance(address token) private view returns (uint256) {
        return token == address(0) ? address(this).balance : IERC20(token).balanceOf(address(this));
    }

    // executes swaps on the swap router
    function executeSwap(address tokenIn, uint256 amountIn, address tokenOut, uint256 minAmountOut, bytes calldata routerData) external onlyCommissionManager nonReentrant returns (uint256 spent, uint256 amountOut) {
        if (amountIn == 0) revert ZeroAmount();
        if (amountIn > unlockedBalance(tokenIn)) revert InsufficientUnlockedBalance();

        uint256 inBefore = _balance(tokenIn);
        uint256 outBefore = _balance(tokenOut);

        if (tokenIn != address(0)) {
            IERC20(tokenIn).forceApprove(PERMIT2, amountIn);
            IPermit2(PERMIT2).approve(tokenIn, swapRouter, SafeCast.toUint160(amountIn), uint48(block.timestamp));
        }

        (bool success,) = swapRouter.call{value: tokenIn == address(0) ? amountIn : 0}(routerData);
        if (!success) revert SwapFailed();

        if (tokenIn != address(0)) IERC20(tokenIn).forceApprove(PERMIT2, 0);

        spent = inBefore - _balance(tokenIn);
        if (spent > amountIn) revert ExcessiveInput();

        amountOut = _balance(tokenOut) - outBefore;
        if (amountOut < minAmountOut) revert InsufficientOutput();

        emit Swapped(tokenIn, tokenOut, spent, amountOut);
    }

    function lockCommission(address token, uint256 amount) external onlyCommissionManager nonReentrant {
        if (amount > unlockedBalance(token)) revert InsufficientUnlockedBalance();

        lockedCommission[token] += amount;
    }

    function requestTransfer(address to, address token, uint256 amount) external onlyCommissionManager nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount > lockedCommission[token]) revert InsufficientLockedCommission();

        lockedCommission[token] -= amount;

        if (token == address(0)) {
            (bool success,) = payable(to).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }

        emit Transfered(to, token, amount);
    }
}
