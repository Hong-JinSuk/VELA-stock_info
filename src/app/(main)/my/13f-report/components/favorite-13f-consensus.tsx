'use client';

import { useThirteenFByCiks } from '@/lib/services/market/use-thirteenf-by-ciks';
import type {
  ThirteenFListItem,
  ThirteenFListSummary,
} from '@/types/thirteenf';
import { Minus, Plus, Wallet } from 'lucide-react';

const TOP_N = 10;

type TradeAgg = {
  key: string;
  ticker: string | null;
  name: string;
  filers: number; // 공통으로 잡힌 기관 수
  totalUsd: number; // 합산 거래액 (매수 +, 매도 -)
};

type HoldAgg = {
  key: string;
  ticker: string | null;
  name: string;
  weights: number[]; // 펀드별(같은 펀드의 A/B 클래스는 합산) 포트폴리오 비중. 중앙값/최대 산출용
};

// 종목 식별 키. 같은 회사의 공유 클래스(BRK/A·BRK/B, HEI/A 등 "루트/클래스" 표기)는
// 티커 루트로 병합해 한 종목으로 집계한다(공통 보유 기관 수 이중 카운트 방지).
// 티커가 없으면 이름으로 묶는다. (GOOG/GOOGL처럼 루트가 다른 이종 클래스는 의결권까지
// 다른 별개 종목이라 병합하지 않는다.)
function canonicalId(
  ticker: string | null,
  name: string,
): { key: string; ticker: string | null; name: string } {
  if (ticker) {
    const root = ticker.split('/')[0].toUpperCase();
    return { key: `T:${root}`, ticker: root, name };
  }
  return { key: `N:${name.toLowerCase()}`, ticker: null, name };
}

function withSummary(
  items: ThirteenFListItem[],
): { summary: ThirteenFListSummary }[] {
  return items.filter(
    (i): i is ThirteenFListItem & { summary: ThirteenFListSummary } =>
      i.summary != null,
  );
}

function aggregateTrades(
  rows: { summary: ThirteenFListSummary }[],
  pick: (s: ThirteenFListSummary) => ThirteenFListSummary['topBuys'],
): TradeAgg[] {
  // 공유 클래스는 canonicalId로 병합하고, filers는 distinct 펀드 수로 센다
  // (한 펀드가 A/B 클래스를 둘 다 거래해도 1곳).
  const map = new Map<
    string,
    {
      key: string;
      ticker: string | null;
      name: string;
      funds: Set<number>;
      totalUsd: number;
    }
  >();
  rows.forEach(({ summary }, fundIdx) => {
    for (const t of pick(summary)) {
      const { key, ticker, name } = canonicalId(t.ticker, t.name);
      let cur = map.get(key);
      if (!cur) {
        cur = { key, ticker, name, funds: new Set(), totalUsd: 0 };
        map.set(key, cur);
      }
      cur.funds.add(fundIdx);
      cur.totalUsd += t.tradeUsd;
    }
  });
  return [...map.values()].map((c) => ({
    key: c.key,
    ticker: c.ticker,
    name: c.name,
    filers: c.funds.size,
    totalUsd: c.totalUsd,
  }));
}

function aggregateHoldings(rows: { summary: ThirteenFListSummary }[]): HoldAgg[] {
  // 회사별로 "펀드별 비중"을 모은다. 같은 펀드가 공유 클래스(A/B)를 둘 다 들면 비중을 합산해
  // 그 펀드의 회사 총비중 하나로 만든다 → 중앙값/최대가 펀드 단위로 산출된다.
  const map = new Map<
    string,
    {
      key: string;
      ticker: string | null;
      name: string;
      byFund: Map<number, number>;
    }
  >();
  rows.forEach(({ summary }, fundIdx) => {
    for (const h of summary.topHoldings) {
      const { key, ticker, name } = canonicalId(h.ticker, h.name);
      let cur = map.get(key);
      if (!cur) {
        cur = { key, ticker, name, byFund: new Map() };
        map.set(key, cur);
      }
      cur.byFund.set(fundIdx, (cur.byFund.get(fundIdx) ?? 0) + h.weightPercent);
    }
  });
  return [...map.values()].map((c) => ({
    key: c.key,
    ticker: c.ticker,
    name: c.name,
    weights: [...c.byFund.values()],
  }));
}

