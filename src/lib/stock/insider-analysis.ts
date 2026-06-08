// 내부자 거래(SEC Form 4) 원본을 화면용으로 분석한다.
//  1) 최근 12개월 월별 매수(취득)/매도(처분) 물량 → 비교 차트
//  2) 거래코드별 6개 버킷 (취득 3 / 처분 3)
//
// transactionCode (SEC Form 4):
//   P=공개시장 매수, S=공개시장 매도, A=수여/award, M=옵션 행사,
//   F=세금/행사가 충당 위한 주식 인도, G=증여, C=전환, X=권리행사, D=발행사 처분 등.
// change 부호로 취득(+)/처분(-)을 판정하고, 코드로 세부 버킷을 나눈다.
import type {
  InsiderAnalysis,
  InsiderBuckets,
  InsiderMonthlyPoint,
} from '@/types/stock';
import type { RawInsiderTx } from '@/lib/api/finnhub';

const MONTHS = 12;

function emptyBuckets(): InsiderBuckets {
  return {
    openMarketBuy: 0,
    awardGrant: 0,
    otherAcquisition: 0,
    openMarketSell: 0,
    taxOption: 0,
    otherDisposition: 0,
  };
}

// 최근 12개월 'YYYY-MM' 키 배열 (오래된→최신).
function recentMonthKeys(now: Date): string[] {
  const keys: string[] = [];
  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function monthKeyOf(dateStr: string): string | null {
  if (!dateStr) return null;
  // "YYYY-MM-DD" → "YYYY-MM"
  const m = dateStr.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(m) ? m : null;
}

export function analyzeInsiderTransactions(
  txs: RawInsiderTx[],
  now: Date = new Date(),
): InsiderAnalysis {
  const buckets = emptyBuckets();
  const monthKeys = recentMonthKeys(now);
  const monthMap = new Map<
    string,
    { buy: number; sell: number; neutral: number }
  >(monthKeys.map((k) => [k, { buy: 0, sell: 0, neutral: 0 }]));

  let totalAcquired = 0;
  let totalDisposed = 0;
  let counted = 0;

  for (const tx of txs) {
    const change = Number(tx.change);
    if (!Number.isFinite(change) || change === 0) continue;
    const shares = Math.abs(change);
    const code = (tx.transactionCode ?? '').toUpperCase();
    const acquired = change > 0;
    counted++;

    // 부호(취득/처분) 우선 → 코드로 세분.
    // 핵심: 재량적 공개시장 거래(P 매수 / S 매도)를 보상·세금 같은 기계적·비정보성 거래와 분리.
    if (acquired) {
      if (code === 'P')
        buckets.openMarketBuy += shares; // 자발적 매수 (정보성 ↑)
      else if (code === 'A' || code === 'M' || code === 'X' || code === 'C')
        buckets.awardGrant += shares; // 수여/옵션·권리 행사/전환 (비정보성)
      else buckets.otherAcquisition += shares; // 증여(G)·기타(J 등)
      totalAcquired += shares;
    } else {
      if (code === 'S')
        buckets.openMarketSell += shares; // 자발적 매도
      else if (code === 'F' || code === 'D')
        buckets.taxOption += shares; // 세금/행사대금 충당, 발행사에 처분 (회사 반환, 비재량)
      else buckets.otherDisposition += shares; // 증여(G)·기타(J 등)
      totalDisposed += shares;
    }

    // 월별 집계: 신호(P 매수 / S 매도) vs 중립(나머지). transactionDate 우선.
    const mk = monthKeyOf(tx.transactionDate) ?? monthKeyOf(tx.filingDate);
    if (mk && monthMap.has(mk)) {
      const bucket = monthMap.get(mk)!;
      if (code === 'P') bucket.buy += shares;
      else if (code === 'S') bucket.sell += shares;
      else bucket.neutral += shares;
    }
  }

  const monthly: InsiderMonthlyPoint[] = monthKeys.map((month) => {
    const m = monthMap.get(month)!;
    return { month, buy: m.buy, sell: m.sell, neutral: m.neutral };
  });

  return {
    hasData: counted > 0,
    buckets,
    monthly,
    totalAcquired,
    totalDisposed,
  };
}
