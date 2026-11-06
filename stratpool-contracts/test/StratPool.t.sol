// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, Vm} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC165Checker} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import {CommissionManager, IReceiver} from "../src/CommissionManager.sol";
import {Vault} from "../src/Vault.sol";
import {VaultDeployer} from "../src/VaultDeployer.sol";

contract TestToken is ERC20("Test", "TST") {
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Holds ERC20 allowances and enforces the router's allowance and expiry, like the real Permit2.
contract MockPermit2 {
    mapping(address owner => mapping(address token => mapping(address spender => uint256))) public allowance;
    mapping(address owner => mapping(address token => mapping(address spender => uint48))) public expiry;

    function approve(address token, address spender, uint160 amount, uint48 expiration) external {
        allowance[msg.sender][token][spender] = amount;
        expiry[msg.sender][token][spender] = expiration;
    }

    function transferFrom(address from, address to, uint160 amount, address token) external {
        require(block.timestamp <= expiry[from][token][msg.sender], "expired");
        allowance[from][token][msg.sender] -= amount;
        ERC20(token).transferFrom(from, to, amount);
    }
}

contract MockRouter {
    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    receive() external payable {}

    function swap(address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut) external payable {
        if (tokenIn != address(0)) MockPermit2(PERMIT2).transferFrom(msg.sender, address(this), uint160(amountIn), tokenIn);
        if (tokenOut == address(0)) payable(msg.sender).transfer(amountOut);
        else TestToken(tokenOut).mint(msg.sender, amountOut);
    }

    function fail() external pure {
        revert("no liquidity");
    }
}

// A strategist that can't receive ETH.
contract RejectsETH {
    receive() external payable {
        revert("no");
    }
}

contract StratPoolTest is Test {
    address investor = makeAddr("investor");
    address forwarder = makeAddr("forwarder");
    address workflowOwner = makeAddr("workflowOwner");
    address strategist = makeAddr("strategist");
    bytes32 assignmentId = keccak256("assignment");

    VaultDeployer deployer;
    CommissionManager manager;
    Vault vault;
    TestToken token;
    address tokenAddr;
    MockRouter router;
    TestToken usdc;

    function setUp() public {
        router = new MockRouter();
        vm.etch(0x000000000022D473030F116dDEE9F6B43aC78BA3, address(new MockPermit2()).code);
        usdc = new TestToken();
        vm.deal(address(router), 100 ether);

        manager = new CommissionManager(forwarder, workflowOwner, address(router));
        deployer = manager.vaultDeployer();

        vm.prank(investor);
        vault = Vault(payable(deployer.createVault()));

        token = new TestToken();
        tokenAddr = address(token);
        token.mint(address(vault), 100 ether);
        vm.deal(address(vault), 10 ether);
    }

    // same layout the Chainlink forwarder passes to onReport.
    function _metadata(address owner) internal pure returns (bytes memory) {
        return abi.encodePacked(bytes32("workflowId"), bytes10("name"), owner, bytes2("id"));
    }

    function _report(CommissionManager.Action action, address to, address asset, uint256 amount)
        internal
        view
        returns (bytes memory)
    {
        return abi.encode(block.chainid, action, investor, to, asset, amount);
    }

    function _deliver(bytes memory report) internal {
        vm.prank(forwarder);
        manager.onReport(_metadata(workflowOwner), report);
    }

    function _lock(address asset, uint256 amount) internal {
        _deliver(_report(CommissionManager.Action.LockCommission, address(0), asset, amount));
    }

    function _settle(address asset, uint256 amount) internal {
        _deliver(_report(CommissionManager.Action.SettleCommission, strategist, asset, amount));
    }

    // deployment and vault creation 
    function test_Deploy_WiresEverythingInOneStep() public view {
        assertEq(address(manager.vaultDeployer()), address(deployer));
        assertEq(deployer.commissionManagerAddress(), address(manager));
        assertEq(vault.commissionManagerAddress(), address(manager));
        assertEq(vault.investor(), investor);
        assertEq(deployer.vaultOf(investor), address(vault));
    }

    function test_CreateVault_RevertsOnSecondVault() public {
        vm.prank(investor);
        vm.expectRevert(VaultDeployer.VaultAlreadyExists.selector);
        deployer.createVault();
    }

    // only the vault owner can withdraw 
    function test_Withdraw_OwnerGetsTokensAndETH() public {
        vm.startPrank(investor);
        vault.withdraw(tokenAddr, 40 ether);
        vault.withdrawETH(4 ether);
        vm.stopPrank();

        assertEq(token.balanceOf(investor), 40 ether);
        assertEq(investor.balance, 4 ether);
    }

    function testFuzz_Withdraw_RevertsForNonOwner(address caller) public {
        vm.assume(caller != investor);

        vm.prank(caller);
        vm.expectRevert(Vault.OnlyInvestor.selector);
        vault.withdraw(tokenAddr, 1);

        vm.prank(caller);
        vm.expectRevert(Vault.OnlyInvestor.selector);
        vault.withdrawETH(1);
    }

    function test_Withdraw_RevertsForForwarderAndManager() public {
        vm.prank(forwarder);
        vm.expectRevert(Vault.OnlyInvestor.selector);
        vault.withdraw(tokenAddr, 1);

        vm.prank(address(manager));
        vm.expectRevert(Vault.OnlyInvestor.selector);
        vault.withdrawETH(1);
    }

    // locked commission
    function test_Lock_BlocksWithdrawingLockedTokens() public {
        _lock(tokenAddr, 30 ether);

        vm.startPrank(investor);
        vm.expectRevert(Vault.InsufficientUnlockedBalance.selector);
        vault.withdraw(tokenAddr, 70 ether + 1);

        vault.withdraw(tokenAddr, 70 ether);
        vm.stopPrank();

        assertEq(token.balanceOf(address(vault)), 30 ether);
        assertEq(vault.unlockedBalance(tokenAddr), 0);
    }

    function test_Lock_BlocksWithdrawingLockedETH() public {
        _lock(address(0), 3 ether);

        vm.startPrank(investor);
        vm.expectRevert(Vault.InsufficientUnlockedBalance.selector);
        vault.withdrawETH(7 ether + 1);

        vault.withdrawETH(7 ether);
        vm.stopPrank();

        assertEq(address(vault).balance, 3 ether);
    }

    function test_Lock_RevertsWhenAboveUnlockedBalance() public {
        _lock(tokenAddr, 60 ether);

        vm.prank(forwarder);
        vm.expectRevert(Vault.InsufficientUnlockedBalance.selector);
        manager.onReport(
            _metadata(workflowOwner),
            _report(CommissionManager.Action.LockCommission, address(0), tokenAddr, 40 ether + 1)
        );
    }

    function testFuzz_Settle_LeavesLockedMinusSettled(uint256 locked, uint256 settled) public {
        locked = bound(locked, 1, 100 ether);
        settled = bound(settled, 1, locked);

        _lock(tokenAddr, locked);
        _settle(tokenAddr, settled);

        assertEq(vault.lockedCommission(tokenAddr), locked - settled);
        assertEq(token.balanceOf(strategist), settled);
        assertEq(vault.unlockedBalance(tokenAddr), 100 ether - locked);
    }

    function test_Settle_PaysLockedETH() public {
        _lock(address(0), 1 ether);

        vm.expectEmit(address(manager));
        emit CommissionManager.CommissionSettled(address(vault), strategist, address(0), 1 ether);
        _settle(address(0), 1 ether);

        assertEq(strategist.balance, 1 ether);
        assertEq(vault.lockedCommission(address(0)), 0);
    }

    function test_Settle_RevertsAboveLockedAmount() public {
        _lock(tokenAddr, 5 ether);

        vm.prank(forwarder);
        vm.expectRevert(Vault.InsufficientLockedCommission.selector);
        manager.onReport(
            _metadata(workflowOwner),
            _report(CommissionManager.Action.SettleCommission, strategist, tokenAddr, 5 ether + 1)
        );
    }

    function test_Settle_StillPaysAfterInvestorWithdrawsEverythingUnlocked() public {
        _lock(tokenAddr, 5 ether);

        vm.prank(investor);
        vault.withdraw(tokenAddr, 95 ether);

        _settle(tokenAddr, 5 ether);

        assertEq(token.balanceOf(strategist), 5 ether);
        assertEq(token.balanceOf(address(vault)), 0);
    }

    function test_ETHProfitCanArriveAndBeLocked() public {
        address trader = makeAddr("trader");
        vm.deal(trader, 2 ether);

        vm.prank(trader);
        (bool success,) = address(vault).call{value: 2 ether}("");
        assertTrue(success);

        _lock(address(0), 12 ether);
        assertEq(vault.lockedCommission(address(0)), 12 ether);
    }

    // only the manager can lock or move commission

    function testFuzz_VaultCommissionFunctions_RevertForNonManager(address caller) public {
        vm.assume(caller != address(manager));

        vm.prank(caller);
        vm.expectRevert(Vault.OnlyCommissionManager.selector);
        vault.requestTransfer(caller, tokenAddr, 1);

        vm.prank(caller);
        vm.expectRevert(Vault.OnlyCommissionManager.selector);
        vault.lockCommission(tokenAddr, 1);
    }

    // CRE report validation

    function testFuzz_OnReport_RevertsForNonForwarder(address caller) public {
        vm.assume(caller != forwarder);
        bytes memory report = _report(CommissionManager.Action.SettleCommission, caller, tokenAddr, 1);

        vm.prank(caller);
        vm.expectRevert(CommissionManager.OnlyForwarder.selector);
        manager.onReport(_metadata(workflowOwner), report);
    }

    function testFuzz_OnReport_RevertsForOtherWorkflowOwner(address otherOwner) public {
        vm.assume(otherOwner != workflowOwner);
        _lock(tokenAddr, 1 ether);
        bytes memory report = _report(CommissionManager.Action.SettleCommission, otherOwner, tokenAddr, 1 ether);

        vm.prank(forwarder);
        vm.expectRevert(CommissionManager.InvalidWorkflowOwner.selector);
        manager.onReport(_metadata(otherOwner), report);
    }

    function test_OnReport_RevertsForShortMetadata() public {
        bytes memory report = _report(CommissionManager.Action.LockCommission, address(0), tokenAddr, 1);

        vm.prank(forwarder);
        vm.expectRevert();
        manager.onReport(hex"00", report);
    }

    function test_OnReport_RevertsForOtherChain() public {
        bytes memory report =
            abi.encode(block.chainid + 1, CommissionManager.Action.LockCommission, investor, address(0), tokenAddr, 1);

        vm.prank(forwarder);
        vm.expectRevert(CommissionManager.InvalidChain.selector);
        manager.onReport(_metadata(workflowOwner), report);
    }

    function test_OnReport_RevertsForUnknownAction() public {
        bytes memory report = abi.encode(block.chainid, uint8(3), investor, strategist, tokenAddr, 1);

        vm.prank(forwarder);
        vm.expectRevert();
        manager.onReport(_metadata(workflowOwner), report);
    }

    function test_OnReport_RevertsForInvestorWithoutVault() public {
        bytes memory report = abi.encode(
            block.chainid, CommissionManager.Action.LockCommission, makeAddr("noVault"), address(0), tokenAddr, 1
        );

        vm.prank(forwarder);
        vm.expectRevert(CommissionManager.VaultNotFound.selector);
        manager.onReport(_metadata(workflowOwner), report);
    }

    function test_OnReport_RevertsOnZeroStrategistOrAmount() public {
        _lock(tokenAddr, 1 ether);
        bytes memory metadata = _metadata(workflowOwner);
        bytes memory zeroStrategist = _report(CommissionManager.Action.SettleCommission, address(0), tokenAddr, 1);
        bytes memory zeroAmount = _report(CommissionManager.Action.SettleCommission, strategist, tokenAddr, 0);

        vm.startPrank(forwarder);

        vm.expectRevert(CommissionManager.InvalidAddress.selector);
        manager.onReport(metadata, zeroStrategist);

        vm.expectRevert(CommissionManager.ZeroAmount.selector);
        manager.onReport(metadata, zeroAmount);

        vm.stopPrank();
    }

    // swaps

    function _swapReport(address tokenIn, uint256 amountIn, address tokenOut, uint256 minOut, bytes memory routerData)
        internal
        view
        returns (bytes memory)
    {
        return _swapReportFor(strategist, tokenIn, amountIn, tokenOut, minOut, routerData);
    }

    function _swapReportFor(
        address to,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 minOut,
        bytes memory routerData
    ) internal view returns (bytes memory) {
        return abi.encode(
            block.chainid, CommissionManager.Action.Swap, investor, to, assignmentId, tokenIn, amountIn, tokenOut, minOut, routerData
        );
    }

    function _swapData(address tokenIn, uint256 spend, address tokenOut, uint256 out) internal pure returns (bytes memory) {
        return abi.encodeCall(MockRouter.swap, (tokenIn, spend, tokenOut, out));
    }

    function test_Swap_TradesTokensThroughRouterAndClearsApproval() public {
        _deliver(_swapReport(tokenAddr, 10 ether, address(usdc), 25, _swapData(tokenAddr, 10 ether, address(usdc), 30)));

        assertEq(token.balanceOf(address(vault)), 90 ether);
        assertEq(usdc.balanceOf(address(vault)), 30);
        assertEq(token.allowance(address(vault), vault.PERMIT2()), 0);
    }

    function test_Swap_TradesNativeETHBothWays() public {
        _deliver(_swapReport(address(0), 1 ether, address(usdc), 30, _swapData(address(0), 0, address(usdc), 30)));
        assertEq(address(vault).balance, 9 ether);
        assertEq(usdc.balanceOf(address(vault)), 30);

        // Bought 30 for 1 ETH and sold them for 2 ETH: 10% of the 1 ETH profit goes to the strategist.
        _deliver(_swapReport(address(usdc), 30, address(0), 2 ether, _swapData(address(usdc), 30, address(0), 2 ether)));
        assertEq(address(vault).balance, 10.9 ether);
        assertEq(strategist.balance, 0.1 ether);
    }

    function test_Swap_RevertsBelowMinimumOutput() public {
        bytes memory report = _swapReport(tokenAddr, 1 ether, address(usdc), 31, _swapData(tokenAddr, 1 ether, address(usdc), 30));

        vm.prank(forwarder);
        vm.expectRevert(Vault.InsufficientOutput.selector);
        manager.onReport(_metadata(workflowOwner), report);
    }

    function test_Swap_CannotSpendLockedCommission() public {
        _lock(tokenAddr, 60 ether);
        bytes memory report =
            _swapReport(tokenAddr, 40 ether + 1, address(usdc), 0, _swapData(tokenAddr, 40 ether + 1, address(usdc), 0));

        vm.prank(forwarder);
        vm.expectRevert(Vault.InsufficientUnlockedBalance.selector);
        manager.onReport(_metadata(workflowOwner), report);
    }

    function test_Swap_RouterCannotPullMoreThanAmountIn() public {
        bytes memory report = _swapReport(tokenAddr, 1 ether, address(usdc), 0, _swapData(tokenAddr, 2 ether, address(usdc), 1));

        vm.prank(forwarder);
        vm.expectRevert(Vault.SwapFailed.selector);
        manager.onReport(_metadata(workflowOwner), report);
    }

    function test_Swap_RevertsWhenRouterFails() public {
        bytes memory report = _swapReport(tokenAddr, 1 ether, address(usdc), 0, abi.encodeCall(MockRouter.fail, ()));

        vm.prank(forwarder);
        vm.expectRevert(Vault.SwapFailed.selector);
        manager.onReport(_metadata(workflowOwner), report);
    }

    function test_Swap_RevertsForOtherChainAndWorkflowOwner() public {
        bytes memory wrongChain = abi.encode(
            block.chainid + 1, CommissionManager.Action.Swap, investor, strategist, assignmentId, tokenAddr, 1, address(usdc), 0, bytes("")
        );
        bytes memory valid = _swapReport(tokenAddr, 1, address(usdc), 0, _swapData(tokenAddr, 1, address(usdc), 0));

        vm.startPrank(forwarder);
        vm.expectRevert(CommissionManager.InvalidChain.selector);
        manager.onReport(_metadata(workflowOwner), wrongChain);

        vm.expectRevert(CommissionManager.InvalidWorkflowOwner.selector);
        manager.onReport(_metadata(investor), valid);
        vm.stopPrank();
    }

    // profit and commission. token is the quote the vault starts in, usdc stands in for the asset it trades.

    function _trade(address tokenIn, uint256 spend, address tokenOut, uint256 out) internal {
        _deliver(_swapReport(tokenIn, spend, tokenOut, 0, _swapData(tokenIn, spend, tokenOut, out)));
    }

    function test_Commission_PaysTenPercentOfProfit() public {
        _trade(tokenAddr, 10 ether, address(usdc), 5);
        assertEq(token.balanceOf(strategist), 0, "opening a position pays nothing");

        _trade(address(usdc), 5, tokenAddr, 12 ether);

        assertEq(token.balanceOf(strategist), 0.2 ether);
        assertEq(token.balanceOf(address(vault)), 100 ether - 10 ether + 12 ether - 0.2 ether);
        assertEq(vault.lockedCommission(tokenAddr), 0);
    }

    function test_Commission_PaysNothingOnLossOrBreakEven() public {
        _trade(tokenAddr, 10 ether, address(usdc), 5);
        _trade(address(usdc), 5, tokenAddr, 8 ether);
        assertEq(token.balanceOf(strategist), 0, "loss");
        assertEq(token.balanceOf(address(vault)), 98 ether);

        _trade(tokenAddr, 10 ether, address(usdc), 5);
        _trade(address(usdc), 5, tokenAddr, 10 ether);
        assertEq(token.balanceOf(strategist), 0, "break-even");

        (uint256 held, uint256 cost) = manager.positions(address(vault), assignmentId, address(usdc), tokenAddr);
        assertEq(held, 0);
        assertEq(cost, 0);
    }

    function test_Commission_LossIsNotCarriedIntoNextProfit() public {
        _trade(tokenAddr, 10 ether, address(usdc), 5);
        _trade(address(usdc), 5, tokenAddr, 8 ether);

        _trade(tokenAddr, 10 ether, address(usdc), 5);
        _trade(address(usdc), 5, tokenAddr, 11 ether);

        assertEq(token.balanceOf(strategist), 0.1 ether);
    }

    function test_Commission_ChargesPartialSalesAgainstAverageCost() public {
        _trade(tokenAddr, 10 ether, address(usdc), 10);
        _trade(tokenAddr, 30 ether, address(usdc), 10);

        // 20 held for 40: selling 5 costs 10, sold for 20.
        _trade(address(usdc), 5, tokenAddr, 20 ether);
        assertEq(token.balanceOf(strategist), 1 ether);

        (uint256 held, uint256 cost) = manager.positions(address(vault), assignmentId, address(usdc), tokenAddr);
        assertEq(held, 15);
        assertEq(cost, 30 ether);
    }

    function test_Commission_OnlyTheBoughtPartOfASaleCounts() public {
        usdc.mint(address(vault), 90);
        _trade(tokenAddr, 10 ether, address(usdc), 10);

        // Sold 100 for 200 ether. The 10 bought for 10 ether fetched 20 ether, a 10 ether profit.
        // The other 90 were the investor's own, so they open a position instead of earning commission.
        _trade(address(usdc), 100, tokenAddr, 200 ether);
        assertEq(token.balanceOf(strategist), 1 ether);

        (uint256 held, uint256 cost) = manager.positions(address(vault), assignmentId, tokenAddr, address(usdc));
        assertEq(held, 180 ether);
        assertEq(cost, 90);
    }

    function test_Commission_CountsBuyingBackMoreOfTheStartingAsset() public {
        usdc.mint(address(vault), 10 ether);

        // Sold 10 of its own usdc, then bought 15 back with the proceeds: a 5 usdc profit.
        _trade(address(usdc), 10 ether, tokenAddr, 20 ether);
        _trade(tokenAddr, 20 ether, address(usdc), 15 ether);

        assertEq(usdc.balanceOf(strategist), 0.5 ether);
    }

    function test_Commission_SeparatesAssignmentsOfTheSameStrategist() public {
        bytes32 first = assignmentId;
        _trade(tokenAddr, 10 ether, address(usdc), 5);

        // Another requirement's sale doesn't close the first one's position, so it records no trade.
        assignmentId = keccak256("other assignment");
        vm.recordLogs();
        _trade(address(usdc), 5, tokenAddr, 20 ether);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint256 i; i < logs.length; i++) {
            assertTrue(logs[i].topics[0] != CommissionManager.TradeClosed.selector);
        }
        assertEq(token.balanceOf(strategist), 0);

        (uint256 held, uint256 cost) = manager.positions(address(vault), first, address(usdc), tokenAddr);
        assertEq(held, 5);
        assertEq(cost, 10 ether);
    }

    function test_TradeClosed_ReportsProfitAndCommissionForTheAssignment() public {
        _trade(tokenAddr, 10 ether, address(usdc), 5);

        vm.expectEmit(address(manager));
        emit CommissionManager.TradeClosed(address(vault), assignmentId, tokenAddr, 10 ether, 12 ether, 0.2 ether);
        _trade(address(usdc), 5, tokenAddr, 12 ether);
    }

    function test_TradeClosed_ReportsLossWithNoCommission() public {
        _trade(tokenAddr, 10 ether, address(usdc), 5);

        vm.expectEmit(address(manager));
        emit CommissionManager.TradeClosed(address(vault), assignmentId, tokenAddr, 10 ether, 8 ether, 0);
        _trade(address(usdc), 5, tokenAddr, 8 ether);
    }

    function test_Swap_RevertsWithoutAssignment() public {
        assignmentId = bytes32(0);
        bytes memory report = _swapReport(tokenAddr, 1, address(usdc), 0, _swapData(tokenAddr, 1, address(usdc), 0));

        vm.prank(forwarder);
        vm.expectRevert(CommissionManager.InvalidAssignment.selector);
        manager.onReport(_metadata(workflowOwner), report);
    }

    function test_Commission_StaysLockedWhenStrategistCannotReceive() public {
        address rejecting = address(new RejectsETH());
        vm.deal(address(router), 100 ether);

        bytes memory open = _swapData(address(0), 0, address(usdc), 30);
        _deliver(_swapReportFor(rejecting, address(0), 1 ether, address(usdc), 0, open));

        bytes memory close = _swapData(address(usdc), 30, address(0), 2 ether);
        _deliver(_swapReportFor(rejecting, address(usdc), 30, address(0), 0, close));

        assertEq(usdc.balanceOf(address(vault)), 0, "the trade still happened");
        assertEq(address(vault).balance, 11 ether);
        assertEq(vault.lockedCommission(address(0)), 0.1 ether);

        vm.prank(investor);
        vm.expectRevert(Vault.InsufficientUnlockedBalance.selector);
        vault.withdrawETH(11 ether);
    }

    function test_Swap_RevertsWithoutStrategist() public {
        bytes memory report =
            _swapReportFor(address(0), tokenAddr, 1, address(usdc), 0, _swapData(tokenAddr, 1, address(usdc), 0));

        vm.prank(forwarder);
        vm.expectRevert(CommissionManager.InvalidAddress.selector);
        manager.onReport(_metadata(workflowOwner), report);
    }

    function testFuzz_Commission_NeverExceedsTenPercentOfProfit(uint96 cost, uint96 proceeds) public {
        cost = uint96(bound(cost, 1, 100 ether));
        _trade(tokenAddr, cost, address(usdc), 1000);
        _trade(address(usdc), 1000, tokenAddr, proceeds);

        uint256 profit = proceeds > cost ? uint256(proceeds) - cost : 0;
        assertEq(token.balanceOf(strategist), profit / 10);
        assertEq(token.balanceOf(address(vault)), 100 ether - uint256(cost) + proceeds - profit / 10);
    }

    function testFuzz_ExecuteSwap_RevertsForNonManager(address caller) public {
        vm.assume(caller != address(manager));

        vm.prank(caller);
        vm.expectRevert(Vault.OnlyCommissionManager.selector);
        vault.executeSwap(tokenAddr, 1, address(usdc), 0, "");
    }

    // The forwarder runs this exact check and permanently rejects the report if it fails
    function test_SupportsForwarderInterfaceCheck() public view {
        assertTrue(ERC165Checker.supportsInterface(address(manager), type(IReceiver).interfaceId));
    }
}
