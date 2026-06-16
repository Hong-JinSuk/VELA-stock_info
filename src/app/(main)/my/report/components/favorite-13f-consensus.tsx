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
  filers: number;
  weightSum: number; // 비중 합 (평균 산출용)
};

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
  const map = new Map<string, TradeAgg>();
  for (const { summary } of rows) {
    for (const t of pick(summary)) {
      const key = t.ticker ?? t.name;
      const cur = map.get(key) ?? {
        key,
        ticker: t.ticker,
        name: t.name,
        filers: 0,
        totalUsd: 0,
      };
      cur.filers += 1;
      cur.totalUsd += t.tradeUsd;
      map.set(key, cur);
    }
  }
  return [...map.values()];
}

function aggregateHoldings(rows: { summary: ThirteenFListSummary }[]): HoldAgg[] {
  const map = new Map<string, HoldAgg>();
  for (const { summary } of rows) {
    for (const h of summary.topHoldings) {
      const key = h.ticker ?? h.name;
      const cur = map.get(key) ?? {
        key,
        ticker: h.ticker,
        name: h.name,
        filers: 0,
        weightSum: 0,
      };
      cur.filers += 1;
      cur.weightSum += h.weightPercent;
      map.set(key, cur);
    }
  }
  return [...map.values()];
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
// 랭킹: 공통 기관 수 desc → 합산 금액(매수↓/매도|↓|/비중↓).
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
    .sort((a, b) => b.filers - a.filers || b.weightSum - a.weightSum)
    .slice(0, TOP_N)
    .map((a) => ({ ...a, amount: `${(a.weightSum / a.filers).toFixed(1)}%` }));

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
