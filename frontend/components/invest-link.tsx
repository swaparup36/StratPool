"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useAuth } from "./auth-provider";

export function InvestLink({ className }: { className: string }) {
  const { status } = useAuth();
  const { chainId } = useAccount();
  const investors = chainId ? `/investors?chain=${chainId}` : "/investors";
  return (
    <Link className={className} href={status === "authenticated" ? investors : "/sign-up"} prefetch={false}>
      Invest
    </Link>
  );
}
