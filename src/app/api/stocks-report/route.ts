import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { loadValuations } from '@/lib/valuation/load-valuations';
import type { StockReportItem } from '@/types/stocks-report';
import { canUsePersonalization } from '@/types/user';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// GET /api/stocks-report — 내 즐겨찾기 종목 적정주가 보고서.
// gemini-server 배치가 StockValuation에 스냅샷을 박아두고, 여기선 DB만 읽는다(라이브 호출 0).
// 아직 스냅샷이 없는 즐겨찾기 종목은 status='PENDING'(새벽 배치 전).
// bounded(티어 한도) 목록이라 페이지네이션 없이 bare array로 반환 (/api/favorites 관례).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const role = session.user.role ?? 'FREE';
  if (!canUsePersonalization(role)) {
    return NextResponse.json(
      { message: '종목 보고서는 유료 플랜에서 사용할 수 있어요.' },
      { status: 403 },
    );
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id, type: 'STOCK' },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: { itemKey: true, label: true },
  });

  const items: StockReportItem[] = await loadValuations(
    favorites.map((f) => ({ symbol: f.itemKey, label: f.label })),
  );
  return NextResponse.json(items);
}
