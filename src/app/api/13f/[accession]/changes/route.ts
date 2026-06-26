import { loadFullComparison } from '@/app/api/13f/[accession]/comparison/route';
import { searchKrTickers } from '@/constants/stock-korean-names';
import { paginatedResponse, readPagination } from '@/lib/api/pagination';
import type { ThirteenFChangeRow } from '@/types/thirteenf';
import { type NextRequest, NextResponse } from 'next/server';

// buys/sells/holds 전체 목록을 서버 페이지네이션으로 제공 (전체보기 모달용).
// 전체 diff는 cachedLoadDetail(SEC 캐시) 위에서 재계산 — 7,000행 filer도 페이지당만 잘라 전송.
const TYPES = ['buy', 'sell', 'hold'] as const;
type ChangeType = (typeof TYPES)[number];

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ accession: string }> },
) {
  const { accession } = await ctx.params;
  if (!/^\d{10}-\d{2}-\d{6}$/.test(accession)) {
    return NextResponse.json({ message: 'invalid accession' }, { status: 400 });
  }
  const sp = new URL(req.url).searchParams;
  const type = sp.get('type') as ChangeType | null;
  if (!type || !TYPES.includes(type)) {
    return NextResponse.json({ message: 'invalid type' }, { status: 400 });
  }
  // 종목명/티커/CUSIP 부분일치 검색 (대소문자 무시). 비면 전체.
  const searchKey = (sp.get('searchKey') ?? '').trim().toLowerCase();
  const pagination = readPagination(sp);

  try {
    const full = await loadFullComparison(accession);
    if (!full) {
      return NextResponse.json({ message: 'not found' }, { status: 404 });
    }
    let rows: ThirteenFChangeRow[] =
      type === 'buy' ? full.buys : type === 'sell' ? full.sells : full.holds;
    if (searchKey) {
      // 한글 쿼리면 정적 한국어명 맵으로 티커 후보를 뽑아 함께 매칭 (영문 입력이면 빈 배열).
      const krTickers = new Set(searchKrTickers(searchKey));
      rows = rows.filter(
        (r) =>
          r.nameOfIssuer.toLowerCase().includes(searchKey) ||
          (r.ticker?.toLowerCase().includes(searchKey) ?? false) ||
          r.cusip.toLowerCase().includes(searchKey) ||
          (r.ticker !== null && krTickers.has(r.ticker)),
      );
    }

    if (!pagination) {
      return NextResponse.json(paginatedResponse(rows, rows.length, null));
    }
    const start = (pagination.page - 1) * pagination.size;
    const items = rows.slice(start, start + pagination.size);
    return NextResponse.json(paginatedResponse(items, rows.length, pagination));
  } catch (e) {
    console.error(`[13F_CHANGES] failed accession=${accession}:`, e);
    const message = e instanceof Error ? e.message : 'SEC fetch failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
