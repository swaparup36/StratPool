import type { ReactNode } from "react";
import { StrategySidebar } from "@/components/strategy-sidebar";

export default function StrategiesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100svh-65px)] max-md:flex-col">
      <StrategySidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
