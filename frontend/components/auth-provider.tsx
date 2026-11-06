'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { disconnect } from 'wagmi/actions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  createAuthenticationAdapter,
  lightTheme,
  type AuthenticationStatus,
} from '@rainbow-me/rainbowkit';
import { createSiweMessage } from 'viem/siwe';
import { config } from '@/wagmi';

// site tokens from globals.css, so the wallet modals follow the theme switch too
const base = lightTheme();
const walletTheme: typeof base = {
  ...base,
  fonts: { body: 'var(--font-sans)' },
  radii: { ...base.radii, actionButton: '9999px', menuButton: '8px', modal: '12px', modalMobile: '12px' },
  colors: {
    ...base.colors,
    accentColor: 'var(--accent)',
    accentColorForeground: 'var(--on-accent)',
    actionButtonBorder: 'transparent',
    actionButtonBorderMobile: 'transparent',
    actionButtonSecondaryBackground: 'var(--surface-2)',
    closeButton: 'var(--text-2)',
    closeButtonBackground: 'var(--surface-2)',
    downloadBottomCardBackground: 'var(--surface-2)',
    downloadTopCardBackground: 'var(--surface-2)',
    error: 'var(--color-red-500)',
    generalBorder: 'var(--border)',
    generalBorderDim: 'var(--surface-3)',
    menuItemBackground: 'var(--surface-2)',
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',
    modalBackground: 'var(--surface-1)',
    modalBorder: 'var(--border)',
    modalText: 'var(--text-1)',
    modalTextDim: 'var(--text-3)',
    modalTextSecondary: 'var(--text-2)',
    selectedOptionBorder: 'var(--border)',
  },
  shadows: { ...base.shadows, dialog: 'none', selectedOption: 'none', selectedWallet: 'none', walletLogo: 'none' },
};

type AuthState = {
  status: AuthenticationStatus;
  error: string | null;
  setError: (e: string | null) => void;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export function AuthProvider({
  initialStatus,
  children,
}: {
  initialStatus: AuthenticationStatus;
  children: ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  const adapter = useMemo(
    () =>
      createAuthenticationAdapter({
        getNonce: async () => (await fetch('/api/auth/nonce')).text(),
        createMessage: ({ nonce, address, chainId }) =>
          createSiweMessage({
            domain: window.location.host,
            address,
            statement: 'Sign in to My DeFi App',
            uri: window.location.origin,
            version: '1',
            chainId,
            nonce,
          }),
        verify: async ({ message, signature }) => {
          const res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, signature }),
          }).catch(() => null);
          if (!res?.ok) {
            const body = await res?.json().catch(() => null);
            setError(body?.error ?? 'Sign-in failed');
            // RainbowKit's Retry would reuse the spent nonce. Disconnecting closes the modal
            // so the error shows on the form, and resubmitting starts with a fresh nonce.
            await disconnect(config);
            return false;
          }
          setError(null);
          setStatus('authenticated');
          return true;
        },
        signOut: async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          setStatus('unauthenticated');
          if (/^\/(strategies|investors)(\/|$)/.test(window.location.pathname)) window.location.assign('/');
        },
      }),
    []
  );

  const logout = async () => {
    await disconnect(config);
    await adapter.signOut();
  };

  return (
    <AuthContext.Provider value={{ status, error, setError, logout }}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitAuthenticationProvider adapter={adapter} status={status}>
            <RainbowKitProvider theme={walletTheme}>{children}</RainbowKitProvider>
          </RainbowKitAuthenticationProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </AuthContext.Provider>
  );
}