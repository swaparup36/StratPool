import type { ReactNode } from "react";
import { Newsletter } from "@/components/newsletter";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Newsletter />
    </>
  );
}
