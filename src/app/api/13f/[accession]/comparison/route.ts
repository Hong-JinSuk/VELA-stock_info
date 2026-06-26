import { cachedLoadDetail } from '@/app/api/13f/[accession]/route';
import { secFetchJson } from '@/lib/api/sec-edgar';
import type {
  ThirteenFActivity,
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

type AggEntry = {
  cusip: string;
  name: string;
  ticker: string | null;
  valueUsd: number;
  putCall: 'Put' | 'Call' | null;
};

// CUSIP + 옵션종류(보통주/Put/Call) 기준으로 join.
// 같은 종목이라도 보통주·풋·콜은 성격이 달라(풋=하락 베팅) 별도 행으로 분리해야 정확하다.
function aggregateByInstrument(
  holdings: ThirteenFHolding[],
): Map<string, AggEntry> {
  const map = new Map<string, AggEntry>();
  for (const h of holdings) {
    const key = `${h.cusip}|${h.putCall ?? ''}`;
    const existing = map.get(key);
    if (existing) {
      existing.valueUsd += h.valueUsd;
      // ticker는 한 종목이라 동일. 누락된 경우만 채움.
      if (!existing.ticker && h.ticker) existing.ticker = h.ticker;
    } else {
      map.set(key, {
        cusip: h.cusip,
        name: h.nameOfIssuer,
        ticker: h.ticker,
        valueUsd: h.valueUsd,
        putCall: h.putCall,
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
  const currMap = aggregateByInstrument(current.holdings);
  const prevMap: Map<string, AggEntry> = previous
    ? aggregateByInstrument(previous.holdings)
    : new Map();
  const currTotal = Array.from(currMap.values()).reduce(
    (s, v) => s + v.valueUsd,
    0,
  );

  // cusip|putCall 복합 키 단위로 비교.
  const allKeys = new Set([...currMap.keys(), ...prevMap.keys()]);
  const rows: ThirteenFChangeRow[] = Array.from(allKeys).map((key) => {
    const curr = currMap.get(key);
    const prev = prevMap.get(key);
    const base = curr ?? prev; // 둘 중 하나는 반드시 존재
    const currVal = curr?.valueUsd ?? 0;
    const prevVal = prev?.valueUsd ?? 0;
    const delta = currVal - prevVal;
    const deltaPercent = prevVal > 0 ? (delta / prevVal) * 100 : null;
    return {
      cusip: base?.cusip ?? '',
      ticker: curr?.ticker ?? prev?.ticker ?? null,
      nameOfIssuer: curr?.name ?? prev?.name ?? '',
      putCall: base?.putCall ?? null,
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

// 활동 요약용 instrument 집계. comparison rows(가치 기반)와 달리 주식수도 합산해
// 매수/매도 분류를 주식수 변동으로 판정한다.
type ShareAgg = { shares: number; valueUsd: number };

function aggregateShares(holdings: ThirteenFHolding[]): Map<string, ShareAgg> {
  const map = new Map<string, ShareAgg>();
  for (const h of holdings) {
    const key = `${h.cusip}|${h.putCall ?? ''}`;
    const e = map.get(key);
    if (e) {
      e.shares += h.shares;
      e.valueUsd += h.valueUsd;
    } else {
      map.set(key, { shares: h.shares, valueUsd: h.valueUsd });
    }
  }
  return map;
}

// 13F Activity 패널 산출. 보유명세가 비공개(holdings 비어 있음)면 null.
function computeActivity(
  current: ThirteenFDetail,
  previous: ThirteenFDetail | null,
): ThirteenFActivity | null {
  if (current.holdings.length === 0) return null;

  const curr = aggregateShares(current.holdings);
  const prev: Map<string, ShareAgg> = previous
    ? aggregateShares(previous.holdings)
    : new Map();

  const currTotal = Array.from(curr.values()).reduce(
    (s, v) => s + v.valueUsd,
    0,
  );
  const prevTotal = previous
    ? Array.from(prev.values()).reduce((s, v) => s + v.valueUsd, 0)
    : null;

  let newPurchases = 0;
  let addedTo = 0;
  let soldOut = 0;
  let reducedHoldings = 0;
  let buyValue = 0; // 매수 추정액 (Δ주식수 × 추정단가)
  let sellValue = 0; // 매도 추정액

  const allKeys = new Set([...curr.keys(), ...prev.keys()]);
  for (const key of allKeys) {
    const c = curr.get(key);
    const p = prev.get(key);
    const cShares = c?.shares ?? 0;
    const pShares = p?.shares ?? 0;
    // 단가: 현재가 우선, 없으면 직전. 둘 다 주식수 0이면 0.
    const price =
      c && c.shares > 0
        ? c.valueUsd / c.shares
        : p && p.shares > 0
          ? p.valueUsd / p.shares
          : 0;
    const shareDelta = cShares - pShares;
    const tradedValue = Math.abs(shareDelta) * price;

    if (pShares === 0 && cShares > 0) {
      newPurchases++;
      buyValue += tradedValue;
    } else if (pShares > 0 && cShares === 0) {
      soldOut++;
      sellValue += tradedValue;
    } else if (shareDelta > 0) {
      addedTo++;
      buyValue += tradedValue;
    } else if (shareDelta < 0) {
      reducedHoldings++;
      sellValue += tradedValue;
    }
  }

  const holdingCount = curr.size;
  const top10Value = Array.from(curr.values())
    .map((v) => v.valueUsd)
    .sort((a, b) => b - a)
    .slice(0, 10)
    .reduce((s, v) => s + v, 0);

  return {
    marketValueUsd: currTotal,
    priorMarketValueUsd: prevTotal,
    netFlowPct:
      previous && currTotal > 0
        ? ((buyValue - sellValue) / currTotal) * 100
        : null,
    newPurchases,
    addedTo,
    soldOut,
    reducedHoldings,
    top10Pct: currTotal > 0 ? (top10Value / currTotal) * 100 : 0,
    turnoverPct:
      holdingCount > 0
        ? ((newPurchases + soldOut) / holdingCount) * 100
        : 0,
    altTurnoverPct:
      currTotal > 0 ? (Math.min(buyValue, sellValue) / currTotal) * 100 : 0,
  };
}

// 캡 없는 전체 비교 결과 + 원본 detail. 미리보기(comparison)와 전체보기(changes)가 공유.
// cachedLoadDetail/cachedSubmissions가 SEC 호출을 캐시하므로, 페이지 요청마다 diff만 재계산(저렴).
export type FullComparison = {
  current: ThirteenFDetail;
  previousDetail: ThirteenFDetail | null;
  buys: ThirteenFChangeRow[];
  sells: ThirteenFChangeRow[];
  holds: ThirteenFChangeRow[];
  activity: ThirteenFActivity | null;
};

export async function loadFullComparison(
  accession: string,
): Promise<FullComparison | null> {
  const current = await cachedLoadDetail(accession);
  if (!current) return null;

  const prev = await findPreviousAccession(current.cik, accession);
  const previousDetail = prev ? await cachedLoadDetail(prev.accession) : null;

  const { buys, sells, holds } = buildComparisonRows(current, previousDetail);
  const activity = computeActivity(current, previousDetail);
  return { current, previousDetail, buys, sells, holds, activity };
}

async function loadComparison(
  accession: string,
): Promise<ThirteenFComparison | null> {
  const full = await loadFullComparison(accession);
  if (!full) return null;
  const { current, previousDetail, buys, sells, holds, activity } = full;

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
    // 현재 분기가 비밀유지로 명세 비공개면 안내용 표지 총계를 함께 전달.
    holdingsWithheld: current.holdingsWithheld,
    reportedValueUsd: current.reportedValueUsd,
    reportedEntryCount: current.reportedEntryCount,
    activity,
  };
}

const cachedLoadComparison = unstable_cache(
  loadComparison,
  ['13f-comparison-v13'],
  { revalidate: COMPARISON_CACHE, tags: ['13f-comparison'] },
);
