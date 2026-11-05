import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

const geist = localFont({
  src: "./fonts/Geist-Variable.woff2",
  weight: "100 900",
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: { default: "Acme — Team communication for fast-moving teams", template: "%s — Acme" },
  description: "Acme brings messaging, tasks and files together so your team can ship faster.",
};

// Runs before first paint so a saved theme never flashes the wrong colors.
const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-svh overflow-x-clip bg-surface text-fg antialiased">
        <a
          className="absolute -top-12 left-4 z-200 rounded-full bg-accent px-4 py-2 text-on-accent focus:top-3"
          href="#main"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
