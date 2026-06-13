/**
 * 시장 이벤트 캘린더 — 만기·리밸런싱·FOMC 등 "날짜 자체가 시장에 영향을 주는" 일정.
 *
 * 만기/리밸런싱류는 거래소 규칙("3·6·9·12월 셋째 금요일" 등)으로 날짜가 정의되므로
 * 정적 날짜 리스트가 아니라 규칙 함수로 계산한다.
 * FOMC만 연준이 사전 발표하는 고정 일정이라 연 단위 정적 데이터로 관리한다.
 * → 매년 연준 발표 시 다음 해 일정 추가 필요:
 *   https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
 *
 * impact 문구는 상승/하락 방향이 아니라 "만기·이벤트의 통상적 영향"(변동성·수급)을 적는다.
 */

export type MarketEventCategory = 'fomc' | 'expiry' | 'rebalance';

export type MarketEvent = {
  /** 타임라인 React key용 (예: 'opex-2026-07-17'). */
  id: string;
  name: string;
  category: MarketEventCategory;
  /** YYYY-MM-DD (미국 거래일 기준). */
  date: string;
  /** 이름 옆 보조 칩 (예: '점도표'). */
  badge?: string;
  /** 이벤트의 통상적 영향 — 방향이 아니라 변동성·수급 관점. */
  impact: string;
};

// FOMC 결정일(이틀 회의의 둘째 날, 성명서 발표일). sep = 점도표(SEP) 동반 회의.
const FOMC_DECISIONS: Array<{ date: string; sep: boolean }> = [
  { date: '2026-01-28', sep: false },
  { date: '2026-03-18', sep: true },
  { date: '2026-04-29', sep: false },
  { date: '2026-06-17', sep: true },
  { date: '2026-07-29', sep: false },
  { date: '2026-09-16', sep: true },
  { date: '2026-10-28', sep: false },
  { date: '2026-12-09', sep: true },
  { date: '2027-01-27', sep: false },
  { date: '2027-03-17', sep: true },
  { date: '2027-04-28', sep: false },
  { date: '2027-06-09', sep: true },
  { date: '2027-07-28', sep: false },
  { date: '2027-09-15', sep: true },
  { date: '2027-10-27', sep: false },
  { date: '2027-12-08', sep: true },
];

const FOMC_IMPACT =
  '기준금리 결정과 성명서가 한국시간 새벽에 발표되고, 30분 뒤 의장 기자회견이 이어집니다. 발표 전후 금리·주가 변동성이 크게 확대되며, 점도표 동반 회의(3·6·9·12월)는 영향이 더 큽니다.';

const WITCHING_IMPACT =
  '지수선물·지수옵션·개별주식 선물·옵션이 동시 만기되는 날. 거래량이 평소의 1.5~2배로 급증하고 마감 동시호가 변동성이 커집니다. 방향성 이벤트는 아니며, 만기 직후 주간은 역사적으로 수익률이 부진한 경향이 있습니다.';

const OPEX_IMPACT =
  '월간 옵션 만기일. 딜러 감마 헤지 해소로 만기 전엔 주가가 특정 행사가 부근에 고착(pinning)되는 경향이 있고, 만기 다음 주 초엔 변동성이 확대되는 경향이 있습니다.';

const VIX_EXPIRY_IMPACT =
  'VIX 선물·옵션 만기(수요일 개장 전 SOQ 정산). 변동성 상품의 롤오버 수급으로 VIX 자체가 출렁이며 지수에 간접적인 영향을 줍니다.';

const RUSSELL_IMPACT =
  '러셀 지수 연례 재구성 발효일. 연중 최대 거래량을 기록하는 날 중 하나로, 편입·편출 종목의 마감 수급이 폭증하며 중소형주 영향이 큽니다.';

const SP_REBAL_IMPACT =
  'S&P 지수 분기 리밸런싱 발효일(셋째 금요일 마감 기준, 네 마녀의 날과 같은 날). 편입·편출과 비중 조정 종목에 패시브 자금 수급이 집중됩니다.';

const FRIDAY = 5;

// 선물·옵션 동시 만기(네 마녀의 날) 월. 같은 날 S&P 분기 리밸런싱 발효.
const WITCHING_MONTHS = new Set([3, 6, 9, 12]);

// 타임라인에 노출할 기간. 분기 주기 이벤트(위칭 등 최대 ~13주 간격)가
// 임박했을 때만 보이도록 적당히 자른다.
const DEFAULT_WINDOW_DAYS = 60;

function toDateStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** month는 1-based. */
function thirdFriday(year: number, month: number): Date {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const offset = (FRIDAY - firstWeekday + 7) % 7;
  return new Date(year, month - 1, 1 + offset + 14);
}

// VIX 만기: "다음 달 셋째 금요일의 30일 전 수요일" (CBOE 규칙).
function vixExpiry(year: number, month: number): Date {
  const tf =
    month === 12 ? thirdFriday(year + 1, 1) : thirdFriday(year, month + 1);
  return new Date(tf.getFullYear(), tf.getMonth(), tf.getDate() - 30);
}

// 러셀 재구성: 6월 마지막 금요일. 단 28~30일에 걸리면 직전 금요일 (FTSE Russell 규칙).
function russellReconstitution(year: number): Date {
  const lastDay = new Date(year, 6, 0); // 6월 말일
  const offset = (lastDay.getDay() - FRIDAY + 7) % 7;
  const lastFriday = new Date(year, 5, lastDay.getDate() - offset);
  if (lastFriday.getDate() >= 28) {
    return new Date(year, 5, lastFriday.getDate() - 7);
  }
  return lastFriday;
}

// from(자정 기준) 이후 가장 가까운 월 단위 이벤트 날짜를 규칙 함수로 탐색.
function nextMonthlyDate(
  from: Date,
  calc: (year: number, month: number) => Date,
  monthFilter?: (month: number) => boolean,
): Date | null {
  for (let i = 0; i < 14; i++) {
    const probe = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const month = probe.getMonth() + 1;
    if (monthFilter && !monthFilter(month)) continue;
    const d = calc(probe.getFullYear(), month);
    if (d >= from) return d;
  }
  return null;
}

/**
 * 오늘 이후 windowDays 이내의 시장 이벤트 목록 (날짜 오름차순).
 * 타임라인이 이벤트로 도배되지 않도록 이벤트 타입별 "다음 1회"만 반환한다.
 */
export function getUpcomingMarketEvents(
  now: Date = new Date(),
  withinDays: number = DEFAULT_WINDOW_DAYS,
): MarketEvent[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const limit = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + withinDays,
  );
  const inWindow = (d: Date) => d >= today && d <= limit;

  const events: MarketEvent[] = [];

  const fomc = FOMC_DECISIONS.find((m) => m.date >= toDateStr(today));
  if (fomc && fomc.date <= toDateStr(limit)) {
    events.push({
      id: `fomc-${fomc.date}`,
      name: 'FOMC 금리 결정',
      category: 'fomc',
      date: fomc.date,
      badge: fomc.sep ? '점도표' : undefined,
      impact: FOMC_IMPACT,
    });
  }

  const witching = nextMonthlyDate(today, thirdFriday, (m) =>
    WITCHING_MONTHS.has(m),
  );
  if (witching && inWindow(witching)) {
    const date = toDateStr(witching);
    events.push({
      id: `witching-${date}`,
      name: '네 마녀의 날',
      category: 'expiry',
      date,
      badge: '동시 만기',
      impact: WITCHING_IMPACT,
    });
    events.push({
      id: `sp-rebalance-${date}`,
      name: 'S&P 분기 리밸런싱',
      category: 'rebalance',
      date,
      impact: SP_REBAL_IMPACT,
    });
  }

  const opex = nextMonthlyDate(
    today,
    thirdFriday,
    (m) => !WITCHING_MONTHS.has(m),
  );
  if (opex && inWindow(opex)) {
    const date = toDateStr(opex);
    events.push({
      id: `opex-${date}`,
      name: '월간 옵션 만기',
      category: 'expiry',
      date,
      impact: OPEX_IMPACT,
    });
  }

  const vix = nextMonthlyDate(today, vixExpiry);
  if (vix && inWindow(vix)) {
    const date = toDateStr(vix);
    events.push({
      id: `vix-expiry-${date}`,
      name: 'VIX 선물·옵션 만기',
      category: 'expiry',
      date,
      impact: VIX_EXPIRY_IMPACT,
    });
  }

  const russellThisYear = russellReconstitution(today.getFullYear());
  const russell =
    russellThisYear >= today
      ? russellThisYear
      : russellReconstitution(today.getFullYear() + 1);
  if (inWindow(russell)) {
    const date = toDateStr(russell);
    events.push({
      id: `russell-${date}`,
      name: '러셀 지수 재구성',
      category: 'rebalance',
      date,
      impact: RUSSELL_IMPACT,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}
