import type { Metadata } from "next";
import Link from "next/link";
import { BoardMock } from "@/components/mocks";
import { CtaCenter, LogoCloud, PageHero, PlainColumns } from "@/components/sections";
import { buttonClass, ButtonRow, StartButtons } from "@/components/ui";

export const metadata: Metadata = {
  title: "Collaborative Task Boards",
  description: "Plan, assign and track work together in real time.",
};

export default function TaskBoardsPage() {
  return (
    <>
      <PageHero
        tag="Collaboration"
        title="Collaborative Task Boards"
        text="Bring planning into the same place as your conversations, and watch the whole project move together."
      >
        <ButtonRow center>
          <StartButtons more="/pricing" />
        </ButtonRow>
      </PageHero>

      <LogoCloud />

      <section className="page-container section-y">
        <BoardMock />
        <PlainColumns
          items={[
            ["users", "Real-Time Collaboration", "Everyone can work on the same board at once and see every update the moment it happens."],
            ["layers", "Connected to Your Tools", "Sync with your email, calendar and other apps, so nothing has to be entered twice."],
            ["check", "Assignment and Tracking", "Give each task an owner and due date, then follow its progress all the way through to done."],
          ]}
        />
      </section>

      <section className="page-container section-b">
        <CtaCenter
          title="Unlock your team's potential"
          text="Write in threads, stay in flow, and skip the unnecessary video calls."
        >
          <Link className={buttonClass()} href="/sign-up">
            Get started
          </Link>
        </CtaCenter>
      </section>
    </>
  );
}
