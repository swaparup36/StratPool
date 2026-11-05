import Link from "next/link";
import type { ReactNode } from "react";
import { companies, plans, type Testimonial } from "@/content/site";
import { Carousel } from "./carousel";
import type { IconName } from "./icon";
import { Avatar, buttonClass, ButtonRow, CheckList, CompanyLogo, IconChip, SectionHead, StartButtons, Tag } from "./ui";

const smallGrid = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

export function PageHero({
  tag,
  title,
  text,
  children,
}: {
  tag: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section className="page-container pt-[72px] pb-10 text-center">
      <Tag>{tag}</Tag>
      <h1 className="mt-3 text-[clamp(32px,6vw,56px)] leading-[1.05] tracking-[-.03em]">{title}</h1>
      <p className="mx-auto mt-4 mb-6 max-w-[640px] text-lg text-subtle">{text}</p>
      {children}
    </section>
  );
}

export function LogoCloud() {
  return (
    <section className="page-container pt-14 pb-6 text-center">
      <h2 className="text-sm font-normal text-subtle opacity-80">Trusted by 4,000+ growing teams</h2>
      <div className="mt-8 flex flex-wrap justify-center gap-x-14 gap-y-6">
        {companies.map((name) => (
          <CompanyLogo key={name} name={name} className="h-8 w-auto" />
        ))}
      </div>
    </section>
  );
}

export function FeatureCards({ items }: { items: [IconName, string, string][] }) {
  return (
    <div className={`${smallGrid} gap-5`}>
      {items.map(([icon, title, text]) => (
        <article className="rounded-xl border bg-surface p-4 hover:bg-surface-2" key={title}>
          <IconChip name={icon} />
          <h3 className="mt-3">{title}</h3>
          <p className="mt-1 text-sm text-subtle">{text}</p>
        </article>
      ))}
    </div>
  );
}

export function PlainColumns({ items }: { items: [IconName, string, string][] }) {
  return (
    <div className={`${smallGrid} mb-8 gap-8`}>
      {items.map(([icon, title, text]) => (
        <div key={title}>
          <IconChip name={icon} />
          <h3 className="mt-3">{title}</h3>
          <p className="mt-1 text-sm text-subtle">{text}</p>
        </div>
      ))}
    </div>
  );
}

export function FeatureRow({
  title,
  text,
  list,
  flip,
  children,
}: {
  title: string;
  text: string;
  list?: string[];
  flip?: boolean;
  children: ReactNode;
}) {
  return (
    <article className="grid gap-2 rounded-xl border bg-surface-2 p-2 md:grid-cols-2">
      <div className="p-5 md:p-8">
        <h3 className="text-[clamp(22px,2.6vw,28px)] leading-[1.2] tracking-[-.02em]">{title}</h3>
        <p className="mt-2 text-muted">{text}</p>
        {list && <CheckList items={list} className="mt-6 text-[15px]" />}
      </div>
      <div
        className={`grid min-h-[280px] place-items-center rounded-lg border bg-surface p-6 md:min-h-[360px] ${flip ? "md:-order-1" : ""}`}
        aria-hidden="true"
      >
        {children}
      </div>
    </article>
  );
}

const ctaHeading = "text-[clamp(24px,3.4vw,32px)] leading-[1.15] tracking-[-.025em]";

export function CtaBand({ title, text, more = "/pricing" }: { title: string; text: string; more?: string }) {
  return (
    <section className="page-container">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-xl bg-[color-mix(in_oklab,var(--accent)_14%,var(--surface-1))] p-7 md:p-10">
        <div>
          <h2 className={ctaHeading}>{title}</h2>
          <p className="mt-2 text-muted">{text}</p>
        </div>
        <ButtonRow>
          <StartButtons more={more} />
        </ButtonRow>
      </div>
    </section>
  );
}

export function CtaCenter({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border bg-surface-2 p-7 text-center md:p-10">
      <div>
        <h2 className={ctaHeading}>{title}</h2>
        <p className="mt-2 text-muted">{text}</p>
      </div>
      <ButtonRow center>{children}</ButtonRow>
    </div>
  );
}

export function Testimonials({ title, items }: { title: string; items: Testimonial[] }) {
  return (
    <Carousel title={title}>
      {items.map((t) => (
        <figure className="flex w-[min(700px,85vw)] flex-none snap-start flex-col rounded-xl border" key={t.quote}>
          <blockquote className="flex-1 p-8 text-[clamp(20px,2.6vw,28px)] leading-[1.35] font-light tracking-[-.02em]">
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <figcaption className="flex items-center gap-4 border-t px-5">
            <Avatar id={t.avatar} className="my-4 size-12 rounded-full md:size-16" />
            <div>
              <strong className="block font-medium">{t.name}</strong>
              <span className="text-sm text-subtle">
                {t.role}, {t.company}
              </span>
            </div>
            <div className="ml-auto hidden place-items-center self-stretch border-l pl-4 md:grid">
              <CompanyLogo name={t.company} className="h-[22px] w-auto" />
            </div>
          </figcaption>
        </figure>
      ))}
    </Carousel>
  );
}

export function Plans() {
  return (
    <div className={`${smallGrid} gap-5`}>
      {plans.map((plan) => (
        <article
          className={`relative flex flex-col overflow-hidden rounded-xl border p-8 text-center ${
            plan.featured
              ? "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-[120px] after:bg-radial-[50%_100%_at_50%_100%] after:from-accent/35 after:to-transparent"
              : ""
          }`}
          key={plan.name}
        >
          {plan.featured && <span className="absolute inset-x-0 top-3 text-[13px] text-accent">Most popular</span>}
          <div className="text-[32px] font-medium tracking-[-.025em]">{plan.price}/mo</div>
          <h3 className="mt-3 text-lg">{plan.name} plan</h3>
          <div className="text-sm text-subtle">Billed annually</div>
          <CheckList items={plan.features} className="mt-6 mb-8 flex-1 text-left text-sm" />
          <Link
            className={`${buttonClass(plan.featured ? "primary" : "secondary")} relative w-full`}
            href="/sign-up"
          >
            Get started
          </Link>
        </article>
      ))}
    </div>
  );
}

export function Faq({ items, spaced }: { items: [string, string][]; spaced?: boolean }) {
  return (
    <section className={`page-container ${spaced ? "section-y" : "section-b"}`}>
      <SectionHead tag="FAQs" title="Frequently asked questions" text="Quick answers from our team." />
      <div className={`${smallGrid} mx-auto max-w-[1056px] gap-10`}>
        {items.map(([question, answer]) => (
          <div key={question}>
            <h3 className="text-lg leading-[1.4]">{question}</h3>
            <p className="mt-2 text-[15px] text-subtle">{answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
