"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icon";

export function Sidebar({
  label,
  links,
}: {
  label: string;
  links: { href: string; label: string; icon: IconName; activePrefix?: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-none gap-1 border-b bg-surface p-3 text-sm max-md:overflow-x-auto md:w-60 md:flex-col md:border-r md:border-b-0"
      aria-label={label}
    >
      {links.map(({ href, label, icon, activePrefix }) => {
        const active = pathname === href || (activePrefix && pathname.startsWith(activePrefix));
        return (
          <Link
            key={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 whitespace-nowrap transition-colors ${
              active ? "bg-surface-3" : "text-muted hover:bg-surface-2"
            }`}
            href={href}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={icon} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
