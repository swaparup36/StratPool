import Link from "next/link";
import type { IconName } from "@/components/icon";
import { ChatMock, NewTaskMock, PeopleMock, SecureMock } from "@/components/mocks";
import {
  CtaBand,
  CtaCenter,
  Faq,
  FeatureCards,
  FeatureRow,
  LogoCloud,
  PlainColumns,
  Plans,
  Testimonials,
} from "@/components/sections";
import { Avatars, ButtonRow, IconChip, SectionHead, sectionText, sectionTitle, StartButtons, Tag } from "@/components/ui";
import { homeTestimonials } from "@/content/site";

const productivity: [IconName, string, string][] = [
  ["mail", "Focused Messaging", "Threads keep each topic separate, so decisions are quick and easy to revisit later."],
  ["zap", "Task Automation", "Assign, remind and update automatically to keep projects on schedule and in scope."],
  ["file", "Shared Files", "Every document and asset stays linked to its project and available to the right people."],
  ["smile", "Realtime Insights", "See how work is moving with up-to-the-minute data and clear visuals."],
  ["command", "Smart Notifications", "Hear about what matters, and mute the rest with flexible notification settings."],
  ["message", "Team Analytics", "Understand communication patterns and find ways to improve your workflow."],
];

const ctaTitle = "Give your team more focused hours";
const ctaText = "Write in threads, stay in flow, and skip the unnecessary video calls.";

