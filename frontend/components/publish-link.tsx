"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";

export function PublishLink({ className }: { className: string }) {
  const { status } = useAuth();
  return (
    <Link className={className} href={status === "authenticated" ? "/strategies/create" : "/sign-up"}>
      Publish a Strategy
    </Link>
  );
}
