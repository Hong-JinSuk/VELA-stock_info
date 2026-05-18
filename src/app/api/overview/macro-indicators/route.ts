import { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import type {
  IndicatorDisplayMeta,
  MacroIndicator,
} from '@/types/macro-indicator';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// 5분간 메모리 캐시. realtime 지표가 15분 단위로 갱신되니 그 절반 정도가 적절.
// React Query가 mount마다 fetch해도 서버는 5분에 한 번만 DB hit.
const REVALIDATE_SECONDS = 60 * 5;

const getMacroIndicators = unstable_cache(
  async (): Promise<MacroIndicator[]> => {
    // 1) 각 indicatorId의 최신 dateKey (1 query, SQL GROUP BY)
    const latest = await prisma.indicatorSnapshot.groupBy({
      by: ['indicatorId'],
      where: { displayMeta: { not: Prisma.DbNull } },
      _max: { dateKey: true },
    });

    const conditions = latest
      .filter((l) => l._max.dateKey !== null)
      .map((l) => ({ indicatorId: l.indicatorId, dateKey: l._max.dateKey! }));

    if (conditions.length === 0) return [];

    // 2) (indicatorId, dateKey) 정확 매칭으로 한 번에 (1 query, OR -> IN)
    const rows = await prisma.indicatorSnapshot.findMany({
      where: { OR: conditions },
    });

    const items: MacroIndicator[] = rows
      .filter((r) => r.displayMeta !== null)
      .map((r) => ({
        indicatorId: r.indicatorId,
        source: r.source,
        frequency: r.frequency as 'realtime' | 'daily',
        dateKey: r.dateKey,
        observationDate: r.observationDate,
        value: r.value,
        previousValue: r.previousValue,
        change: r.change,
        changePercent: r.changePercent,
        displayMeta: r.displayMeta as unknown as IndicatorDisplayMeta,
        nextReleaseDate: r.nextReleaseDate,
        updatedAt: r.updatedAt.toISOString(),
      }));

    // realtime 먼저, 같은 그룹 내에선 cardName ASC
    items.sort((a, b) => {
      if (a.frequency !== b.frequency) return a.frequency === 'realtime' ? -1 : 1;
      return a.displayMeta.cardName.localeCompare(b.displayMeta.cardName, 'ko');
    });

    return items;
  },
  ['macro-indicators-v2'],
  { revalidate: REVALIDATE_SECONDS, tags: ['macro-indicators'] },
);

export async function GET() {
  const items = await getMacroIndicators();
  return NextResponse.json(items);
}
