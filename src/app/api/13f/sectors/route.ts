import prisma from '@/lib/prisma';
import type {
  ThirteenFSectorQuarter,
  ThirteenFTopSector,
} from '@/types/thirteenf';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

// 섹터 배분은 배치(gemini-server)가 분기마다 갱신 → 6시간 캐시.
const CACHE_SECONDS = 60 * 60 * 6;
// 차트는 최근 N분기만 표시 (WhaleWisdom 무료도 4분기 제한).
const QUARTERS = 4;

// filer(cik)의 최근 N분기 섹터 배분을 분기별로 묶어 과거→현재(좌→우) 순으로 반환.
const getSectors = unstable_cache(
  async (cik: string): Promise<ThirteenFSectorQuarter[]> => {
    const rows = await prisma.thirteenFSectorPoint.findMany({
      where: { cik },
      orderBy: [{ periodEnding: 'desc' }],
    });

    const byPeriod = new Map<string, ThirteenFTopSector[]>();
    for (const r of rows) {
      const entry = { sector: r.sector, weightPercent: r.weightPercent };
      const list = byPeriod.get(r.periodEnding);
      if (list) list.push(entry);
      else byPeriod.set(r.periodEnding, [entry]);
    }

    // 최근 N분기만 추린 뒤, 차트 x축이 과거→현재라 오름차순으로 반환.
    return Array.from(byPeriod.keys())
      .sort((a, b) => (a < b ? 1 : -1))
      .slice(0, QUARTERS)
      .sort((a, b) => (a < b ? -1 : 1))
      .map((periodEnding) => ({
        periodEnding,
        sectors: byPeriod.get(periodEnding)!,
      }));
  },
  ['13f-sectors-v1'],
  { revalidate: CACHE_SECONDS, tags: ['13f-sectors'] },
);

export async function GET(req: NextRequest) {
  const cik = new URL(req.url).searchParams.get('cik');
  if (!cik || !/^\d{10}$/.test(cik)) {
    return NextResponse.json({ message: 'invalid cik' }, { status: 400 });
  }
  try {
    const items = await getSectors(cik);
    return NextResponse.json(items);
  } catch (e) {
    console.error('[13F_SECTORS] failed:', e);
    return NextResponse.json({ message: '섹터 조회 실패' }, { status: 500 });
  }
}
