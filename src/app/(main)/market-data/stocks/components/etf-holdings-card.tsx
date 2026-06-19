'use client';

import { krNameOf } from '@/constants/stock-korean-names';
import { useStockHoldings } from '@/lib/services/stock/use-stock-holdings';
import { fmtPct } from '@/lib/stock/format';
import type { EtfHoldingEntry } from '@/types/stock';
import { PieChart } from 'lucide-react';

// 비중 막대(0~1). 좁은 폭에서도 안 깨지게 고정 트랙 + 채움.
function WeightBar({ weight }: { weight: number }) {
  const pct = Math.max(0, Math.min(1, weight)) * 100;
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
      <div
        className="h-full rounded-full bg-blue-500/70"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// 직전 대비 순위 변동. 한국 컨벤션: 상승=빨강▲ / 하락=파랑▼ / 신규=N / 변동없음·기준없음=–.
// 고정폭 슬롯에 항상 글자를 채워(빈칸 X) 종목명이 밀리지 않게 한다.
function RankChange({
  rank,
  prevRank,
  isNew,
}: {
  rank: number;
  prevRank: number | null;
  isNew: boolean;
}) {
  const base =
    'inline-flex items-center justify-center gap-0.5 text-[11px] font-medium tabular-nums w-6 shrink-0';
  if (isNew) {
    return <span className={`${base} font-bold text-red-500`}>N</span>;
  }
  // 직전 순위가 없으면(최초 적재) 변동 없음으로 간주해 – 표시.
  const delta = prevRank == null ? 0 : prevRank - rank; // +면 상승, -면 하락
  if (delta === 0) {
    return <span className={`${base} text-muted-foreground/40`}>–</span>;
  }
  const up = delta > 0;
  return (
    <span className={`${base} ${up ? 'text-red-500' : 'text-blue-500'}`}>
      <span className="text-[9px] leading-none">{up ? '▲' : '▼'}</span>
      {Math.abs(delta)}
    </span>
  );
}

function HoldingRow({
  item,
  isNew,
}: {
  item: EtfHoldingEntry;
  isNew: boolean;
}) {
  return (
    <li className="py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground/60 tabular-nums w-3.5 shrink-0 text-left">
            {item.rank}
          </span>
          <RankChange rank={item.rank} prevRank={item.prevRank} isNew={isNew} />
          {item.symbol && (
            <span className="font-semibold text-sm shrink-0">{item.symbol}</span>
          )}
          <span className="text-sm text-muted-foreground truncate break-keep">
            {item.name}
          </span>
        </div>
        <span className="text-sm font-medium tabular-nums shrink-0">
          {fmtPct(item.weight * 100)}
        </span>
      </div>
      <div className="mt-1.5 pl-6">
        <WeightBar weight={item.weight} />
      </div>
    </li>
  );
}

export default function EtfHoldingsCard({ ticker }: { ticker: string }) {
  const { data, isLoading } = useStockHoldings(ticker, true);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PieChart className="w-4 h-4" />
          보유종목
        </div>
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  // 배치 미적재 ETF는 섹션 자체를 표시하지 않음.
  if (!data) return null;

  const { holdings, entered, exited, stockPct, bondPct, cashPct } = data;
  const enteredSet = new Set(entered);
  const allocation = [
    { label: '주식', v: stockPct },
    { label: '채권', v: bondPct },
    { label: '현금', v: cashPct },
  ].filter((a) => a.v != null && a.v > 0);
  // 순위 변동(▲▼N)이 하나라도 있으면 범례 노출.
  const hasRankChange = holdings.some(
    (h) => enteredSet.has(h.symbol ?? '') || h.prevRank != null,
  );

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PieChart className="w-4 h-4" />
          상위 보유종목 Top {holdings.length}
        </div>
        {allocation.length > 0 && (
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground tabular-nums">
            {allocation.map((a) => (
              <span key={a.label}>
                {a.label} {fmtPct((a.v ?? 0) * 100, 1)}
              </span>
            ))}
          </div>
        )}
      </div>

      {hasRankChange && (
        <div className="mt-2 flex items-center gap-2.5 text-[11px] text-muted-foreground/60">
          <span>직전 대비</span>
          <span className="text-red-500">▲ 상승</span>
          <span className="text-blue-500">▼ 하락</span>
          <span className="text-red-500 font-bold">N</span>
          <span>신규</span>
        </div>
      )}

      <ul className="mt-3">
        {holdings.map((h) => (
          <HoldingRow
            key={`${h.rank}-${h.symbol ?? h.name}`}
            item={h}
            isNew={enteredSet.has(h.symbol ?? '')}
          />
        ))}
      </ul>

      {exited.length > 0 && (
        <div className="mt-3 flex items-start gap-2 flex-wrap text-xs text-muted-foreground/70">
          <span className="shrink-0 text-blue-500">▼ 편출</span>
          <span className="flex flex-wrap gap-x-2 gap-y-1 break-keep">
            {exited.map((s) => {
              const kr = krNameOf(s);
              return (
                <span key={s}>
                  <span className="font-medium text-foreground/70">{s}</span>
                  {kr && <span className="ml-1 opacity-70">{kr}</span>}
                </span>
              );
            })}
          </span>
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground/50 break-keep">
        출처: Yahoo Finance · 상위 10개 보유종목 기준 (전체 구성종목 아님)
      </p>
    </div>
  );
}
