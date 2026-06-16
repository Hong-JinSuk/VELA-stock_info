import prisma from '@/lib/prisma';
import type {
  ThirteenFListItem,
  ThirteenFListSummary,
  ThirteenFTopHolding,
  ThirteenFTopSector,
  ThirteenFTopTrade,
} from '@/types/thirteenf';
import { Prisma } from '@/generated/prisma/client';
import { type NextRequest, NextResponse } from 'next/server';

// 즐겨찾기 등 "특정 filer(cik) 집합"을 13F 리스트 행 형태로 받는 엔드포인트.
// 13F 리스트(route.ts)의 행 빌드 로직과 동일하게 최신 분기(없으면 마지막 분기) summary + AUM 추이를 채운다.
// bounded(즐겨찾기 한도) 목록이라 페이지네이션 없이 bare array.

const TREND_MAX_POINTS = 12;
const MAX_CIKS = 200;

const SUMMARY_SELECT = {
  cik: true,
  accession: true,
  fileDate: true,
  periodEnding: true,
  aumUsd: true,
  qoqPercent: true,
  holdingCount: true,
  topSectors: true,
  topHoldings: true,
  topBuys: true,
  topSells: true,
} satisfies Prisma.ThirteenFSummarySelect;

type SummaryRow = Prisma.ThirteenFSummaryGetPayload<{
  select: typeof SUMMARY_SELECT;
}>;

function toListSummary(r: SummaryRow, trend: number[]): ThirteenFListSummary {
  return {
    aumUsd: Number(r.aumUsd),
    qoqPercent: r.qoqPercent,
    holdingCount: r.holdingCount,
    topSectors: (r.topSectors as unknown as ThirteenFTopSector[]) ?? [],
    topHoldings: (r.topHoldings as unknown as ThirteenFTopHolding[]) ?? [],
    topBuys: (r.topBuys as unknown as ThirteenFTopTrade[]) ?? [],
    topSells: (r.topSells as unknown as ThirteenFTopTrade[]) ?? [],
    trend: trend.slice(-TREND_MAX_POINTS),
  };
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('ciks') ?? '';
  const ciks = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_CIKS);
  if (ciks.length === 0) return NextResponse.json([]);

  try {
    // 전체 최신 분기 — 이 분기 summary면 "최신"이라 summaryAsOf 라벨 생략.
    const latest = await prisma.thirteenFSummary.findFirst({
      orderBy: { periodEnding: 'desc' },
      select: { periodEnding: true },
    });
    const period = latest?.periodEnding ?? '';

    const filers = await prisma.thirteenFFiler.findMany({
      where: { cik: { in: ciks } },
      select: {
        cik: true,
        name: true,
        krName: true,
        lastFiledDate: true,
        latestAccession: true,
        summaries: {
          orderBy: { periodEnding: 'desc' },
          take: 1,
          select: SUMMARY_SELECT,
        },
      },
    });

    const summarizedCiks = filers
      .filter((f) => f.summaries.length > 0)
      .map((f) => f.cik);
    const aumPoints =
      summarizedCiks.length > 0
        ? await prisma.thirteenFAumPoint.findMany({
            where: { cik: { in: summarizedCiks } },
            orderBy: { periodEnding: 'asc' },
            select: { cik: true, aumUsd: true },
          })
        : [];
    const trendByCik = new Map<string, number[]>();
    for (const p of aumPoints) {
      const arr = trendByCik.get(p.cik) ?? [];
      arr.push(Number(p.aumUsd));
      trendByCik.set(p.cik, arr);
    }

    // 입력 cik 순서를 유지해 반환 (즐겨찾기 정렬과 일치).
    const byCik = new Map(filers.map((f) => [f.cik, f]));
    const items: ThirteenFListItem[] = [];
    for (const cik of ciks) {
      const f = byCik.get(cik);
      if (!f) continue;
      const s = f.summaries[0];
      if (!s) {
        items.push({
          accession: f.latestAccession ?? '',
          cik: f.cik,
          filerName: f.name,
          krName: f.krName,
          fileDate: f.lastFiledDate,
          summary: null,
        });
        continue;
      }
      items.push({
        accession: s.accession,
        cik: f.cik,
        filerName: f.name,
        krName: f.krName,
        fileDate: s.fileDate,
        periodEnding: s.periodEnding,
        // 최신 분기가 아니면 "YYYY Q# 기준" 라벨용.
        summaryAsOf: s.periodEnding !== period ? s.periodEnding : undefined,
        summary: toListSummary(s, trendByCik.get(f.cik) ?? []),
      });
    }
    return NextResponse.json(items);
  } catch (e) {
    console.error('[13F_BY_CIKS] failed:', e);
    const message = e instanceof Error ? e.message : 'DB query failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
