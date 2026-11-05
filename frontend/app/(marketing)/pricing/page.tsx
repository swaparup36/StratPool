import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import { LogoCloud, Plans } from "@/components/sections";
import { TestimonialWall } from "@/components/testimonial-wall";
import { buttonClass, SectionHead } from "@/components/ui";
import { plans, pricingTestimonials } from "@/content/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for teams of every size.",
};

const yes = <Icon name="check" label="Included" className="inline-block text-base text-accent" />;
const no = <span aria-label="Not included">&mdash;</span>;

const groups: { name: string; rows: [string, string, ReactNode, ReactNode, ReactNode][] }[] = [
  {
    name: "Workspace",
    rows: [
      ["Team members", "How many people can join your workspace.", "Up to 10", "Unlimited", "Unlimited"],
      ["File uploads", "Maximum size of a single uploaded file.", "Up to 5 MB", "Up to 2 GB", "Unlimited"],
      ["Message history", "How long messages stay searchable.", "90 days", "Unlimited", "Unlimited"],
      ["Analytics", "Reporting on team activity.", "Basic", "Advanced", "Advanced"],
    ],
  },
  {
    name: "Security & control",
    rows: [
      ["Two-factor authentication", "Require a second step when signing in.", yes, yes, yes],
      ["Custom roles", "Define exactly who can do what.", no, yes, yes],
      ["Guest access", "Invite people from outside your company.", no, yes, yes],
      ["Single sign-on", "Log in through your identity provider.", no, no, yes],
      ["Audit logs", "A full record of workspace activity.", no, no, yes],
    ],
  },
];

const cell = "border-b px-4 py-3.5 text-center font-normal";
const firstCell = "w-[28%] border-b px-4 py-3.5 text-left font-normal";

export default function PricingPage() {
  return (
    <>
      <section className="page-container section-y">
        <SectionHead
          as="h1"
          tag="Pricing"
          title="Simple pricing for your team"
          text="Pick the plan that fits today and change it whenever you need to."
        />
        <Plans />
      </section>

      <LogoCloud />

      <section className="page-container section-y">
        <SectionHead title="Compare plans" />
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Plan comparison">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className={firstCell}>
                  <span className="sr-only">Feature</span>
                </th>
                {plans.map((plan) => (
                  <th scope="col" className={`${cell} align-top`} key={plan.name}>
                    <strong className="block text-base font-medium">{plan.name} plan</strong>
                    <span className="mb-3 block text-subtle">{plan.price}/mo</span>
                    <Link className={buttonClass(plan.featured ? "primary" : "secondary", "sm")} href="/sign-up">
                      Get started
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.flatMap((group) => [
                <tr key={group.name}>
                  <th colSpan={4} scope="colgroup" className="border-b px-4 pt-8 pb-3.5 text-left text-base font-medium">
                    {group.name}
                  </th>
                </tr>,
                ...group.rows.map(([feature, hint, ...values]) => (
                  <tr key={feature}>
                    <th scope="row" className={firstCell}>
                      <span className="inline-flex items-center gap-1.5">
                        {feature}
                        <span title={hint}>
                          <Icon name="info" className="text-sm text-subtle" />
                          <span className="sr-only">{hint}</span>
                        </span>
                      </span>
                    </th>
                    {values.map((value, i) => (
                      <td className={`${cell} text-muted`} key={i}>
                        {value}
                      </td>
                    ))}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </section>

      <section className="page-container section-b">
        <SectionHead
          tag="Testimonials"
          title="What our customers say"
          text="Teams of every size rely on Acme to get work done."
        />
        <TestimonialWall items={pricingTestimonials} />
      </section>
    </>
  );
}
