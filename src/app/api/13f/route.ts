import { PRIORITY_FILLINGS } from '@/constants/13f-priority';
import prisma from '@/lib/prisma';
import type {
  ThirteenFListItem,
  ThirteenFListResponse,
} from '@/types/thirteenf';
import { Prisma } from '@/generated/prisma/client';
import { type NextRequest, NextResponse } from 'next/server';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type FilerRow = {
  cik: string;
  name: string;
  lastFiledDate: string;
  latestAccession: string | null;
};

function toListItem(f: FilerRow): ThirteenFListItem {
  return {
    accession: f.latestAccession ?? '',
    cik: f.cik,
    filerName: f.name,
    fileDate: f.lastFiledDate,
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const entityName = (sp.get('q') ?? '').trim();
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(sp.get('size') ?? `${DEFAULT_PAGE_SIZE}`, 10)),
  );

  try {
    if (entityName) {
      // 검색 모드: 이름 부분일치, lastFiledDate desc.
      const where: Prisma.ThirteenFFilerWhereInput = {
        name: { contains: entityName, mode: 'insensitive' },
        latestAccession: { not: null },
      };
      const [total, rows] = await Promise.all([
        prisma.thirteenFFiler.count({ where }),
        prisma.thirteenFFiler.findMany({
          where,
          orderBy: [{ lastFiledDate: 'desc' }, { name: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            cik: true,
            name: true,
            lastFiledDate: true,
            latestAccession: true,
          },
        }),
      ]);

      const response: ThirteenFListResponse = {
        items: rows.map(toListItem),
        total,
        page,
        pageSize,
      };
      console.log(
        `[13F_LIST] q="${entityName}" page=${page} returned=${rows.length} total=${total}`,
      );
      return NextResponse.json(response);
    }

    // 기본 모드: priority filer 먼저, 그다음 lastFiledDate desc로 페이지네이션.
    const priorityCiks = PRIORITY_FILLINGS.map((p) => p.cik);
    const priorityOrder = new Map(
      PRIORITY_FILLINGS.map((p, idx) => [p.cik, { order: p.order, idx }]),
    );

    const baseWhere: Prisma.ThirteenFFilerWhereInput = {
      latestAccession: { not: null },
    };
    const nonPriorityWhere: Prisma.ThirteenFFilerWhereInput = {
      ...baseWhere,
      cik: { notIn: priorityCiks },
    };

    const priorityRows =
      page === 1
        ? await prisma.thirteenFFiler.findMany({
            where: { ...baseWhere, cik: { in: priorityCiks } },
            select: {
              cik: true,
              name: true,
              lastFiledDate: true,
              latestAccession: true,
            },
          })
        : [];

    // priority 정렬: PRIORITY_FILLINGS의 order, 같으면 배열 순.
    const orderedPriority = priorityRows.slice().sort((a, b) => {
      const oa = priorityOrder.get(a.cik) ?? { order: 999, idx: 999 };
      const ob = priorityOrder.get(b.cik) ?? { order: 999, idx: 999 };
      if (oa.order !== ob.order) return oa.order - ob.order;
      return oa.idx - ob.idx;
    });

    // page=1에서는 priority 만큼 일반 결과를 덜 가져옴.
    const priorityCount = orderedPriority.length;
    const remainingSlots = Math.max(0, pageSize - priorityCount);
    const skip =
      page === 1 ? 0 : (page - 1) * pageSize - priorityCount;

    const [nonPriorityTotal, nonPriorityRows] = await Promise.all([
      prisma.thirteenFFiler.count({ where: nonPriorityWhere }),
      prisma.thirteenFFiler.findMany({
        where: nonPriorityWhere,
        orderBy: [{ lastFiledDate: 'desc' }, { name: 'asc' }],
        skip,
        take: page === 1 ? remainingSlots : pageSize,
        select: {
          cik: true,
          name: true,
          lastFiledDate: true,
          latestAccession: true,
        },
      }),
    ]);

    const items: ThirteenFListItem[] = [
      ...orderedPriority.map(toListItem),
      ...nonPriorityRows.map(toListItem),
    ];

    const response: ThirteenFListResponse = {
      items,
      total: nonPriorityTotal + priorityCount,
      page,
      pageSize,
    };
    console.log(
      `[13F_LIST] page=${page} returned=${items.length} total=${response.total}`,
    );
    return NextResponse.json(response);
  } catch (e) {
    console.error('[13F_LIST] failed:', e);
    const message = e instanceof Error ? e.message : 'DB query failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
