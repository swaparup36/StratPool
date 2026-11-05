"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { Icon } from "./icon";
import { ThemeSwitch } from "./theme-switch";
import { buttonClass, Logo } from "./ui";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#strategists", label: "Strategists" },
  { href: "/#investors", label: "Investors" },
  { href: "/#faq", label: "FAQ" },
];

const navLink = "flex items-center rounded-full p-2.5 transition-colors hover:bg-surface-2 md:px-2.5 md:py-1.5";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { status, logout } = useAuth();

  // Client-side navigation keeps this component mounted, so close the menu explicitly.
  useEffect(() => setMenuOpen(false), [pathname]);

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
          {links.map(({ href, label }) => (
            // Hash links don't change the pathname, so close the mobile menu on click too.
            <Link key={href} className={navLink} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
        <div
          className={`${menuOpen ? "grid" : "hidden"} order-4 w-full grid-cols-2 gap-2 md:order-none md:flex md:w-auto md:items-center`}
        >
          <div className="col-span-2 flex justify-center">
            <ThemeSwitch />
          </div>
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
