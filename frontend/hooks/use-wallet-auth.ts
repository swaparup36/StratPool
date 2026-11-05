'use client';

import { useEffect } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { useAuth } from '@/components/auth-provider';

export function useWalletAuth(mode: 'signup' | 'login', onAuthenticated: () => void) {
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { status, error, setError } = useAuth();
  const { isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (status === 'authenticated') onAuthenticated();
  }, [status]);

  useEffect(() => {
    if (connectModalOpen && isConnected && !chain) {
      setError('Switch your wallet to Ethereum, Base, Arbitrum or Sepolia, then try again');
      disconnect();
    }
  }, [connectModalOpen, isConnected, chain]);

  async function start(form: FormData) {
    setError(null);
    const res = await fetch('/api/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        email: form.get('email'),
        firstName: form.get('first_name'),
        lastName: form.get('last_name'),
      }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body.error ?? 'Something went wrong');
      return;
    }
    if (!openConnectModal) {
      setError('Please disconnect your wallet and try again');
      return;
    }
    openConnectModal();
  }

  return { start, error };
}
