import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { parseSiweMessage } from 'viem/siwe';
import { getSession } from '@/lib/session';
import { isAppDomain, wrongDomainError } from '@/lib/siwe';
import { clients } from '@/lib/viem';
import { db } from '@/src/prisma/db';

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

function generateUsername(firstName: string) {
  const base = firstName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  return `${base}_${randomUUID().slice(0, 8)}`;
}

export async function POST(req: Request) {
  const { message, signature } = (await req.json().catch(() => null)) ?? {};
  if (typeof message !== 'string' || typeof signature !== 'string') {
    return fail('Invalid request', 400);
  }

  const session = await getSession();
  const { nonce, pending } = session;

  if (!nonce || !pending) return fail('Session expired, please start again', 400);

  // Nonce is single-use, whatever happens next
  session.nonce = undefined;
  await session.save();

  try {
    const parsed = parseSiweMessage(message);
    const client = parsed.chainId ? clients[parsed.chainId] : undefined;
    if (!client || !parsed.address) return fail('Unsupported chain', 400);
    if (!isAppDomain(parsed.domain)) return fail(wrongDomainError(), 401);

    const valid = await client.verifySiweMessage({
      message,
      signature: signature as `0x${string}`,
      nonce,
      domain: parsed.domain,
    });
    if (!valid) return fail('Invalid signature', 401);

    const address = parsed.address.toLowerCase();
    const byEmail = await db.orm.public.User.where({ email: pending.email }).first();

    let user;
    if (byEmail) {
      if (byEmail.address !== address) return fail('This wallet is not linked to this account', 401);
      user = byEmail;
    } else {
      if (pending.mode === 'login') return fail('No account found. Please sign up.', 404);

      const byWallet = await db.orm.public.User.where({ address }).first();
      if (byWallet) return fail('This wallet is already linked to another account', 409);

      user = await db.orm.public.User.create({
        email: pending.email,
        address,
        firstName: pending.firstName!,
        lastName: pending.lastName!,
        username: generateUsername(pending.firstName!),
      });
    }

    session.pending = undefined;
    session.userId = user.id;
    await session.save();

    return NextResponse.json({ user: { id: user.id, email: user.email, address: user.address } });
  } catch (e) {
    if ((e as { sqlState?: string }).sqlState === '23505') {
      return fail('Email or wallet already registered', 409);
    }
    console.error('Wallet verification failed', e);
    return fail('Could not verify your wallet, please try again', 500);
  }
}
