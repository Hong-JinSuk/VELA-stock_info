import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/overview/key-indicators — 경제지표 페이지 상단에 노출할 중요 지표 ID 목록.
// 작게 capped된 고정 세트(자를 게 없음)라 envelope 없이 bare string[] 로 반환.
// sortOrder 오름차순. 카드 데이터는 클라가 macro-indicators에서 join.
export async function GET() {
  try {
    const rows = await prisma.keyIndicator.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { indicatorId: true },
    });
    return NextResponse.json(rows.map((r) => r.indicatorId));
  } catch (error) {
    console.error('[KEY_INDICATORS] failed:', error);
    return NextResponse.json({ message: '중요 지표 조회 실패' }, { status: 500 });
  }
}
