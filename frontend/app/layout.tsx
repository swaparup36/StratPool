import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { getSession } from '@/lib/session';

const geist = localFont({
  src: "./fonts/Geist-Variable.woff2",
  weight: "100 900",
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: { default: "StratPool — The DeFi strategy marketplace", template: "%s — StratPool" },
  description:
    "StratPool connects strategists who publish DeFi trading strategies with investors who provide the capital, then automates execution.",
};

// Runs before first paint so a saved theme never flashes the wrong colors.
const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-svh overflow-x-clip bg-surface text-fg antialiased">
        <AuthProvider initialStatus={session.userId ? 'authenticated' : 'unauthenticated'}>
          <a
            className="absolute -top-12 left-4 z-200 rounded-full bg-accent px-4 py-2 text-on-accent focus:top-3"
            href="#main"
          >
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
