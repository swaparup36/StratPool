"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./icon";
import { Avatars, Cover } from "./ui";

type PostSummary = {
  slug: string;
  title: string;
  category: string;
  date: string;
  authors: number[];
  cover: number;
  excerpt: string;
};

export function BlogList({ posts }: { posts: PostSummary[] }) {
  const [query, setQuery] = useState("");
  const matches = posts.filter((p) => p.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <section className="page-container pt-14 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[clamp(32px,5vw,48px)] leading-[1.1] tracking-[-.03em]">Blog</h1>
          <label className="relative w-full max-w-[280px]">
            <Icon name="search" className="absolute top-[11px] left-3.5 text-subtle" />
            <span className="sr-only">Search posts</span>
            <input
              className="h-[38px] w-full rounded-full border bg-surface-2 pr-4 pl-9 text-sm placeholder:text-subtle"
              type="search"
              placeholder="Search posts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
      </section>
      <section className="page-container pb-24">
        <div className="grid gap-8 md:grid-cols-2">
          {posts.slice(0, 2).map((p) => (
            <Link className="group" href={`/blog/${p.slug}`} key={p.slug}>
              <Cover id={p.cover} className="aspect-video w-full rounded-xl border object-cover" />
              <div className="mt-4 flex items-center justify-between gap-3 text-sm text-subtle">
                <time>{p.date}</time>
                <Avatars ids={p.authors} />
              </div>
              <h2 className="mt-2 text-[24px] leading-[1.25] tracking-[-.02em] group-hover:text-accent">{p.title}</h2>
              <p className="mt-2 text-subtle">{p.excerpt}</p>
            </Link>
          ))}
        </div>
        <h2 className="mt-14 mb-4 text-[24px] tracking-[-.02em]">More posts</h2>
        <div>
          {matches.map((p) => (
            <Link
              className="group grid grid-cols-[1fr_auto] items-center gap-4 border-t py-4 md:grid-cols-[1fr_120px_130px_80px]"
              href={`/blog/${p.slug}`}
              key={p.slug}
            >
              <strong className="col-span-full font-medium group-hover:text-accent md:col-span-1">{p.title}</strong>
              <span className="text-sm text-subtle">{p.category}</span>
              <span className="hidden text-sm text-subtle md:inline">{p.date}</span>
              <Avatars ids={p.authors} className="col-start-2 row-start-2 justify-end md:col-auto md:row-auto" />
            </Link>
          ))}
          {matches.length === 0 && <p className="py-4 text-subtle">No posts match your search.</p>}
        </div>
      </section>
    </>
  );
}
