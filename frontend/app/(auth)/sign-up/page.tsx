'use client';

import { useRouter } from 'next/navigation';
import { AuthCard, Field, NameFields } from '@/components/forms';
import { useWalletAuth } from '@/hooks/use-wallet-auth';

export default function SignupPage() {
  const router = useRouter();
  const { start, error } = useWalletAuth('signup', () => router.replace('/'));

  return (
    <AuthCard
      title="Create your account"
      submit="Continue"
      onSubmit={start}
      error={error}
      intro={<>Already have an account? <a href="/sign-in">Log in</a></>}
    >
      <NameFields />
      <Field name="email" label="Email" type="email" autoComplete="email" />
    </AuthCard>
  );
}