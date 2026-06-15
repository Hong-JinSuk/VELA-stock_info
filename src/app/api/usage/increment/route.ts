import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getNextCycleEnd } from '@/types/user';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { message: '유저 ID를 찾을 수 없습니다.' },
        { status: 400 },
      );
    }

    const existing = await prisma.userUsage.findUnique({ where: { userId } });
    if (!existing) {
      return NextResponse.json(
        { message: '사용량 정보를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 주기 만료 시 리셋 후 새 주기로 increment
    const now = new Date();
    if (existing.cycleEnd < now) {
      const role = session.user.role ?? 'FREE';
      const usage = await prisma.userUsage.update({
        where: { userId },
        data: {
          usedCount: 1,
          cycleStart: existing.cycleEnd,
          cycleEnd: getNextCycleEnd(role, existing.cycleEnd),
        },
      });
      return NextResponse.json({
        usedCount: usage.usedCount,
        maxLimit: usage.maxLimit,
      });
    }

    const usage = await prisma.userUsage.update({
      where: { userId },
      data: { usedCount: { increment: 1 } },
    });

    return NextResponse.json({
      usedCount: usage.usedCount,
      maxLimit: usage.maxLimit,
    });
  } catch (error) {
    console.error('Usage increment error:', error);
    return NextResponse.json(
      { message: '사용량 업데이트에 실패했습니다.' },
      { status: 500 },
    );
  }
}
