import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { canAccessLevel, type AccessLevel } from '@/types/user';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// 데이터 라우트 접근 검사. 막히면 NextResponse(에러) 반환, 통과면 null.
// key = Menu.key(기존 routeKey). minRole=GUEST면 비로그인도 통과. 행이 없으면 기본 FREE.
// 사용: const denied = await assertRouteAccess('analysis-sectors'); if (denied) return denied;
export async function assertRouteAccess(
  key: string,
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  const level: AccessLevel = (session?.user?.role as AccessLevel) ?? 'GUEST';

  const row = await prisma.menu.findUnique({
    where: { key },
    select: { minRole: true },
  });
  const minRole = (row?.minRole as AccessLevel) ?? 'FREE';

  if (!canAccessLevel(level, minRole)) {
    // 비로그인이면 401(로그인 유도), 로그인했지만 등급 부족이면 403.
    return session
      ? NextResponse.json({ message: '접근 권한이 없습니다.' }, { status: 403 })
      : NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  return null;
}
