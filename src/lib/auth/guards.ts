import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserRole } from '@/types/user';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// API route용 ADMIN 가드. 통과하면 { ok:true, userId }, 막히면 { ok:false, res }.
// 사용: const g = await requireAdmin(); if (!g.ok) return g.res;
export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; res: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false,
      res: NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
    };
  }
  if (((session.user.role ?? 'FREE') as UserRole) !== 'ADMIN') {
    return {
      ok: false,
      res: NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 }),
    };
  }
  return { ok: true, userId: session.user.id };
}

// API route용 로그인 가드. 통과하면 { ok:true, userId }, 막히면 { ok:false, res }.
// 사용: const g = await requireUser(); if (!g.ok) return g.res;
export async function requireUser(): Promise<
  { ok: true; userId: string } | { ok: false; res: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false,
      res: NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
    };
  }
  return { ok: true, userId: session.user.id };
}
