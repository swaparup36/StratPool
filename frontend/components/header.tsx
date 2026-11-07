"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { ChainSelector } from "./chain-selector";
import { Icon } from "./icon";
import { ThemeSwitch } from "./theme-switch";
import { DOC_LINKS } from "@/content/docs";
import { buttonClass, Logo } from "./ui";

const navLink = "flex items-center rounded-full p-2.5 whitespace-nowrap transition-colors hover:bg-surface-2 xl:px-3.5 xl:py-2";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { status, logout } = useAuth();

  // Client-side navigation keeps this component mounted, so close the menu explicitly.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-100 border-b bg-surface">
      <div
        className={`mx-auto flex min-h-[72px] w-full max-w-[96rem] items-center justify-between gap-6 px-6 ${
          menuOpen ? "max-xl:flex-wrap max-xl:gap-y-3 max-xl:py-3.5" : ""
        }`}
      >
        <Logo />
        <button
          className="grid size-9 place-items-center rounded-lg text-xl xl:hidden"
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name="menu" />
        </button>
        <nav
          className={`${menuOpen ? "flex" : "hidden"} order-3 w-full flex-col gap-1 xl:order-none xl:flex xl:w-auto xl:flex-row xl:items-center xl:text-[15px]`}
          aria-label="Main"
        >
          {DOC_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              className={`${navLink} ${pathname === href ? "bg-surface-2" : ""}`}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              // Tapping the current page doesn't change the pathname, so close the mobile menu here too.
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div
          className={`${menuOpen ? "grid" : "hidden"} order-4 w-full grid-cols-2 gap-2 xl:order-none xl:flex xl:w-auto xl:items-center`}
        >
          <div className="col-span-2 flex justify-center">
            <ThemeSwitch />
          </div>
          {pathname.startsWith("/investors") && <ChainSelector />}
          {status === "authenticated" ? (
            <button className={`${buttonClass("secondary", "sm")} col-span-2`} type="button" onClick={logout}>
              Log Out
            </button>
          ) : (
            <>
              <Link className={buttonClass("secondary", "sm")} href="/sign-in">
                Log In
              </Link>
              <Link className={buttonClass("primary", "sm")} href="/sign-up">
                Get Started Today
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
