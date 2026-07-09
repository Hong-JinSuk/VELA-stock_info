'use client';

import { sectorColor, sectorLabel } from '@/constants/sector-colors';
import { useThirteenFByCiks } from '@/lib/services/market/use-thirteenf-by-ciks';
import type {
  ThirteenFListItem,
  ThirteenFListSummary,
} from '@/types/thirteenf';

const TOP_N = 8;

type WithSummary = ThirteenFListItem & { summary: ThirteenFListSummary };

// 즐겨찾기한 13F 기관들의 섹터 배분 컨센서스.
// 각 기관 topSectors를 AUM(운용자산) 가중으로 달러 합산 → 분류된 보유 기준 100% 정규화.
// 단순 평균이 아니라 "총 섹터 달러 ÷ 총 달러"라 이상치 왜곡이 없는 풀링된 실제 비율.
export default function FavoriteThirteenFSectors({ ciks }: { ciks: string[] }) {
  const { data } = useThirteenFByCiks(ciks);
  const rows = (data ?? []).filter(
    (i): i is WithSummary => i.summary != null,
  );
  if (rows.length === 0) return null;

  // 섹터별 달러 = Σ (aumUsd × weightPercent / 100)
  const dollarsBySector = new Map<string, number>();
  for (const { summary } of rows) {
    for (const s of summary.topSectors) {
      const usd = summary.aumUsd * (s.weightPercent / 100);
      dollarsBySector.set(
        s.sector,
        (dollarsBySector.get(s.sector) ?? 0) + usd,
      );
    }
  }
  const total = [...dollarsBySector.values()].reduce((a, b) => a + b, 0);
  if (total <= 0) return null;

  const sectors = [...dollarsBySector.entries()]
    .map(([sector, usd]) => ({ sector, pct: (usd / total) * 100 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, TOP_N);
  const maxPct = sectors[0]?.pct ?? 100; // 막대 상대 스케일(1위가 꽉 참)

  return (
    <section>
      <header className="mb-3">
        <h2 className="text-base font-semibold text-foreground">섹터 컨센서스</h2>
      </header>
      <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-5">
        <p className="mb-4 text-xs text-muted-foreground/70 break-keep">
          즐겨찾기 {rows.length}개 기관이 자금을 넣은 섹터 비중 · 분류된 보유 기준
          (운용자산 가중)
        </p>
        <ul className="flex flex-col gap-2.5">
          {sectors.map((s) => (
            <li key={s.sector} className="flex items-center gap-3 text-xs">
              <span className="w-16 shrink-0 truncate text-foreground sm:w-20">
                {sectorLabel(s.sector)}
              </span>
              <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${sectorColor(s.sector)}`}
                  style={{ width: `${(s.pct / maxPct) * 100}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right font-medium tabular-nums text-foreground">
                {s.pct.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
