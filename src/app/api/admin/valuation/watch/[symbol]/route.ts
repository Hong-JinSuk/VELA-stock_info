import { requireAdmin } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/admin/valuation/watch/[symbol] — "섹터 미지정" 관리 대상에서 제거(ADMIN).
// 제거 후 이 종목이 즐겨찾기·섹터 어디에도 안 걸려 있으면 배치가 더 이상 갱신하지 않으므로,
// 남으면 stale해지는 StockValuation 스냅샷도 같이 정리한다(즐겨찾기/섹터에 걸려 있으면 보존).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();

  await prisma.valuationWatch.deleteMany({ where: { symbol } });

  const [fav, sectorItem] = await Promise.all([
    prisma.favorite.findFirst({
      where: { type: 'STOCK', itemKey: symbol },
      select: { id: true },
    }),
    prisma.analysisSectorItem.findFirst({
      where: { symbol },
      select: { id: true },
    }),
  ]);
  if (!fav && !sectorItem) {
    await prisma.stockValuation.deleteMany({ where: { symbol } });
  }

  return NextResponse.json({ symbol });
}
