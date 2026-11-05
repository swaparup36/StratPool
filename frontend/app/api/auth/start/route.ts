import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/src/prisma/db';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) ?? {};
  const mode = body.mode;
  const email = String(body.email ?? '').trim().toLowerCase();
  const firstName = String(body.firstName ?? '').trim();
  const lastName = String(body.lastName ?? '').trim();

  if (mode !== 'signup' && mode !== 'login') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }
  if (email.length > 254 || !EMAIL.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  if (mode === 'signup' && (!firstName || !lastName)) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (firstName.length > 100 || lastName.length > 100) {
    return NextResponse.json({ error: 'Name is too long' }, { status: 400 });
  }

  const user = await db.orm.public.User.where({ email }).first();

  if (mode === 'login' && !user) {
    return NextResponse.json(
      { error: 'No account found with this email. Please sign up.' },
      { status: 404 }
    );
  }

  const session = await getSession();
  session.pending = { mode, email, firstName, lastName };
  await session.save();

  return NextResponse.json({ exists: !!user });
}