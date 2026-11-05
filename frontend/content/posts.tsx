import Link from "next/link";
import type { ReactNode } from "react";

export type Post = {
  slug: string;
  title: string;
  category: string;
  date: string;
  authors: number[];
  cover: number;
  excerpt: string;
  body: ReactNode;
};

// Add a post by adding an object here; its /blog/[slug] page is generated automatically.
// Sample writing. To use Markdown or a CMS instead, swap this file's data source.
export const posts: Post[] = [
  {
    slug: "getting-more-from-threaded-conversations",
    title: "Getting More From Threaded Conversations",
    category: "Productivity",
    date: "June 10, 2026",
    authors: [2, 6],
    cover: 1,
    excerpt: "Threads keep decisions findable and teams in sync. Here are simple habits that make them work well for a small team.",
    body: (
      <>
        <p>
          This is a sample article. Replace it with your own writing. The styles below cover everything a typical
          post needs, including headings, lists, quotes and links.
        </p>
        <h2>Start every thread with the point</h2>
        <p>
          The first message decides whether a thread gets read. Open with the question or the decision you need, then
          add the background underneath.
        </p>
        <ul>
          <li>State what you need and by when.</li>
          <li>Mention only the people who have to respond.</li>
          <li>Link to the task or document you are discussing.</li>
        </ul>
        <h2>Close the loop</h2>
        <p>A thread without a conclusion creates more questions later. When the discussion ends, write one line that captures the outcome.</p>
        <blockquote>If it took a conversation to decide, it deserves a sentence to record.</blockquote>
        <h3>Make it a team habit</h3>
        <p>
          Small habits spread quickly on small teams. Try these for two weeks, then{" "}
          <Link href="/changelog">see what&apos;s new</Link> in the product to support them.
        </p>
      </>
    ),
  },
  {
    slug: "five-features-that-save-time-every-week",
    title: "Five Features That Save Time Every Week",
    category: "Productivity",
    date: "June 3, 2026",
    authors: [3],
    cover: 2,
    excerpt: "A short tour of the shortcuts, automations and settings our most productive customers use every day.",
    body: (
      <>
        <p>This is a sample article. Small settings often save more time than big process changes.</p>
        <h2>The short list</h2>
        <ul>
          <li>Keyboard shortcuts for moving between conversations.</li>
          <li>Saved searches for the topics you follow.</li>
          <li>Automatic reminders on overdue tasks.</li>
          <li>Notification schedules that protect focus time.</li>
          <li>Templates for recurring projects.</li>
        </ul>
        <h2>Where to begin</h2>
        <p>Choose one, use it for a week, and then add the next.</p>
      </>
    ),
  },
  {
    slug: "why-simple-tools-win-on-agile-teams",
    title: "Why Simple Tools Win on Agile Teams",
    category: "Success",
    date: "May 28, 2026",
    authors: [5, 8],
    cover: 3,
    excerpt: "Every extra feature has a cost. Here is why fewer moving parts help a small team move quickly.",
    body: (
      <>
        <p>This is a sample article. Agile teams change direction often, and heavy tools make every change more expensive.</p>
        <h2>Less to learn, less to maintain</h2>
        <p>When a tool is simple, new teammates contribute sooner and nobody has to look after complicated workflows.</p>
        <blockquote>The best process is the one your team actually follows.</blockquote>
      </>
    ),
  },
  {
    slug: "communication-habits-of-teams-that-ship-quickly",
    title: "Communication Habits of Teams That Ship Quickly",
    category: "Productivity",
    date: "May 19, 2026",
    authors: [1, 4],
    cover: 4,
    excerpt: "What fast-moving teams do differently when it comes to meetings, updates and decisions.",
    body: (
      <>
        <p>This is a sample article. Fast teams tend to write more and meet less.</p>
        <h2>Three habits worth copying</h2>
        <ul>
          <li>Share updates in writing, and keep meetings for decisions.</li>
          <li>Give every decision a clear owner.</li>
          <li>Keep discussion next to the work it concerns.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "a-practical-guide-to-running-lean-sprints",
    title: "A Practical Guide to Running Lean Sprints",
    category: "Guides",
    date: "May 7, 2026",
    authors: [7],
    cover: 5,
    excerpt: "A lightweight sprint routine that keeps a small team focused without adding ceremony.",
    body: (
      <>
        <p>This is a sample article. A sprint only needs a goal, a short list of work and a time to review it.</p>
        <h2>The routine</h2>
        <ul>
          <li>Agree on one goal at the start of the sprint.</li>
          <li>Keep the list short enough to finish.</li>
          <li>Review what shipped, then adjust the next plan.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "from-concept-to-launch-planning-a-release",
    title: "From Concept to Launch: Planning a Release",
    category: "Guides",
    date: "April 12, 2026",
    authors: [2, 6, 5],
    cover: 6,
    excerpt: "How to take a release from idea to launch day without last-minute surprises.",
    body: (
      <>
        <p>This is a sample article. Good launches are mostly decided weeks before launch day.</p>
        <h2>Work backward from the date</h2>
        <p>Set the launch date, list everything that has to be true by then, and assign each item an owner.</p>
        <h2>Rehearse the launch</h2>
        <p>Walk through launch day step by step. Anything nobody can explain is a risk worth fixing early.</p>
      </>
    ),
  },
];
