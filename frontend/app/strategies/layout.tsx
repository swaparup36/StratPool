import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export default function StrategiesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100svh-65px)] max-md:flex-col">
      <Sidebar
        label="Strategies"
        links={[
          { href: "/strategies/create", label: "Create strategy", icon: "plus" },
          { href: "/strategies/my", label: "My strategies", icon: "layers", activePrefix: "/strategies/edit" },
        ]}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
