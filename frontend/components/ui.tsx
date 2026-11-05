import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

const buttonVariants = {
  primary: "border-accent-hover bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface-2 hover:bg-surface-3",
};
const buttonSizes = { md: "h-9 px-[18px]", sm: "h-8 px-3.5" };

export function buttonClass(variant: keyof typeof buttonVariants = "primary", size: keyof typeof buttonSizes = "md") {
  return `inline-flex flex-none items-center justify-center gap-1 rounded-full border text-sm whitespace-nowrap transition-colors ${buttonVariants[variant]} ${buttonSizes[size]}`;
}

export const sectionTitle = "text-[clamp(26px,4vw,36px)] leading-[1.15] tracking-[-.025em]";
export const sectionText = "text-[clamp(16px,2vw,18px)] text-subtle";
export const linkArrow = "inline-flex items-center gap-1 text-sm text-accent";

export function Logo() {
  return (
    <Link className="inline-flex items-center gap-2 text-2xl font-semibold tracking-[-.8px]" href="/" aria-label="StratPool home">
      <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 14h5v8H3zM9.5 8h5v14h-5zM16 2h5v20h-5z" />
      </svg>
      StratPool
    </Link>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded-full border bg-surface-2 px-3 py-0.5 text-sm text-muted">{children}</span>;
}

export function IconChip({ name }: { name: IconName }) {
  return (
    <span className="grid size-9 flex-none place-items-center rounded-full bg-surface-3 text-lg">
      <Icon name={name} />
    </span>
  );
}

export function Avatar({ id, className = "" }: { id: number; className?: string }) {
  return <Image className={className} src={`/img/avatars/avatar-${id}.svg`} alt="" width={48} height={48} />;
}

export function Avatars({
  ids,
  borderClass = "border-surface",
  className = "",
}: {
  ids: number[];
  borderClass?: string;
  className?: string;
}) {
  return (
    <div className={`flex ${className}`}>
      {ids.map((id) => (
        <Avatar key={id} id={id} className={`size-6 rounded-full border-2 not-first:-ml-2 ${borderClass}`} />
      ))}
    </div>
  );
}

export function Cover({ id, className, eager }: { id: number; className?: string; eager?: boolean }) {
  return (
    <Image
      className={className}
      src={`/img/covers/cover-${id}.svg`}
      alt=""
      width={1200}
      height={675}
      loading={eager ? "eager" : "lazy"}
    />
  );
}

export function CompanyLogo({ name, className }: { name: string; className?: string }) {
  return (
    <Image
      className={className}
      src={`/img/logos/${name.toLowerCase()}.svg`}
      alt={name}
      width={Math.round(34 + name.length * 12.5)}
      height={32}
    />
  );
}

export function SectionHead({
  tag,
  title,
  text,
  as: Heading = "h2",
}: {
  tag?: string;
  title: string;
  text?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mx-auto mb-10 max-w-[760px] text-center">
      {tag && <Tag>{tag}</Tag>}
      <Heading className={`mt-2 ${sectionTitle}`}>{title}</Heading>
      {text && <p className={`mt-2 ${sectionText}`}>{text}</p>}
    </div>
  );
}

export function CheckList({ items, className }: { items: string[]; className: string }) {
  return (
    <ul className={`grid gap-3 text-muted ${className}`}>
      {items.map((item) => (
        <li className="flex items-start gap-3" key={item}>
          <Icon name="check" className="mt-[3px] text-base text-subtle" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ButtonRow({ center, className = "", children }: { center?: boolean; className?: string; children: ReactNode }) {
  return <div className={`flex flex-wrap items-center gap-2 ${center ? "justify-center" : ""} ${className}`}>{children}</div>;
}

export function StartButtons({ more }: { more: string }) {
  return (
    <>
      <Link className={buttonClass()} href="/sign-up">
        Get started
      </Link>
      <Link className={buttonClass("secondary")} href={more}>
        See more
      </Link>
    </>
  );
}

export function ArticleLayout({
  meta,
  title,
  lead,
  cover,
  children,
}: {
  meta?: ReactNode;
  title: string;
  lead: string;
  cover?: number;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-[720px] px-6 pt-14 pb-24">
      {meta && <div className="flex items-center gap-3 text-sm text-subtle">{meta}</div>}
      <h1 className="mt-4 text-[clamp(32px,5vw,48px)] leading-[1.1] tracking-[-.03em]">{title}</h1>
      <p className="mt-4 text-lg text-muted">{lead}</p>
      {cover && <Cover id={cover} className="mt-8 w-full rounded-xl border" eager />}
      <div className="prose mt-8">{children}</div>
    </article>
  );
}
