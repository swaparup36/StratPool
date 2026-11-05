import type { Metadata } from "next";
import Link from "next/link";
import { Icon, SocialLink } from "@/components/icon";
import { Avatars, Cover, linkArrow } from "@/components/ui";
import { releases } from "@/content/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description: "New features, improvements and fixes in Acme.",
};

export default function ChangelogPage() {
  return (
    <>
      <section className="page-container pt-14 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[clamp(32px,5vw,48px)] leading-[1.1] tracking-[-.03em]">Changelog</h1>
            <p className="mt-2 text-lg text-subtle">What are we shipping?</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-subtle">
            Follow us on:
            <div className="flex gap-4 text-lg">
              <SocialLink name="X" />
              <SocialLink name="LinkedIn" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-[1056px] px-6 pt-6">
        {releases.map((release) => (
          <article className="grid gap-3 pb-12 md:grid-cols-[180px_1fr] md:gap-8 md:pb-[72px]" key={release.slug}>
            <time className="text-sm text-subtle md:sticky md:top-24 md:self-start">{release.date}</time>
            <div>
              <Cover id={release.cover} className="aspect-video w-full rounded-xl border object-cover" />
              <h2 className="mt-6 text-[28px] leading-[1.2] tracking-[-.02em]">
                <Link className="hover:text-accent" href={`/changelog/${release.slug}`}>
                  {release.title}
                </Link>
              </h2>
              <p className="mt-2 text-muted">{release.summary}</p>
              <div className="mt-4 flex items-center justify-between gap-4">
                <Avatars ids={release.authors} />
                <Link className={linkArrow} href={`/changelog/${release.slug}`}>
                  Read more <Icon name="right" />
                  <span className="sr-only"> about {release.title}</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
