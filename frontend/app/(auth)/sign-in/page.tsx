import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, Field } from "@/components/forms";

export const metadata: Metadata = { title: "Log in", description: "Log in to your Acme account." };

export default function SignInPage() {
  return (
    <AuthCard
      title="Log in to your account"
      intro={
        <>
          Don&apos;t have an account? <Link href="/sign-up">Sign up</Link> for a free trial.
        </>
      }
      submit="Log In"
      success="Check your inbox for a login link."
    >
      <Field name="email" label="Email address" type="email" autoComplete="email" />
    </AuthCard>
  );
}