const heroRule = "before:absolute before:left-1/2 before:w-screen before:-translate-x-1/2 before:border-t";
const heroAction = "grid h-14 place-items-center transition-colors";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-[260px] after:bg-radial-[50%_100%_at_50%_100%] after:from-accent/28 after:to-transparent">
        <div className="relative z-1 mx-auto max-w-[1200px] border-x text-center">
          <div className={`relative pt-9 before:top-20 ${heroRule}`}>
            <div className="relative inline-flex h-11 items-center gap-2 border bg-surface px-[18px] text-[13px] text-subtle">
              <Avatars ids={[1, 2, 7]} /> 1,254 happy customers
            </div>
          </div>
          <div className="px-6 pt-12 pb-14">
            <h1 className="mx-auto max-w-[960px] bg-linear-[100deg,var(--text-3)_0%,var(--text-1)_48%] bg-clip-text text-[clamp(32px,7vw,64px)] leading-none tracking-[-.034em] text-transparent">
              Team Communication Built for Moving Fast
            </h1>
            <p className="mx-auto mt-4 max-w-[680px] text-[clamp(16px,2vw,18px)] text-subtle">
              Acme is a self-hosted workspace for chat, tasks and files. Replace this paragraph with your own pitch; it
              wraps gracefully at any length.
            </p>
          </div>
          <div className={`relative pb-21 before:top-0 ${heroRule}`}>
            <div className="relative mx-auto grid max-w-[392px] border-x">
              <Link className={`${heroAction} bg-surface hover:bg-surface-2`} href="/request-demo">
                Request Demo
              </Link>
              <Link className={`${heroAction} bg-accent text-on-accent hover:bg-accent-hover`} href="/sign-up">
                Get Started for Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LogoCloud />

      <section className="page-container section-y">
        <SectionHead
          tag="Communication"
          title="Conversations That Move Work Forward"
          text="Keep decisions, context and progress in one place, so nobody has to chase an update."
        />
        <div className="grid gap-6">
          <FeatureRow
            title="Real-Time Messaging"
            text="Messages arrive the moment they are sent, keeping everyone aligned and able to respond as soon as plans change."
            list={["Instant message delivery", "Presence indicators for the whole team", "Group and private conversations"]}
          >
            <ChatMock />
          </FeatureRow>
          <FeatureRow
            title="Integrated Task Management"
            text="Turn any discussion into a task and keep the conversation attached, so the reasoning behind the work is never lost."
            flip
          >
            <NewTaskMock />
          </FeatureRow>
          <FeatureRow
            title="Secure Communication Channels"
            text="Protect sensitive conversations with strong encryption and clear access controls, without slowing the team down."
            list={["End-to-end encryption", "Secure file sharing and storage", "Built for common compliance standards"]}
          >
            <SecureMock />
          </FeatureRow>
        </div>
      </section>

      <section className="page-container section-b">
        <SectionHead
          tag="Management"
          title="Agile Planning Without the Overhead"
          text="Lightweight project tools for small teams focused on shipping product quickly."
        />
        <FeatureCards
          items={[
            ["trend", "Sprint Planning", "Plan each iteration, set clear goals and keep the scope honest."],
            ["grid", "Kanban Boards", "Follow work from idea to done on boards you can tailor to your process."],
            ["target", "Task Prioritization", "Rank work by urgency and impact so the team always knows what is next."],
            ["users", "Collaborative Task Boards", "Update tasks together in real time and keep ownership clear."],
            ["layers", "Backlog Management", "Capture ideas and user stories in a tidy backlog ready for planning."],
            ["bars", "Burndown Charts", "Spot slipping timelines early with simple, readable progress charts."],
          ]}
        />
        <ButtonRow center className="mt-8">
          <StartButtons more="/features/collaborative-task-boards" />
        </ButtonRow>
      </section>

      <CtaBand title={ctaTitle} text={ctaText} />

      <section className="page-container section-y">
        <SectionHead
          tag="Collaboration"
          title="Everything Your Team Shares, in One Place"
          text="Files, tasks and conversations work together, so projects run smoothly from kickoff to launch."
        />
        <PlainColumns
          items={[
            ["message", "Real-time Messaging", "Talk through problems as they come up and keep everyone informed."],
            ["file", "File Sharing", "Share documents and images where the work happens, always easy to find."],
            ["check", "Task Management", "Assign owners, track progress and hold one source of truth for the project."],
          ]}
        />
        <PeopleMock />
      </section>

      <section className="page-container section-b">
        <div className="mx-auto grid max-w-[1056px] gap-8 lg:grid-cols-[5fr_6fr] lg:gap-14">
          <div className="lg:sticky lg:top-[104px] lg:self-start">
            <Tag>Productivity</Tag>
            <h2 className={`mt-2 ${sectionTitle}`}>Help Your Team Do Its Best Work</h2>
            <p className={`mt-2 ${sectionText}`}>
              Fewer interruptions, clearer priorities, and more time spent building and shipping.
            </p>
            <ButtonRow className="mt-6">
              <StartButtons more="/features/realtime-insights" />
            </ButtonRow>
          </div>
          <div className="grid gap-6">
            {productivity.map(([icon, title, text]) => (
              <article className="flex gap-4 rounded-xl border bg-surface-2 p-5" key={title}>
                <IconChip name={icon} />
                <div>
                  <h3>{title}</h3>
                  <p className="mt-1 text-sm text-subtle">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container">
        <CtaCenter title={ctaTitle} text={ctaText}>
          <StartButtons more="/pricing" />
        </CtaCenter>
      </section>

      <Testimonials title="What our clients say" items={homeTestimonials} />

      <section className="page-container section-b">
        <SectionHead
          tag="Pricing"
          title="Simple pricing for your team"
          text="Pick the plan that fits today and change it whenever you need to."
        />
        <Plans />
      </section>

      <Faq
        items={[
          ["Who is Acme built for?", "Small and mid-sized teams who want one calm place for conversation, planning and files."],
          ["How is our data protected?", "Data is encrypted in transit and at rest, and access is controlled by roles you define."],
          ["Can we adapt it to our workflow?", "Yes. Boards, notifications and permissions can all be tailored to the way your team works."],
          ["Do you offer ongoing support?", "Every plan includes support, with faster response times and a dedicated contact on higher plans."],
          ["How do we get started?", "Create a free account in a couple of minutes, or request a demo and we will walk you through it."],
          ["Can we change plans later?", "Absolutely. You can upgrade or downgrade at any time from your account settings."],
        ]}
      />
    </>
  );
}
