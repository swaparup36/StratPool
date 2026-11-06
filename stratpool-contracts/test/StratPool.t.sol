// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
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

contract StratPoolTest is Test {
    address investor = makeAddr("investor");
    address forwarder = makeAddr("forwarder");
    address workflowOwner = makeAddr("workflowOwner");
    address strategist = makeAddr("strategist");

    VaultDeployer deployer;
    CommissionManager manager;
    Vault vault;
    TestToken token;
    address tokenAddr;

    function setUp() public {
        manager = new CommissionManager(forwarder, workflowOwner);
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
        bytes memory report = abi.encode(block.chainid, uint8(2), investor, strategist, tokenAddr, 1);

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

    // The forwarder runs this exact check and permanently rejects the report if it fails
    function test_SupportsForwarderInterfaceCheck() public view {
        assertTrue(ERC165Checker.supportsInterface(address(manager), type(IReceiver).interfaceId));
    }
}
