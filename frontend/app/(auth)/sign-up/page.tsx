import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, Field, NameFields, SourceField } from "@/components/forms";

export const metadata: Metadata = { title: "Sign up", description: "Create your free Acme account." };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Get started for free"
      intro={
        <>
          Already registered? <Link href="/sign-in">Log in</Link> to your account.
        </>
      }
      submit="Sign Up"
      success="Thanks! Check your inbox to confirm your account."
    >
      <NameFields />
      <Field name="email" label="Work email" type="email" autoComplete="email" />
      <SourceField />
    </AuthCard>
  );
}
