'use client';

import { fmtNum, fmtPct, fmtUsd } from '@/lib/stock/format';
import type { StockMetrics } from '@/types/stock';

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

export default function StockMetricsCard({
  metrics,
}: {
  metrics: StockMetrics;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6">
      <p className="text-sm text-muted-foreground mb-5">주요 지표</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6">
        <Cell label="52주 최고가" value={fmtUsd(metrics.high52w)} />
        <Cell label="52주 최저가" value={fmtUsd(metrics.low52w)} />
        <Cell label="52주 수익률" value={fmtPct(metrics.priceReturn52w)} />
        <Cell label="예상 배당수익률" value={fmtPct(metrics.dividendYield)} />

        <Cell label="PER (연간)" value={fmtNum(metrics.peAnnual)} />
        <Cell label="PBR (연간)" value={fmtNum(metrics.pbAnnual)} />
        <Cell label="PSR (연간)" value={fmtNum(metrics.psAnnual)} />
        <Cell label="EPS (연간)" value={fmtUsd(metrics.epsAnnual)} />

        <Cell label="베타 (BETA)" value={fmtNum(metrics.beta)} />
        <Cell label="매출 성장률 (TTM)" value={fmtPct(metrics.revenueGrowthTTM)} />
        <Cell label="영업이익률 (TTM)" value={fmtPct(metrics.operatingMarginTTM)} />
        <Cell label="순이익률 (TTM)" value={fmtPct(metrics.netMarginTTM)} />

        <Cell label="투자수익률 (ROI)" value={fmtPct(metrics.roiTTM)} />
        <Cell label="자기자본이익률 (ROE)" value={fmtPct(metrics.roeTTM)} />
        <Cell label="유동비율 (분기)" value={fmtNum(metrics.currentRatioQuarterly)} />
      </div>
    </div>
  );
}
