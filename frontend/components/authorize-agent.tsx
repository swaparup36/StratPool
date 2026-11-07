"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { createSiweMessage } from "viem/siwe";
import { useAccount, useSignMessage } from "wagmi";
import { useAuth } from "@/components/auth-provider";
import { AuthCard, Field, NameFields } from "@/components/forms";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { send } from "@/lib/strategies";

function LogIn({ clientName, params }: { clientName: string; params: AuthorizeAgentProps["params"] }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { start, error } = useWalletAuth(mode, () => {});
  const signup = mode === "signup";

  return (
    <AuthCard
      title={signup ? "Create your account" : "Log in"}
      submit="Continue"
      onSubmit={start}
      error={error}
      intro={
        <>
          to connect {clientName} to StratPool.{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); setMode(signup ? "login" : "signup"); }}>
            {signup ? "Log in instead" : "Create an account"}
          </a>
        </>
      }
    >
      {/* A submit before hydration is a native GET, which would replace the query string and lose the agent's request */}
      {Object.entries(params).map(([name, value]) => typeof value === "string" && name !== "email" && <input key={name} type="hidden" name={name} value={value} />)}
      {signup && <NameFields />}
      <Field name="email" label="Email" type="email" autoComplete="email" />
    </AuthCard>
  );
}

function Approve({ clientName, redirectHost, statement, denyUrl, params }: AuthorizeAgentProps) {
  const { address, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setError(null);
    if (!address) {
      openConnectModal?.();
      return;
    }
    if (!chain) {
      setError("Switch your wallet to Ethereum, Base or Sepolia, then try again");
      return;
    }
    try {
      const nonce = await (await fetch("/api/auth/nonce")).text();
      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement,
        uri: window.location.origin,
        version: "1",
        chainId: chain.id,
        nonce,
      });
      const signature = await signMessageAsync({ message });
      const { data } = await send("/api/oauth/authorize", "POST", "Failed to connect agent", { message, signature, params });
      window.location.assign(data.redirectTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect agent");
    }
  }

  return (
    <AuthCard title={`Connect ${clientName}`} submit={address ? "Approve with wallet" : "Connect wallet"} onSubmit={approve} error={error} intro={<>Sends you back to {redirectHost}</>}>
      <div className="grid gap-3 border-b p-6 text-sm">
        <p>This agent will be able to post investment requirements as you for 30 days, until you disconnect it from your Invest page.</p>
        <p className="text-subtle">A matched requirement can start automated trading with your deposited funds. It can&apos;t withdraw your funds or see your strategies.</p>
        {address && <p className="break-all text-subtle">Wallet: {address}</p>}
        <a className="text-subtle underline" href={denyUrl}>
          Deny
        </a>
      </div>
    </AuthCard>
  );
}

type AuthorizeAgentProps = {
  clientName: string;
  redirectHost: string;
  statement: string;
  denyUrl: string;
  params: Record<string, string | string[] | undefined>;
};

export function AuthorizeAgent(props: AuthorizeAgentProps) {
  const { status } = useAuth();
  return status === "authenticated" ? <Approve {...props} /> : <LogIn clientName={props.clientName} params={props.params} />;
}
