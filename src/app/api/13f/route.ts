import { PRIORITY_FILLINGS } from '@/constants/13f-priority';
import { paginatedResponse } from '@/lib/api/pagination';
import prisma from '@/lib/prisma';
import type {
  ThirteenFListItem,
  ThirteenFListResponse,
  ThirteenFListSummary,
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

const SUMMARY_SELECT = {
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

// 하이브리드 리스트:
//  - tier0(고정): PRIORITY_FILLINGS(버크셔·국민연금·JP모건)를 order 순으로 항상 최상단 노출.
//    검색 중에는 미적용, 일반 tier에서는 제외해 중복 방지. summary 있으면 리치 셀까지 채움.
//  - tier1(리치): 최신 분기 ThirteenFSummary 보유 filer → AUM desc. AUM/Q/Q/holdings/top들/trend 채움.
//  - tier2(나머지): 최신 분기 summary 없는 filer → lastFiledDate desc, 리치 셀은 null.
// tier0 → tier1 → tier2를 이어붙여 페이지네이션 → 고정 노출 + 풍성함 + 전체 커버리지.
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

    // tier0 대상 cik. 검색 중에는 핀 고정을 끄고 일반 검색 결과에 맡긴다.
    const priorityCiks = entityName ? [] : PRIORITY_FILLINGS.map((p) => p.cik);

    // tier1: 최신 분기 summary 보유 (tier0 제외)
    const richWhere: Prisma.ThirteenFSummaryWhereInput = {
      periodEnding: period,
      ...(priorityCiks.length ? { cik: { notIn: priorityCiks } } : {}),
      ...(entityName
        ? { filer: { name: { contains: entityName, mode: 'insensitive' } } }
        : {}),
    };
    // tier2: 최신 분기 summary 없는 filer (tier0 제외)
    const restWhere: Prisma.ThirteenFFilerWhereInput = {
      latestAccession: { not: null },
      summaries: { none: { periodEnding: period } },
      ...(priorityCiks.length ? { cik: { notIn: priorityCiks } } : {}),
      ...(entityName
        ? { name: { contains: entityName, mode: 'insensitive' } }
        : {}),
    };

    const [richTotal, restTotal, priorityFilers, prioritySummaries] =
      await Promise.all([
        period ? prisma.thirteenFSummary.count({ where: richWhere }) : 0,
        prisma.thirteenFFiler.count({ where: restWhere }),
        priorityCiks.length > 0
          ? prisma.thirteenFFiler.findMany({
              where: { cik: { in: priorityCiks } },
              select: {
                cik: true,
                name: true,
                krName: true,
                lastFiledDate: true,
                latestAccession: true,
              },
            })
          : [],
        priorityCiks.length > 0 && period
          ? prisma.thirteenFSummary.findMany({
              where: { cik: { in: priorityCiks }, periodEnding: period },
              select: SUMMARY_SELECT,
            })
          : [],
      ]);

    // tier0은 order 오름차순 고정 정렬 (DB에 없는 cik는 자연히 빠짐).
    const orderByCik = new Map(PRIORITY_FILLINGS.map((p) => [p.cik, p.order]));
    priorityFilers.sort(
      (a, b) => (orderByCik.get(a.cik) ?? 0) - (orderByCik.get(b.cik) ?? 0),
    );
    const total = priorityFilers.length + richTotal + restTotal;

    // 이 페이지가 세 tier에서 각각 몇 개씩 가져올지 계산 (tier0 → tier1 → tier2 순).
    const offset = (page - 1) * size;
    const priorityTake = Math.max(
      0,
      Math.min(size, priorityFilers.length - offset),
    );
    const prioritySkip = Math.min(offset, priorityFilers.length);
    const tierOffset = Math.max(0, offset - priorityFilers.length);
    const tierSize = size - priorityTake;
    const richTake = Math.max(0, Math.min(tierSize, richTotal - tierOffset));
    const richSkip = Math.min(tierOffset, richTotal);
    const restTake = tierSize - richTake;
    const restSkip = Math.max(0, tierOffset - richTotal);

    const [richRows, restRows] = await Promise.all([
      richTake > 0
        ? prisma.thirteenFSummary.findMany({
            where: richWhere,
            orderBy: { aumUsd: 'desc' },
            skip: richSkip,
            take: richTake,
            select: {
              ...SUMMARY_SELECT,
              filer: { select: { name: true, krName: true } },
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
              krName: true,
              lastFiledDate: true,
              latestAccession: true,
            },
          })
        : [],
    ]);

    const pagePriority = priorityFilers.slice(
      prioritySkip,
      prioritySkip + priorityTake,
    );
    const prioritySummaryByCik = new Map(
      prioritySummaries.map((s) => [s.cik, s]),
    );

    // 리치 행(tier0 + tier1)의 AUM 시계열(TREND).
    const richCiks = [
      ...pagePriority
        .filter((f) => prioritySummaryByCik.has(f.cik))
        .map((f) => f.cik),
      ...richRows.map((r) => r.cik),
    ];
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

    const priorityItems: ThirteenFListItem[] = pagePriority.map((f) => {
      const s = prioritySummaryByCik.get(f.cik);
      if (!s) {
        return {
          accession: f.latestAccession ?? '',
          cik: f.cik,
          filerName: f.name,
          krName: f.krName,
          fileDate: f.lastFiledDate,
          summary: null,
        };
      }
      return {
        accession: s.accession,
        cik: f.cik,
        filerName: f.name,
        krName: f.krName,
        fileDate: s.fileDate,
        periodEnding: period,
        summary: toListSummary(s, trendByCik.get(f.cik) ?? []),
      };
    });

    const richItems: ThirteenFListItem[] = richRows.map((r) => ({
      accession: r.accession,
      cik: r.cik,
      filerName: r.filer?.name ?? '',
      krName: r.filer?.krName ?? null,
      fileDate: r.fileDate,
      periodEnding: period,
      summary: toListSummary(r, trendByCik.get(r.cik) ?? []),
    }));

    const restItems: ThirteenFListItem[] = restRows.map((f) => ({
      accession: f.latestAccession ?? '',
      cik: f.cik,
      filerName: f.name,
      krName: f.krName,
      fileDate: f.lastFiledDate,
      summary: null,
    }));

    const response: ThirteenFListResponse = paginatedResponse(
      [...priorityItems, ...richItems, ...restItems],
      total,
      { page, size },
    );
    console.log(
      `[13F_LIST] q="${entityName}" period=${period} page=${page} pri=${priorityItems.length} rich=${richItems.length} rest=${restItems.length} total=${total}`,
    );
    return NextResponse.json(response);
  } catch (e) {
    console.error('[13F_LIST] failed:', e);
    const message = e instanceof Error ? e.message : 'DB query failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
