import Sparkline from '@/components/common/sparkline';
import { sectorColor } from '@/constants/sector-colors';
import { cn } from '@/lib/utils';
import type { SectorPerformance, SectorPeriodKey } from '@/types/sector';
import type { ColumnDef } from '@tanstack/react-table';

export const PERIODS: Array<{ key: SectorPeriodKey; label: string }> = [
  { key: 'd1', label: '1일' },
  { key: 'w1', label: '1주' },
  { key: 'm1', label: '1달' },
  { key: 'm3', label: '3달' },
  { key: 'ytd', label: 'YTD' },
];

// 수익률 크기별 배경 농도 (미니 히트맵).
// Tailwind JIT는 동적 클래스 조합을 못 잡으므로 풀 리터럴로 나열.
const HEAT_UP = [
  'bg-emerald-500/5',
  'bg-emerald-500/10',
  'bg-emerald-500/20',
  'bg-emerald-500/30',
];
const HEAT_DOWN = [
  'bg-red-500/5',
  'bg-red-500/10',
  'bg-red-500/20',
  'bg-red-500/30',
];

const HEAT_THRESHOLDS = [0.5, 2, 5]; // |수익률|% 단계 경계

function heatLevel(abs: number): number {
  let level = 0;
  for (const t of HEAT_THRESHOLDS) {
    if (abs >= t) level++;
  }
  return level;
}

function ReturnCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground/40">—</span>;
  const up = value >= 0;
  const heat = (up ? HEAT_UP : HEAT_DOWN)[heatLevel(Math.abs(value))];
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[11px] font-medium',
        heat,
        up ? 'text-emerald-500' : 'text-red-500',
      )}
    >
      {up ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

// activePeriod: 기간 토글에서 선택된 컬럼을 헤더에서 강조 (정렬 기준).
export function buildSectorColumns(
  activePeriod: SectorPeriodKey,
): ColumnDef<SectorPerformance>[] {
  return [
    {
      accessorKey: 'nameKo',
      header: '섹터',
      size: 180,
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              sectorColor(row.original.sector),
            )}
          />
          <span className="truncate text-sm font-medium">
            {row.original.nameKo}
          </span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
            {row.original.ticker}
          </span>
        </div>
      ),
    },
    {
      id: 'price',
      header: '현재가',
      size: 90,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="text-sm">${row.original.price.toFixed(2)}</span>
      ),
    },
    ...PERIODS.map(
      (p): ColumnDef<SectorPerformance> => ({
        id: p.key,
        header: p.label,
        size: 80,
        meta: {
          align: 'center',
          headerClassName:
            p.key === activePeriod ? 'text-foreground font-semibold' : undefined,
        },
        cell: ({ row }) => <ReturnCell value={row.original.returns[p.key]} />,
      }),
    ),
    {
      id: 'trend',
      header: '추이',
      size: 100,
      meta: { align: 'center' },
      cell: ({ row }) => <Sparkline data={row.original.trend} />,
    },
  ];
}
