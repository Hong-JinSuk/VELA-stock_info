'use client';

import {
  ASSET_CLASSES,
  ASSET_CLASS_META,
} from '@/constants/asset-classes';
import {
  PORTFOLIO_TEMPLATES,
  type PortfolioTemplate,
  type TemplateId,
} from '@/constants/portfolio-templates';

// 모델 포트폴리오(목표 배분) 선택 카드 그리드. 선택 시 onSelect(id).
export default function TemplateSelector({
  selected,
  onSelect,
}: {
  selected: TemplateId | null;
  onSelect: (id: TemplateId) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {PORTFOLIO_TEMPLATES.map((t) => (
        <TemplateCard
          key={t.id}
          template={t}
          active={selected === t.id}
          onClick={() => onSelect(t.id)}
        />
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  active,
  onClick,
}: {
  template: PortfolioTemplate;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col gap-3 rounded-2xl border p-4 text-left transition-colors ${
        active
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border bg-card/40 hover:bg-accent/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {template.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground break-keep">
            {template.tagline}
          </p>
        </div>
        {template.author && (
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
            {template.author}
          </span>
        )}
      </div>

      {template.allocations ? (
        <AllocationBar allocations={template.allocations} />
      ) : (
        <div className="flex h-2 items-center rounded-full border border-dashed border-border" />
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground/70 break-keep">
        {template.description}
      </p>
    </button>
  );
}

// 자산군 비중을 색 세그먼트로 쌓은 얇은 막대.
function AllocationBar({
  allocations,
}: {
  allocations: Record<string, number>;
}) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      {ASSET_CLASSES.map((c) => {
        const pct = allocations[c] ?? 0;
        if (pct <= 0) return null;
        return (
          <div
            key={c}
            className={ASSET_CLASS_META[c].bar}
            style={{ width: `${pct}%` }}
            title={`${ASSET_CLASS_META[c].label} ${pct}%`}
          />
        );
      })}
    </div>
  );
}
