import type { Metadata } from "next";
import Link from "next/link";
import { ActivityFeedMock } from "@/components/mocks";
import { CtaBand, Faq, FeatureCards, LogoCloud, PageHero, Testimonials } from "@/components/sections";
import { buttonClass, ButtonRow } from "@/components/ui";
import { insightsTestimonials } from "@/content/site";

export const metadata: Metadata = {
  title: "Realtime Insights",
  description: "Live visibility into what your team is doing and where work is stuck.",
};

export default function RealtimeInsightsPage() {
  return (
    <>
      <PageHero
        tag="Feature"
        title="Realtime Insights"
        text="See how work is moving right now, and make better decisions with up-to-the-minute information."
      >
        <ButtonRow center>
          <Link className={buttonClass()} href="/request-demo">
            Request demo
          </Link>
          <Link className={buttonClass("secondary")} href="/pricing">
            See pricing
          </Link>
        </ButtonRow>
        <ActivityFeedMock />
      </PageHero>

      <LogoCloud />

      <Testimonials title="What our clients say" items={insightsTestimonials} />

      <section className="page-container section-b">
        <FeatureCards
          items={[
            ["bell", "Instant Notifications", "Get updates on milestones, completed tasks and key team activity as they happen."],
            ["activity", "Live Activity Feed", "Follow ongoing work across the team in one continuously updated stream."],
            ["bars", "Performance Dashboards", "Track the metrics that matter and spot trends before they become problems."],
            ["file", "Custom Reports", "Build tailored reports on timelines, productivity and resource allocation."],
            ["alert", "Bottleneck Alerts", "Get notified the moment work stalls, so projects stay on track."],
            ["clock", "Completion Metrics", "Monitor delivery over time and understand where capacity is going."],
          ]}
        />
      </section>

      <CtaBand title="Know what is happening, as it happens" text="Your team&rsquo;s data, instantly analyzed." />

      <Faq
        spaced
        items={[
          ["What are Realtime Insights?", "A live view of your workspace activity that lets you monitor and respond to changes as they occur."],
          ["Can I customize what I see?", "Yes. Choose the data and metrics shown on each dashboard, and save views for your team."],
          ["How do I turn it on?", "Insights is available from the sidebar on every paid plan, with no extra setup required."],
          ["What data can I analyze?", "Tasks, projects, conversations, files and team activity are all available for reporting."],
        ]}
      />
    </>
  );
}
