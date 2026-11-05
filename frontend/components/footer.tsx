import Link from "next/link";
import { SocialLink } from "./icon";
import { ThemeSwitch } from "./theme-switch";
import { Logo } from "./ui";

export function Footer() {
  return (
    <footer className="pt-10 pb-8">
      <div className="page-container">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Logo />
          <nav className="flex flex-wrap gap-6 text-sm text-muted [&_a]:hover:text-fg" aria-label="Footer">
            <a href="#">Docs</a>
            <a href="#">Help</a>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
          <ThemeSwitch />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-sm text-subtle">
          <span>&copy; 2026 Acme Inc. All rights reserved.</span>
          <div className="flex gap-4 text-lg">
            <SocialLink name="GitHub" />
            <SocialLink name="X" />
            <SocialLink name="LinkedIn" />
          </div>
        </div>
      </div>
    </footer>
  );
}
