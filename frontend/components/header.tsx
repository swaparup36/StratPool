"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./icon";
import { buttonClass, IconChip, Logo } from "./ui";

const links = [
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
];

const features: { href: string; icon: IconName; title: string; text: string }[] = [
  {
    href: "/features/realtime-insights",
    icon: "activity",
    title: "Realtime Insights",
    text: "See what your team is doing, live.",
  },
  {
    href: "/features/collaborative-task-boards",
    icon: "grid",
    title: "Collaborative Task Boards",
    text: "Plan and track work together.",
  },
];

const navLink =
  "flex items-center justify-between gap-1 rounded-full p-2.5 transition-colors hover:bg-surface-2 aria-[current=page]:text-accent md:justify-start md:px-2.5 md:py-1.5";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdown = useRef<HTMLDetailsElement>(null);

  // Client-side navigation keeps this component mounted, so close menus explicitly.
  useEffect(() => {
    setMenuOpen(false);
    if (dropdown.current) dropdown.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      const outside = e instanceof MouseEvent && !dropdown.current?.contains(e.target as Node);
      if (dropdown.current && (outside || (e as KeyboardEvent).key === "Escape")) dropdown.current.open = false;
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <header className="sticky top-0 z-100 border-b bg-surface">
      <div
        className={`page-container flex min-h-16 items-center justify-between ${
          menuOpen ? "max-md:flex-wrap max-md:gap-y-3 max-md:py-3.5" : ""
        }`}
      >
        <Logo />
        <button
          className="grid size-9 place-items-center rounded-lg text-xl md:hidden"
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name="menu" />
        </button>
        <nav
          className={`${menuOpen ? "flex" : "hidden"} order-3 w-full flex-col gap-1 md:order-none md:flex md:w-auto md:flex-row md:items-center md:text-sm`}
          aria-label="Main"
        >
          <details className="group relative" ref={dropdown}>
            <summary
              className={`${navLink} cursor-pointer list-none group-open:bg-surface-2 [&::-webkit-details-marker]:hidden`}
            >
              Features <Icon name="chevron" className="text-subtle transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-1 rounded-xl border bg-surface p-2 md:absolute md:top-[calc(100%+12px)] md:left-1/2 md:mt-0 md:w-[340px] md:-translate-x-1/2 md:shadow-[0_16px_40px_rgb(0_0_0/.18)]">
              {features.map(({ href, icon, title, text }) => (
                <Link className="flex gap-3 rounded-lg p-2.5 hover:bg-surface-2" href={href} key={href}>
                  <IconChip name={icon} />
                  <span>
                    {title}
                    <small className="block text-[13px] text-subtle">{text}</small>
                  </span>
                </Link>
              ))}
            </div>
          </details>
          {links.map(({ href, label }) => (
            <Link
              key={href}
              className={navLink}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div
          className={`${menuOpen ? "grid" : "hidden"} order-4 w-full grid-cols-2 gap-2 md:order-none md:flex md:w-auto md:items-center`}
        >
          <Link className={buttonClass("secondary", "sm")} href="/sign-in">
            Log In
          </Link>
          <Link className={buttonClass("primary", "sm")} href="/sign-up">
            Get Started Today
          </Link>
        </div>
      </div>
    </header>
  );
}
