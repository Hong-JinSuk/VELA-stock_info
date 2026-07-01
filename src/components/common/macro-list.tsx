import { cn } from '@/lib/utils';
import type { MacroIndicator } from '@/types/macro-indicator';
import FavoriteButton from './favorite-button';
import {
  IndicatorHelp,
  MacroIcon,
  STATUS_COLORS,
  STATUS_LABELS,
  computeStatus,
  formatDday,
  formatNextRelease,
  formatValue,
  pickState,
} from './macro-card';

// 경제 지표 리스트 뷰 — MacroCard와 동일 데이터를 한 행으로 압축.
// 카드가 보기 어려운(개수 많은) 경우의 대안. 상태 판정·포맷 로직은 MacroCard와 공유(단일 소스).
export default function MacroList({
  indicators,
  showFavorite = false,
}: {
  indicators: MacroIndicator[];
  showFavorite?: boolean;
}) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {indicators.map((indicator) => (
        <MacroRow
          key={indicator.indicatorId}
          indicator={indicator}
          showFavorite={showFavorite}
        />
      ))}
    </div>
  );
}

function MacroRow({
  indicator,
  showFavorite,
}: {
  indicator: MacroIndicator;
  showFavorite: boolean;
}) {
  const { displayMeta } = indicator;
  const status = computeStatus(indicator);
  const state = pickState(displayMeta.states, status);
  const { main, suffix } = formatValue(
    indicator.value,
    displayMeta.valueDecimals,
    displayMeta.unitSuffix,
  );
  const valueSuffix = `${suffix}${displayMeta.unitSuffix}`;
  const nextRelease = formatNextRelease(indicator.nextReleaseDate);
  const name = displayMeta.cardName;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 sm:px-4">
      {showFavorite && (
        <FavoriteButton
          type="INDICATOR"
          itemKey={indicator.indicatorId}
          label={name}
          size={15}
        />
      )}
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
        <MacroIcon
          iconName={displayMeta.iconName}
          className="size-3.5 text-foreground/70"
        />
      </div>

      {/* 이름 + 해석(현재 상태 → 결과) */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {state.icon} {state.label} → {state.resultIcon} {state.resultLabel}
        </p>
      </div>

      {/* 값 + 다음 발표 */}
      <div className="shrink-0 text-right tabular-nums">
        <div className="text-sm font-semibold text-foreground">
          {main}
          <span className="ml-[1px] text-xs font-medium text-muted-foreground/80">
            {valueSuffix}
          </span>
        </div>
        {nextRelease && nextRelease.daysUntil >= 0 && (
          <div className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
            다음 {nextRelease.mmdd} ({formatDday(nextRelease.daysUntil)})
          </div>
        )}
      </div>

      {/* 상태 배지 */}
      <span
        className={cn(
          'shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
          STATUS_COLORS[status],
        )}
      >
        {STATUS_LABELS[status]}
      </span>

      {/* 도움말(설명·시장 영향·상태별 해석) — 카드와 동일 팝오버 */}
      <IndicatorHelp indicator={indicator} status={status} />
    </div>
  );
}
