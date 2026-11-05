import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { ArticleLayout, Avatars, linkArrow } from "@/components/ui";
import { releases } from "@/content/changelog";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return releases.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const release = releases.find((r) => r.slug === slug);
  return release ? { title: release.title, description: release.summary } : {};
}

export default async function ReleasePage({ params }: Props) {
  const { slug } = await params;
  const release = releases.find((r) => r.slug === slug);
  if (!release) notFound();

  return (
    <ArticleLayout
      title={release.title}
      lead={release.summary}
      cover={release.cover}
      meta={
        <>
          <Link className={linkArrow} href="/changelog">
            <Icon name="left" /> Changelog
          </Link>
          <time>{release.date}</time>
          <Avatars ids={release.authors} />
        </>
      }
    >
      {release.body}
    </ArticleLayout>
  );
}
