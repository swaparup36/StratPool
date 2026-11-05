import type { Metadata } from "next";
import { AuthCard, Field, MessageField, NameFields, SourceField } from "@/components/forms";

export const metadata: Metadata = {
  title: "Request a demo",
  description: "See Acme in action with a personal walkthrough from our team.",
};

export default function RequestDemoPage() {
  return (
    <AuthCard title="Request a demo with the Acme team" submit="Submit" success="Thanks! We will be in touch shortly.">
      <NameFields />
      <Field name="email" label="Work email" type="email" autoComplete="email" />
      <MessageField />
      <SourceField />
    </AuthCard>
  );
}
