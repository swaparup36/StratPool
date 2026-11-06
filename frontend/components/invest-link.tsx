"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";

export function InvestLink({ className }: { className: string }) {
  const { status } = useAuth();
  return (
    <Link className={className} href={status === "authenticated" ? "/investors" : "/sign-up"} prefetch={false}>
      Invest
    </Link>
  );
}
