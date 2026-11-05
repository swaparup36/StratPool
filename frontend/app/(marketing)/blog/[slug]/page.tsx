import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout, Avatars, Tag } from "@/components/ui";
import { posts } from "@/content/posts";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <ArticleLayout
      title={post.title}
      lead={post.excerpt}
      cover={post.cover}
      meta={
        <>
          <Tag>{post.category}</Tag>
          <time>{post.date}</time>
          <Avatars ids={post.authors} />
        </>
      }
    >
      {post.body}
    </ArticleLayout>
  );
}
