import type { ReactNode } from "react";

export type Release = {
  slug: string;
  title: string;
  date: string;
  authors: number[];
  cover: number;
  summary: string;
  body: ReactNode;
};

// Add a release by adding an object here; its /changelog/[slug] page is generated automatically.
export const releases: Release[] = [
  {
    slug: "faster-more-accurate-search",
    title: "Faster, More Accurate Search",
    date: "March 31, 2026",
    authors: [3, 4],
    cover: 4,
    summary: "Search has been rebuilt to return better results in less time. You can now filter past conversations and files by keyword, date and file type.",
    body: (
      <>
        <p>This is a sample release note. Describe what changed, who it helps and anything people need to do.</p>
        <h2>What&apos;s new</h2>
        <ul>
          <li>Filter results by keyword, date and file type.</li>
          <li>Results appear as you type.</li>
          <li>Recently viewed items are shown first.</li>
        </ul>
        <h2>Getting it</h2>
        <p>The update is available to every workspace, with no action needed.</p>
      </>
    ),
  },
  {
    slug: "customizable-notifications",
    title: "Customizable Notifications",
    date: "March 28, 2026",
    authors: [1, 5, 7],
    cover: 5,
    summary: "Choose exactly what deserves your attention. New options let you prioritize important messages and quiet everything else.",
    body: (
      <>
        <p>This is a sample release note. Notifications can now be set for each project and conversation.</p>
        <h2>What&apos;s new</h2>
        <ul>
          <li>Per-project notification levels.</li>
          <li>Quiet hours for focused work.</li>
          <li>A daily summary of what you missed.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "better-file-sharing",
    title: "Better File Sharing",
    date: "March 17, 2026",
    authors: [3, 8],
    cover: 6,
    summary: "Share larger files, preview more formats and keep project documents organized with an improved upload experience.",
    body: (
      <>
        <p>This is a sample release note. Uploads are now faster and more reliable.</p>
        <h2>What&apos;s new</h2>
        <ul>
          <li>Support for larger files.</li>
          <li>Previews for more file formats.</li>
          <li>Files are grouped by project automatically.</li>
        </ul>
      </>
    ),
  },
];
