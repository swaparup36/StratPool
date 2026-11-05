import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, Tag } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="grid min-h-[calc(100svh-230px)] place-items-center px-6 py-16 text-center">
      <div>
        <Tag>404</Tag>
        <h1 className="text-[clamp(32px,6vw,56px)] tracking-[-.03em]">Page not found</h1>
        <p className="mt-3 mb-6 text-lg text-subtle">The page you are looking for has moved or never existed.</p>
        <Link className={buttonClass()} href="/">
          Back to home
        </Link>
      </div>
    </section>
  );
}
