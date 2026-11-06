"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { erc20Abi, formatUnits, isAddress, isAddressEqual, zeroAddress, type Address, type BaseError, type Hash } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { parseAmount } from "@/lib/amount";
import { vaultAbi } from "@/lib/contracts";
import { waitForTx } from "@/wagmi";
import { buttonClass } from "./ui";

type Action = "deposit" | "withdraw";

const inputClass = "h-10 w-full min-w-0 rounded-lg border bg-transparent px-3 text-sm placeholder:text-subtle";
const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

export function VaultPanel({ owner, vault, chainId }: { owner: Address; vault: Address; chainId: number }) {
  const client = usePublicClient({ chainId })!;
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();

  // ponytail: tokens are remembered per browser because the vault can't list what it holds; an indexer could discover them
  const storageKey = `stratpool:tokens:${chainId}:${vault.toLowerCase()}`;
  const [tokens, setTokens] = useState<Address[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved)) setTokens(saved.filter((t) => typeof t === "string" && isAddress(t)));
    } catch {}
  }, [storageKey]);

  function saveTokens(next: Address[]) {
    setTokens(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }

  const { data: assets, isError, refetch } = useQuery({
    queryKey: ["vault-assets", chainId, vault, owner, tokens],
    queryFn: async () => {
      const read = { address: vault, abi: vaultAbi } as const;
      const [ethInVault, ethLocked, ethUnlocked, ethWallet] = await Promise.all([
        client.readContract({ ...read, functionName: "ethBalance" }),
        client.readContract({ ...read, functionName: "lockedCommission", args: [zeroAddress] }),
        client.readContract({ ...read, functionName: "unlockedBalance", args: [zeroAddress] }),
        client.getBalance({ address: owner }),
      ]);
      const erc20s = await Promise.all(
        tokens.map(async (token) => {
          const erc20 = { address: token, abi: erc20Abi } as const;
          const [symbol, decimals, inVault, locked, unlocked, wallet] = await Promise.all([
            client.readContract({ ...erc20, functionName: "symbol" }),
            client.readContract({ ...erc20, functionName: "decimals" }),
            client.readContract({ ...erc20, functionName: "balanceOf", args: [vault] }),
            client.readContract({ ...read, functionName: "lockedCommission", args: [token] }),
            client.readContract({ ...read, functionName: "unlockedBalance", args: [token] }),
            client.readContract({ ...erc20, functionName: "balanceOf", args: [owner] }),
          ]);
          return { token, symbol, decimals, inVault, locked, unlocked, wallet };
        })
      );
      const { symbol, decimals } = client.chain.nativeCurrency;
      return [
        { token: zeroAddress as Address, symbol, decimals, inVault: ethInVault, locked: ethLocked, unlocked: ethUnlocked, wallet: ethWallet },
        ...erc20s,
      ];
    },
  });

  const [action, setAction] = useState<Action>("deposit");
  const [selected, setSelected] = useState<Address>(zeroAddress);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newToken, setNewToken] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [addingToken, setAddingToken] = useState(false);

  const asset = assets?.find(({ token }) => token === selected) ?? assets?.[0];
  const isNative = asset?.token === zeroAddress;
  const max = action === "deposit" ? asset?.wallet : asset?.unlocked;
  const busy = status !== null;

  async function addToken(e: FormEvent) {
    e.preventDefault();
    setTokenError(null);
    const token = newToken.trim();
    if (!isAddress(token)) {
      setTokenError("Enter a valid token address");
      return;
    }
    if (tokens.some((t) => isAddressEqual(t, token))) {
      setTokenError("This token is already listed");
      return;
    }
    setAddingToken(true);
    try {
      await Promise.all([
        client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }),
        client.readContract({ address: token, abi: erc20Abi, functionName: "decimals" }),
        client.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [vault] }),
      ]);
      saveTokens([...tokens, token]);
      setSelected(token);
      setNewToken("");
    } catch {
      setTokenError(`No ERC-20 token found at this address on ${client.chain.name}`);
    } finally {
      setAddingToken(false);
    }
  }

  function removeToken(token: Address) {
    saveTokens(tokens.filter((t) => t !== token));
    if (selected === token) setSelected(zeroAddress);
  }

  async function confirm(label: string, send: () => Promise<Hash>) {
    setStatus(label);
    await waitForTx(await send(), chainId);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!asset || max === undefined) return;
    if (!address) {
      openConnectModal?.();
      return;
    }
    // the vault only accepts calls from its investor
    if (!isAddressEqual(address, owner)) {
      setError(`Switch your wallet to ${owner}, the one that owns this vault`);
      return;
    }
    const overMax = action === "deposit" ? "That's more than your wallet holds" : "That's more than you can withdraw";
    const value = parseAmount(amount, asset.decimals, max, overMax);
    if (typeof value === "string") {
      setError(value);
      return;
    }

    const vaultCall = { address: vault, abi: vaultAbi, chainId } as const;
    try {
      if (action === "withdraw") {
        await confirm("Withdrawing…", () =>
          isNative
            ? writeContractAsync({ ...vaultCall, functionName: "withdrawETH", args: [value] })
            : writeContractAsync({ ...vaultCall, functionName: "withdraw", args: [asset.token, value] })
        );
      } else if (isNative) {
        await confirm("Depositing…", () => writeContractAsync({ ...vaultCall, functionName: "depositETH", value }));
      } else {
        const erc20Call = { address: asset.token, abi: erc20Abi, chainId } as const;
        const allowance = await client.readContract({ address: asset.token, abi: erc20Abi, functionName: "allowance", args: [owner, vault] });
        if (allowance < value) {
          // tokens like USDT reject changing one non-zero allowance to another
          if (allowance > 0n) await confirm("Resetting approval…", () => writeContractAsync({ ...erc20Call, functionName: "approve", args: [vault, 0n] }));
          await confirm("Approving…", () => writeContractAsync({ ...erc20Call, functionName: "approve", args: [vault, value] }));
        }
        await confirm("Depositing…", () => writeContractAsync({ ...vaultCall, functionName: "deposit", args: [asset.token, value] }));
      }
      setAmount("");
      setNotice(`${action === "deposit" ? "Deposited" : "Withdrew"} ${amount.trim()} ${asset.symbol}`);
    } catch (e) {
      setError((e as BaseError).shortMessage ?? "Transaction failed, please try again");
    } finally {
      setStatus(null);
      refetch();
    }
  }

  const explorer = client.chain.blockExplorers?.default.url;

  return (
    <section className="grid gap-6 p-6 md:p-10">
      <div className="grid gap-1">
        <h1 className="text-[24px] tracking-[-.02em]">Vault</h1>
        <p className="text-sm break-all text-subtle">
          {client.chain.name} ·{" "}
          {explorer ? (
            <a className="underline" href={`${explorer}/address/${vault}`} target="_blank" rel="noreferrer">
              {vault}
            </a>
          ) : (
            vault
          )}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-surface">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="border-b text-left text-subtle">
            <tr>
              <th className="p-4 font-normal">Asset</th>
              <th className="p-4 text-right font-normal">In vault</th>
              <th className="p-4 text-right font-normal">Locked commission</th>
              <th className="p-4 text-right font-normal">Withdrawable</th>
              <th className="p-4 text-right font-normal">In wallet</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {assets?.map(({ token, symbol, decimals, inVault, locked, unlocked, wallet }) => (
              <tr className="border-b last:border-b-0" key={token}>
                <td className="p-4">
                  {symbol}
                  {token !== zeroAddress && <span className="ml-2 text-xs text-subtle">{short(token)}</span>}
                </td>
                <td className="p-4 text-right">{formatUnits(inVault, decimals)}</td>
                <td className="p-4 text-right">{formatUnits(locked, decimals)}</td>
                <td className="p-4 text-right">{formatUnits(unlocked, decimals)}</td>
                <td className="p-4 text-right">{formatUnits(wallet, decimals)}</td>
                <td className="p-4 text-right">
                  {token !== zeroAddress && (
                    <button className="text-subtle underline" type="button" onClick={() => removeToken(token)}>
                      Hide
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!assets && (
              <tr>
                <td className="p-4 text-subtle" colSpan={6}>
                  {isError ? (
                    <>
                      Couldn&apos;t load balances.{" "}
                      <button className="underline" type="button" onClick={() => refetch()}>
                        Try again
                      </button>
                    </>
                  ) : (
                    "Loading balances…"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <form className="grid gap-4 rounded-xl border bg-surface p-5" onSubmit={submit}>
          <div className="flex gap-1" role="group" aria-label="Action">
            {(["deposit", "withdraw"] as const).map((option) => (
              <button
                key={option}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                  action === option ? "bg-surface-3" : "text-muted hover:bg-surface-2"
                }`}
                type="button"
                aria-pressed={action === option}
                onClick={() => {
                  setAction(option);
                  setError(null);
                  setNotice(null);
                }}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="grid gap-1 text-sm">
            Asset
            <select className={inputClass} value={asset?.token ?? zeroAddress} onChange={(e) => setSelected(e.target.value as Address)}>
              {assets?.map(({ token, symbol }) => (
                <option key={token} value={token}>
                  {token === zeroAddress ? symbol : `${symbol} (${short(token)})`}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            Amount
            <div className="flex gap-2">
              <input
                className={inputClass}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {/* depositing a wallet's full ETH balance would leave nothing for gas */}
              {asset && max !== undefined && !(isNative && action === "deposit") && (
                <button
                  className={buttonClass("secondary")}
                  type="button"
                  onClick={() => setAmount(formatUnits(max, asset.decimals))}
                >
                  Max
                </button>
              )}
            </div>
          </label>

          {asset && max !== undefined && (
            <p className="text-sm text-subtle">
              {action === "deposit" ? "In wallet" : "Withdrawable"}: {formatUnits(max, asset.decimals)} {asset.symbol}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm break-words text-red-500">
              {error}
            </p>
          )}
          {notice && <p role="status" className="text-sm text-muted">{notice}</p>}

          <button className={`${buttonClass()} justify-self-start capitalize disabled:opacity-60`} type="submit" disabled={busy || !asset}>
            {status ?? (address ? action : "Connect wallet")}
          </button>
        </form>

        <form className="grid gap-3 rounded-xl border bg-surface p-5" onSubmit={addToken}>
          <div className="grid gap-1">
            <h2 className="text-sm">Add an ERC-20 token</h2>
            <p className="text-sm text-subtle">
              Paste a token&apos;s address on {client.chain.name} to deposit it or see its balance. Only add tokens you trust.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              className={inputClass}
              aria-label="Token address"
              autoComplete="off"
              spellCheck={false}
              placeholder="0x…"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
            />
            <button className={`${buttonClass("secondary")} disabled:opacity-60`} type="submit" disabled={addingToken}>
              {addingToken ? "Checking…" : "Add"}
            </button>
          </div>
          {tokenError && (
            <p role="alert" className="text-sm text-red-500">
              {tokenError}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
