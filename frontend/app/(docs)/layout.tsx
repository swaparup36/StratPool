import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { DOC_LINKS } from "@/content/docs";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100svh-73px)] max-md:flex-col">
      <Sidebar label="Docs" links={DOC_LINKS} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
