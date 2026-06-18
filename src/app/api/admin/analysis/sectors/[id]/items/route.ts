import { api } from '@/lib/api/axios';
import { requireAdmin } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { addSectorItemSchema } from '@/schemas/analysis-sector-schema';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/analysis/sectors/[id]/items — 종목/ETF 추가. ADMIN 전용.
// symbol은 StockSymbol에 존재해야 함(폴리모픽 관례: FK 대신 앱 검증).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { id: sectorId } = await params;
  const parsed = addSectorItemSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  const symbol = parsed.data.symbol.toUpperCase();
  const note = parsed.data.note;

  const sector = await prisma.analysisSector.findUnique({
    where: { id: sectorId },
    select: { id: true },
  });
  if (!sector) {
    return NextResponse.json(
      { message: '섹터를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  const stock = await prisma.stockSymbol.findUnique({
    where: { symbol },
    select: { symbol: true, type: true },
  });
  if (!stock) {
    return NextResponse.json(
      { message: '존재하지 않는 종목입니다.' },
      { status: 404 },
    );
  }

  const dup = await prisma.analysisSectorItem.findUnique({
    where: { sectorId_symbol: { sectorId, symbol } },
    select: { id: true },
  });
  if (dup) {
    return NextResponse.json(
      { message: '이미 추가된 종목입니다.' },
      { status: 409 },
    );
  }

  const count = await prisma.analysisSectorItem.count({ where: { sectorId } });
  const item = await prisma.analysisSectorItem.create({
    data: { sectorId, symbol, note: note ?? null, sortOrder: count },
  });

  // 신규 종목 우선: cron을 기다리지 않고 곧바로 적정주가 스냅샷(개별 종목만; ETF는 추정 불가).
  // 실패해도 추가 자체는 성공으로 둔다(다음 신선도-회전 배치가 채움).
  if (stock.type !== 'ETP') {
    try {
      await api.post(
        `${process.env.NEXT_PUBLIC_GEMINI_SERVER}/stocks-valuation-sync`,
        { symbols: [symbol] },
        { timeout: 20000 },
      );
    } catch (e) {
      console.error(
        '[SECTOR_ITEM] immediate valuation failed:',
        e instanceof Error ? e.message : e,
      );
    }
  }

  return NextResponse.json(
    { id: item.id, symbol: item.symbol, note: item.note, sortOrder: item.sortOrder },
    { status: 201 },
  );
}

// DELETE /api/admin/analysis/sectors/[id]/items?symbol=AAPL — 종목 제거. ADMIN 전용.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { id: sectorId } = await params;
  const symbol = req.nextUrl.searchParams.get('symbol')?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ message: 'symbol이 필요합니다.' }, { status: 400 });
  }

  await prisma.analysisSectorItem.deleteMany({ where: { sectorId, symbol } });
  return NextResponse.json({ symbol });
}
