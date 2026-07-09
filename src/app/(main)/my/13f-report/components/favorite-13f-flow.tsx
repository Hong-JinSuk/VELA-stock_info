'use client';

import { useThirteenFByCiks } from '@/lib/services/market/use-thirteenf-by-ciks';
import type {
  ThirteenFListItem,
  ThirteenFListSummary,
} from '@/types/thirteenf';
import { TrendingDown, TrendingUp } from 'lucide-react';

// qoqPercent가 있는 기관만 대상으로 좁힌 타입.
type FlowRow = ThirteenFListItem & {
  summary: ThirteenFListSummary & { qoqPercent: number };
};

// 즐겨찾기한 13F 기관들의 집단 자금 흐름.
// 전분기 대비 운용자산(AUM) 증감을 AUM 가중 평균으로 합산 → 시장 risk-on/off 심리 한 줄.
// 순증/순감 기관 수로 쏠림의 폭(breadth)도 함께 보여준다.
export default function FavoriteThirteenFFlow({ ciks }: { ciks: string[] }) {
  const { data } = useThirteenFByCiks(ciks);
  const rows = (data ?? []).filter(
    (i): i is FlowRow =>
      i.summary != null && i.summary.qoqPercent != null,
  );
  if (rows.length === 0) return null;

  let weighted = 0; // Σ (aumUsd × qoq%)
  let aumTotal = 0; // Σ aumUsd
  let up = 0;
  let down = 0;
  for (const { summary } of rows) {
    aumTotal += summary.aumUsd;
    weighted += summary.aumUsd * summary.qoqPercent;
    if (summary.qoqPercent > 0) up += 1;
    else if (summary.qoqPercent < 0) down += 1;
  }
  const groupQoq = aumTotal > 0 ? weighted / aumTotal : 0;
  const isUp = groupQoq >= 0;

  return (
    <section>
      <header className="mb-3">
        <h2 className="text-base font-semibold text-foreground">집단 자금 흐름</h2>
      </header>
      <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground/70 break-keep">
              즐겨찾기 {rows.length}개 기관 합산 운용자산 · 전분기 대비
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              {isUp ? (
                <TrendingUp className="size-5 text-emerald-500" />
              ) : (
                <TrendingDown className="size-5 text-red-500" />
              )}
              <span
                className={`text-2xl font-semibold tabular-nums ${isUp ? 'text-emerald-500' : 'text-red-500'}`}
              >
                {isUp ? '+' : ''}
                {groupQoq.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 tabular-nums text-emerald-500">
              순증 {up}곳
            </span>
            <span className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 tabular-nums text-red-500">
              순감 {down}곳
            </span>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground/50 break-keep">
          각 기관 표지 운용자산의 전분기 대비 증감을 운용자산 가중으로 합산한 값 ·
          주가 상승과 신규 매수 등이 함께 반영됩니다.
        </p>
      </div>
    </section>
  );
}
