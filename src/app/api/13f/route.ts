import { paginatedResponse } from '@/lib/api/pagination';
import prisma from '@/lib/prisma';
import type {
  ThirteenFListItem,
  ThirteenFListResponse,
  ThirteenFTopHolding,
  ThirteenFTopSector,
  ThirteenFTopTrade,
} from '@/types/thirteenf';
import { Prisma } from '@/generated/prisma/client';
import { type NextRequest, NextResponse } from 'next/server';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
// sparkline에 넘길 AUM 시계열 최대 길이 (오래된 분기는 잘라 payload 절약).
const TREND_MAX_POINTS = 12;

// 하이브리드 리스트:
//  - tier1(리치): 최신 분기 ThirteenFSummary 보유 filer → AUM desc. AUM/Q/Q/holdings/top들/trend 채움.
//  - tier2(나머지): summary 없는 filer(예: 국민연금·JPM 등 대형/미집계) → lastFiledDate desc, 리치 셀은 null.
// tier1을 먼저, 그다음 tier2를 이어붙여 페이지네이션 → 풍성함 + 전체 커버리지 둘 다.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const entityName = (sp.get('searchKey') ?? '').trim();
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10));
  const size = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(sp.get('size') ?? `${DEFAULT_PAGE_SIZE}`, 10)),
  );

  try {
    const latest = await prisma.thirteenFSummary.findFirst({
      orderBy: { periodEnding: 'desc' },
      select: { periodEnding: true },
    });
    const period = latest?.periodEnding ?? '';

    // tier1: 최신 분기 summary 보유
    const richWhere: Prisma.ThirteenFSummaryWhereInput = {
      periodEnding: period,
      ...(entityName
        ? { filer: { name: { contains: entityName, mode: 'insensitive' } } }
        : {}),
    };
    // tier2: 최신 분기 summary 없는 filer
    const restWhere: Prisma.ThirteenFFilerWhereInput = {
      latestAccession: { not: null },
      summaries: { none: { periodEnding: period } },
      ...(entityName
        ? { name: { contains: entityName, mode: 'insensitive' } }
        : {}),
    };

    const [richTotal, restTotal] = await Promise.all([
      period ? prisma.thirteenFSummary.count({ where: richWhere }) : 0,
      prisma.thirteenFFiler.count({ where: restWhere }),
    ]);
    const total = richTotal + restTotal;

    // 이 페이지가 두 tier에서 각각 몇 개씩 가져올지 계산 (tier1 먼저).
    const offset = (page - 1) * size;
    const richTake = Math.max(0, Math.min(size, richTotal - offset));
    const richSkip = Math.min(offset, richTotal);
    const restTake = size - richTake;
    const restSkip = Math.max(0, offset - richTotal);

    const [richRows, restRows] = await Promise.all([
      richTake > 0
        ? prisma.thirteenFSummary.findMany({
            where: richWhere,
            orderBy: { aumUsd: 'desc' },
            skip: richSkip,
            take: richTake,
            select: {
              cik: true,
              accession: true,
              fileDate: true,
              aumUsd: true,
              qoqPercent: true,
              holdingCount: true,
              topSectors: true,
              topHoldings: true,
              topBuys: true,
              topSells: true,
              filer: { select: { name: true } },
            },
          })
        : [],
      restTake > 0
        ? prisma.thirteenFFiler.findMany({
            where: restWhere,
            orderBy: [{ lastFiledDate: 'desc' }, { name: 'asc' }],
            skip: restSkip,
            take: restTake,
            select: {
              cik: true,
              name: true,
              lastFiledDate: true,
              latestAccession: true,
            },
          })
        : [],
    ]);

    // tier1 행들의 AUM 시계열(TREND).
    const richCiks = richRows.map((r) => r.cik);
    const aumPoints =
      richCiks.length > 0
        ? await prisma.thirteenFAumPoint.findMany({
            where: { cik: { in: richCiks } },
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

    const richItems: ThirteenFListItem[] = richRows.map((r) => ({
      accession: r.accession,
      cik: r.cik,
      filerName: r.filer?.name ?? '',
      fileDate: r.fileDate,
      periodEnding: period,
      summary: {
        aumUsd: Number(r.aumUsd),
        qoqPercent: r.qoqPercent,
        holdingCount: r.holdingCount,
        topSectors: (r.topSectors as unknown as ThirteenFTopSector[]) ?? [],
        topHoldings: (r.topHoldings as unknown as ThirteenFTopHolding[]) ?? [],
        topBuys: (r.topBuys as unknown as ThirteenFTopTrade[]) ?? [],
        topSells: (r.topSells as unknown as ThirteenFTopTrade[]) ?? [],
        trend: (trendByCik.get(r.cik) ?? []).slice(-TREND_MAX_POINTS),
      },
    }));

    const restItems: ThirteenFListItem[] = restRows.map((f) => ({
      accession: f.latestAccession ?? '',
      cik: f.cik,
      filerName: f.name,
      fileDate: f.lastFiledDate,
      summary: null,
    }));

    const response: ThirteenFListResponse = paginatedResponse(
      [...richItems, ...restItems],
      total,
      { page, size },
    );
    console.log(
      `[13F_LIST] q="${entityName}" period=${period} page=${page} rich=${richItems.length} rest=${restItems.length} total=${total}`,
    );
    return NextResponse.json(response);
  } catch (e) {
    console.error('[13F_LIST] failed:', e);
    const message = e instanceof Error ? e.message : 'DB query failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
