import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DOC_LINKS } from "@/content/docs";
import { Icon, type IconName } from "./icon";
import { Tag } from "./ui";

export type DocSection = { id: string; title: string; body: ReactNode };

export function DocPage({ href, title, lead, sections }: { href: string; title: string; lead: string; sections: DocSection[] }) {
  const index = DOC_LINKS.findIndex((doc) => doc.href === href);
  const previous = DOC_LINKS[index - 1];
  const next = DOC_LINKS[index + 1];

  return (
    <div className="mx-auto flex w-full max-w-[1120px] gap-12 px-6 pt-12 pb-20 md:px-10">
      <article className="min-w-0 flex-1">
        <Tag>Docs</Tag>
        <h1 className="mt-3 text-[clamp(32px,5vw,44px)] leading-[1.1] tracking-[-.03em]">{title}</h1>
        <p className="mt-4 text-lg text-muted">{lead}</p>

        <div className="prose mt-2">
          {sections.map(({ id, title, body }) => (
            <section className="[&>*+*]:mt-4" key={id}>
              <h2 className="scroll-mt-24" id={id}>
                {title}
              </h2>
              {body}
            </section>
          ))}
        </div>

        <nav className="mt-14 grid gap-3 border-t pt-6 sm:grid-cols-2" aria-label="Guides">
          {previous && <PagerLink {...previous} direction="Previous" />}
          {next && <PagerLink {...next} direction="Next" className="sm:col-start-2 sm:text-right" />}
        </nav>
      </article>

      <nav className="sticky top-24 hidden w-52 flex-none self-start text-sm xl:block" aria-label="On this page">
        <h2 className="mb-3 text-xs text-subtle">On this page</h2>
        <ul className="grid gap-2">
          {sections.map(({ id, title }) => (
            <li key={id}>
              <a className="text-muted transition-colors hover:text-fg" href={`#${id}`}>
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function PagerLink({ href, label, direction, className = "" }: { href: string; label: string; direction: string; className?: string }) {
  return (
    <Link className={`rounded-xl border p-4 transition-colors hover:bg-surface-2 ${className}`} href={href}>
      <span className="block text-xs text-subtle">{direction}</span>
      {label}
    </Link>
  );
}

// Links to the full-size file, because a screenshot scaled to the column can be hard to read.
// Each image goes in public/img/docs, and its height follows the file, so any aspect ratio works.
export function Screenshot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="my-6!">
      <a href={src} target="_blank" rel="noreferrer" aria-label={`Open full size: ${alt}`}>
        <Image className="h-auto w-full rounded-xl border" src={src} alt={alt} width={1600} height={1000} sizes="(min-width: 1024px) 800px, 100vw" />
      </a>
      <figcaption className="mt-2 text-center text-[13px] text-subtle">{caption}</figcaption>
    </figure>
  );
}

const CALLOUTS = {
  note: { icon: "info", className: "border-accent/40 bg-accent/8" },
  warning: { icon: "alert", className: "border-amber-500/40 bg-amber-500/8" },
} satisfies Record<string, { icon: IconName; className: string }>;

export function Callout({ type = "note", title, children }: { type?: keyof typeof CALLOUTS; title: string; children: ReactNode }) {
  const { icon, className } = CALLOUTS[type];
  return (
    <aside className={`my-5! flex gap-3 rounded-xl border p-4 text-[15px] ${className}`}>
      <Icon name={icon} className="mt-1 flex-none text-fg" />
      <div className="min-w-0">
        <strong className="font-medium text-fg">{title}</strong>
        <div className="mt-1">{children}</div>
      </div>
    </aside>
  );
}

// Stacks on small screens, where the arrows turn to point down.
export function Flow({ steps, caption }: { steps: { title: string; text: string }[]; caption: string }) {
  return (
    <figure className="my-6! rounded-xl border bg-surface-2 p-4 sm:p-5">
      <ol className="flex list-none! flex-col gap-2 p-0! lg:flex-row lg:items-stretch">
        {steps.map(({ title, text }, index) => (
          <li className="contents" key={title}>
            {index > 0 && <Icon name="right" className="flex-none self-center text-accent max-lg:rotate-90" />}
            <div className="min-w-0 flex-1 rounded-lg border bg-surface p-3">
              <p className="text-[13px] text-subtle">Step {index + 1}</p>
              <p className="font-medium text-fg">{title}</p>
              <p className="mt-1 text-[13px]">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 text-center text-[13px] text-subtle">{caption}</figcaption>
    </figure>
  );
}
