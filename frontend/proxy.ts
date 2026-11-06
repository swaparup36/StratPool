import { getIronSession } from 'iron-session';
import { NextResponse, type NextRequest } from 'next/server';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function proxy(req: NextRequest) {
  const session = await getIronSession<SessionData>(req.cookies as never, sessionOptions);
  if (session.userId) return NextResponse.next();
  return NextResponse.redirect(new URL('/sign-in', req.url));
}

export const config = { matcher: ['/strategies/:path*', '/investors/:path*'] };
