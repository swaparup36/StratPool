import type { Metadata } from "next";
import { BlogList } from "@/components/blog-list";
import { posts } from "@/content/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Ideas and practical advice on teamwork, planning and shipping.",
};

export default function BlogPage() {
  // Article bodies stay on the server; the searchable list only needs the summaries.
  const summaries = posts.map(({ body: _body, ...summary }) => summary);
  return <BlogList posts={summaries} />;
}
