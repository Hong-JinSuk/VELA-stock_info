import { cachedLoadDetail } from '@/app/api/13f/[accession]/route';
import { secFetchJson } from '@/lib/api/sec-edgar';
import type {
  ThirteenFChangeRow,
  ThirteenFComparison,
  ThirteenFDetail,
  ThirteenFHolding,
} from '@/types/thirteenf';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

// submissions JSON은 새 filing이 추가될 수 있어 짧지도 길지도 않은 캐시. 6시간.
const SUBMISSIONS_CACHE = 60 * 60 * 6;
// 비교 결과는 두 filing 모두 immutable이라 길게 (24시간).
const COMPARISON_CACHE = 60 * 60 * 24;
// 각 buys/sells/holds 배열 전송 상한. 화면은 top-5 미리보기 + 개수만 쓰므로 넉넉히 50.
const COMPARISON_ROW_CAP = 50;

type SubmissionsJson = {
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
    };
  };
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ accession: string }> },
) {
  const { accession } = await ctx.params;
  if (!/^\d{10}-\d{2}-\d{6}$/.test(accession)) {
    return NextResponse.json({ message: 'invalid accession' }, { status: 400 });
  }
  try {
    const result = await cachedLoadComparison(accession);
    if (!result) {
      console.warn(`[13F_COMPARISON] not found accession=${accession}`);
      return NextResponse.json({ message: 'not found' }, { status: 404 });
    }
    console.log(
      `[13F_COMPARISON] loaded accession=${accession} buys=${result.buys.length} sells=${result.sells.length} holds=${result.holds.length}`,
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error(`[13F_COMPARISON] failed accession=${accession}:`, e);
    const message = e instanceof Error ? e.message : 'SEC fetch failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}

async function fetchSubmissions(cik: string): Promise<SubmissionsJson> {
  const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
  return secFetchJson<SubmissionsJson>(url);
}

const cachedSubmissions = unstable_cache(
  fetchSubmissions,
  ['13f-submissions-v1'],
  {
    revalidate: SUBMISSIONS_CACHE,
  },
);

// 같은 CIK의 13F-HR 중 currentAccession 직전 filing (file date 기준 바로 이전).
async function findPreviousAccession(
  cik: string,
  currentAccession: string,
): Promise<{ accession: string } | null> {
  const subs = await cachedSubmissions(cik);
  const { accessionNumber, form } = subs.filings.recent;
  // recent는 filingDate desc 순서. 13F-HR만 필터해서 currentAccession 직후 항목이 직전 filing.
  const thirteenFIndices = form
    .map((f, i) => (f === '13F-HR' ? i : -1))
    .filter((i) => i !== -1);
  const idxInList = thirteenFIndices.findIndex(
    (i) => accessionNumber[i] === currentAccession,
  );
  if (idxInList === -1) return null;
  const prevPos = thirteenFIndices[idxInList + 1];
  if (prevPos === undefined) return null;
  return { accession: accessionNumber[prevPos] };
}

// CUSIP 기준으로 join (같은 종목의 multi-row는 사전 합산).
function aggregateByCusip(
  holdings: ThirteenFHolding[],
): Map<string, { name: string; ticker: string | null; valueUsd: number }> {
  const map = new Map<
    string,
    { name: string; ticker: string | null; valueUsd: number }
  >();
  for (const h of holdings) {
    const existing = map.get(h.cusip);
    if (existing) {
      existing.valueUsd += h.valueUsd;
      // ticker는 한 종목이라 동일. 누락된 경우만 채움.
      if (!existing.ticker && h.ticker) existing.ticker = h.ticker;
    } else {
      map.set(h.cusip, {
        name: h.nameOfIssuer,
        ticker: h.ticker,
        valueUsd: h.valueUsd,
      });
    }
  }
  return map;
}

function buildComparisonRows(
  current: ThirteenFDetail,
  previous: ThirteenFDetail | null,
): {
  buys: ThirteenFChangeRow[];
  sells: ThirteenFChangeRow[];
  holds: ThirteenFChangeRow[];
} {
  const currMap = aggregateByCusip(current.holdings);
  const prevMap = previous ? aggregateByCusip(previous.holdings) : new Map();
  const currTotal = Array.from(currMap.values()).reduce(
    (s, v) => s + v.valueUsd,
    0,
  );

  const allCusips = new Set([...currMap.keys(), ...prevMap.keys()]);
  const rows: ThirteenFChangeRow[] = Array.from(allCusips).map((cusip) => {
    const curr = currMap.get(cusip);
    const prev = prevMap.get(cusip);
    const currVal = curr?.valueUsd ?? 0;
    const prevVal = prev?.valueUsd ?? 0;
    const delta = currVal - prevVal;
    const deltaPercent = prevVal > 0 ? (delta / prevVal) * 100 : null;
    return {
      cusip,
      ticker: curr?.ticker ?? prev?.ticker ?? null,
      nameOfIssuer: curr?.name ?? prev?.name ?? '',
      previousValueUsd: prevVal,
      currentValueUsd: currVal,
      deltaValueUsd: delta,
      deltaPercent,
      weightPercent: currTotal > 0 ? (currVal / currTotal) * 100 : 0,
    };
  });

  // 전체 정렬된 배열 반환. 클라이언트가 slice / 페이지네이션 자유롭게 처리.
  const buys = rows
    .filter((r) => r.deltaValueUsd > 0)
    .sort((a, b) => b.deltaValueUsd - a.deltaValueUsd);
  const sells = rows
    .filter((r) => r.deltaValueUsd < 0)
    .sort((a, b) => a.deltaValueUsd - b.deltaValueUsd);
  const holds = rows
    .filter((r) => r.currentValueUsd > 0)
    .sort((a, b) => b.currentValueUsd - a.currentValueUsd);

  return { buys, sells, holds };
}

async function loadComparison(
  accession: string,
): Promise<ThirteenFComparison | null> {
  const current = await cachedLoadDetail(accession);
  if (!current) return null;

  const prev = await findPreviousAccession(current.cik, accession);
  const previousDetail = prev ? await cachedLoadDetail(prev.accession) : null;

  const { buys, sells, holds } = buildComparisonRows(current, previousDetail);

  return {
    current: {
      accession: current.accession,
      fileDate: current.fileDate,
      periodEnding: current.periodEnding,
    },
    previous: previousDetail
      ? {
          accession: previousDetail.accession,
          fileDate: previousDetail.fileDate,
          periodEnding: previousDetail.periodEnding,
        }
      : null,
    filerName: current.filerName,
    cik: current.cik,
    // 전체 개수는 보존하고 배열은 상위 N개만 전송 (대형 filer payload 방지).
    buysCount: buys.length,
    sellsCount: sells.length,
    holdsCount: holds.length,
    buys: buys.slice(0, COMPARISON_ROW_CAP),
    sells: sells.slice(0, COMPARISON_ROW_CAP),
    holds: holds.slice(0, COMPARISON_ROW_CAP),
  };
}

const cachedLoadComparison = unstable_cache(
  loadComparison,
  ['13f-comparison-v10'],
  { revalidate: COMPARISON_CACHE, tags: ['13f-comparison'] },
);
