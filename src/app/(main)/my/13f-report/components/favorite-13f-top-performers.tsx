'use client';

import { useThirteenFByCiks } from '@/lib/services/market/use-thirteenf-by-ciks';
import { fmtUsdCompact } from '@/lib/stock/format';
import type {
  ThirteenFListItem,
  ThirteenFListSummary,
} from '@/types/thirteenf';

const TOP_N = 3;

// 전분기 대비 +100% 초과는 직전 분기 부분/재개 신고로 base가 왜곡된 데이터 아티팩트로 보고
// 제외한다(실데이터상 정규 filer 97%가 이 범위 내, 초과분은 +700%~+11만% 등 비정상값).
const MAX_QOQ_PLAUSIBLE = 100;

// qoqPercent가 있는 기관만 대상으로 좁힌 타입.
type PerfRow = ThirteenFListItem & {
  summary: ThirteenFListSummary & { qoqPercent: number };
};

// 즐겨찾기한 13F 기관 중 전분기 대비 성과(AUM 증감) 상위 TOP 3.
// 순수 수익률이 아니라 운용자산 증감(주가 상승 + 신규 매수 등 포함)이라는 점을 하단에 명시.
export default function FavoriteThirteenFTopPerformers({
  ciks,
}: {
  ciks: string[];
}) {
  const { data } = useThirteenFByCiks(ciks);
  const rows = (data ?? []).filter(
    (i): i is PerfRow =>
      i.summary != null &&
      i.summary.qoqPercent != null &&
      i.summary.qoqPercent <= MAX_QOQ_PLAUSIBLE,
  );
  if (rows.length === 0) return null;

  const top = [...rows]
    .sort((a, b) => b.summary.qoqPercent - a.summary.qoqPercent)
    .slice(0, TOP_N);

  return (
    <section>
      <header className="mb-3">
        <h2 className="text-base font-semibold text-foreground">
          전분기 대비 성과 Top {TOP_N}
        </h2>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {top.map((r, i) => {
          const name = r.krName || r.filerName;
          const qoq = r.summary.qoqPercent;
          const isUp = qoq >= 0;
          return (
            <div
              key={r.cik}
              className="rounded-xl border border-border bg-card/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <span
                  className={`text-lg font-semibold tabular-nums ${isUp ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {isUp ? '+' : ''}
                  {qoq.toFixed(1)}%
                </span>
              </div>
              <p
                className="mt-2 truncate text-sm font-medium text-foreground"
                title={name}
              >
                {name}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground/60">
                운용자산 {fmtUsdCompact(r.summary.aumUsd)}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground/50 break-keep">
        전분기 대비 운용자산(AUM) 증감 기준 · 주가 상승과 신규 매수 등이 함께
        반영되며, 신고 누락 등으로 인한 비정상 급등치는 제외됩니다.
      </p>
    </section>
  );
}