function fmtUsd(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? '-' : '+';
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(0)}M`;
  return `${sign}$${a.toLocaleString()}`;
}

type Tone = 'buy' | 'sell' | 'hold';

const TONE_STYLE: Record<
  Tone,
  { title: string; icon: typeof Plus; chip: string; amount: string }
> = {
  buy: {
    title: '공통 매수',
    icon: Plus,
    chip: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    amount: 'text-emerald-500',
  },
  sell: {
    title: '공통 매도',
    icon: Minus,
    chip: 'bg-red-500/10 text-red-500 border-red-500/20',
    amount: 'text-red-500',
  },
  hold: {
    title: '공통 보유',
    icon: Wallet,
    chip: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amount: 'text-muted-foreground',
  },
};

function ConsensusList({
  tone,
  rows,
}: {
  tone: Tone;
  rows: Array<{
    key: string;
    ticker: string | null;
    name: string;
    filers: number;
    amount: string;
  }>;
}) {
  const { title, icon: Icon, chip, amount } = TONE_STYLE[tone];
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <header className="mb-3 flex items-center gap-1.5">
        <span
          className={`flex size-5 items-center justify-center rounded border ${chip}`}
        >
          <Icon className="size-3" />
        </span>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </header>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">데이터 없음</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {rows.map((r, i) => (
            <li key={r.key} className="flex items-center gap-2 text-xs">
              <span className="w-4 shrink-0 text-right tabular-nums text-muted-foreground/50">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {r.ticker ?? r.name}
              </span>
              <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {r.filers}곳
              </span>
              <span
                className={`w-16 shrink-0 text-right tabular-nums font-medium ${amount}`}
              >
                {r.amount}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// 즐겨찾기한 13F 기관들의 주요 매수/매도/보유를 종목별 합산 → 공통 TOP 10.
// 공유 클래스(BRK/A·B 등)는 한 종목으로 병합, 기관 수는 distinct 펀드.
// 랭킹: 공통 기관 수 desc → 매수 합산액↓ / 매도 합산액|↓| / 보유 최대비중↓.
export default function FavoriteThirteenFConsensus({ ciks }: { ciks: string[] }) {
  const { data } = useThirteenFByCiks(ciks);
  const rows = withSummary(data ?? []);

  if (rows.length === 0) return null;

  const buys = aggregateTrades(rows, (s) => s.topBuys)
    .sort((a, b) => b.filers - a.filers || b.totalUsd - a.totalUsd)
    .slice(0, TOP_N)
    .map((a) => ({ ...a, amount: fmtUsd(a.totalUsd) }));

  const sells = aggregateTrades(rows, (s) => s.topSells)
    .sort((a, b) => b.filers - a.filers || a.totalUsd - b.totalUsd)
    .slice(0, TOP_N)
    .map((a) => ({ ...a, amount: fmtUsd(a.totalUsd) }));

  const holds = aggregateHoldings(rows)
    .map((a) => ({
      key: a.key,
      ticker: a.ticker,
      name: a.name,
      filers: a.weights.length,
      max: Math.max(...a.weights), // 가장 크게 몰빵한 기관의 포트폴리오 비중
    }))
    .sort((a, b) => b.filers - a.filers || b.max - a.max)
    .slice(0, TOP_N)
    .map((a) => ({
      key: a.key,
      ticker: a.ticker,
      name: a.name,
      filers: a.filers,
      amount: `최대 ${Math.round(a.max)}%`,
    }));

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground/70 break-keep">
        즐겨찾기 {rows.length}개 기관의 주요 매매를 합산한 공통 TOP {TOP_N} ·
        {' '}숫자는 공통으로 잡힌 기관 수
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ConsensusList tone="buy" rows={buys} />
        <ConsensusList tone="sell" rows={sells} />
        <ConsensusList tone="hold" rows={holds} />
      </div>
    </div>
  );
}
