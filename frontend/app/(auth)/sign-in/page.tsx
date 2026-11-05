'use client';

import { useRouter } from 'next/navigation';
import { AuthCard, Field } from '@/components/forms';
import { useWalletAuth } from '@/hooks/use-wallet-auth';

export default function LoginPage() {
  const router = useRouter();
  const { start, error } = useWalletAuth('login', () => router.replace('/'));

  return (
    <AuthCard
      title="Log in"
      submit="Continue"
      onSubmit={start}
      error={error}
      intro={<>New here? <a href="/sign-up">Create an account</a></>}
    >
      <Field name="email" label="Email" type="email" autoComplete="email" />
    </AuthCard>
  );
}