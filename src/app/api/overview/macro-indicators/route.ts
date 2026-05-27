import { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import type {
  IndicatorDisplayMeta,
  MacroIndicator,
} from '@/types/macro-indicator';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// 5분간 메모리 캐시. realtime 지표가 15분 단위로 갱신되니 그 절반 정도가 적절.
const REVALIDATE_SECONDS = 60 * 5;

const getMacroIndicators = unstable_cache(
  async (): Promise<MacroIndicator[]> => {
    const rows = await prisma.indicator.findMany({
      where: { displayMeta: { not: Prisma.DbNull } },
    });

    const items: MacroIndicator[] = rows
      .filter((r) => r.displayMeta !== null)
      .map((r) => ({
        indicatorId: r.id,
        source: r.source,
        frequency: r.frequency as MacroIndicator['frequency'],
        category: r.category,
        observationDate: r.observationDate,
        value: r.value,
        previousValue: r.previousValue,
        prevPreviousValue: r.prevPreviousValue,
        change: r.change,
        changePercent: r.changePercent,
        displayMeta: r.displayMeta as unknown as IndicatorDisplayMeta,
        nextReleaseDate: r.nextReleaseDate,
        releasedAt: r.releasedAt ? r.releasedAt.toISOString() : null,
        updatedAt: r.updatedAt.toISOString(),
      }));

    return items;
  },
  ['macro-indicators-v4'],
  { revalidate: REVALIDATE_SECONDS, tags: ['macro-indicators'] },
);

export async function GET() {
  try {
    const items = await getMacroIndicators();
    return NextResponse.json(items);
  } catch (error) {
    console.error('[MACRO_INDICATORS] failed:', error);
    return NextResponse.json({ message: '지표 조회 실패' }, { status: 500 });
  }
}
