import { cn } from '@/lib/utils';
import type {
  ThirteenFListItem,
  ThirteenFTopSector,
  ThirteenFTopTrade,
} from '@/types/thirteenf';
import type { ColumnDef } from '@tanstack/react-table';
import { Building2 } from 'lucide-react';
import { useId } from 'react';

// summary 없는 행에서 리치 셀에 표시할 placeholder.
function Dash() {
  return <span className="text-muted-foreground/40">—</span>;
}

// $431.76B / $18.21B / $431.8M 형태.
function formatAum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

// 분기별 AUM 시계열 sparkline (inline SVG). 상승=emerald, 하락=red.
function Sparkline({ data }: { data: number[] }) {
  const gradientId = useId();
  if (data.length < 2) return <Dash />;
  const w = 72;
  const h = 28;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const coords = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  // 라인 아래 채움 영역: 라인 점들 → 오른쪽 끝 바닥 → 왼쪽 끝 바닥 (polygon 자동 닫힘).
  const area = `${line} ${coords[coords.length - 1][0].toFixed(1)},${h} ${coords[0][0].toFixed(1)},${h}`;
  const up = data[data.length - 1] >= data[0];
  return (
    <svg
      width={w}
      height={h}
      className={up ? 'text-emerald-500' : 'text-red-500'}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SECTOR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
];

// TOP SECTORS: top 섹터를 상대 비율로 채운 바 + 상위 2개 레전드.
function SectorBar({ sectors }: { sectors: ThirteenFTopSector[] }) {
  const top = sectors.slice(0, 4);
  if (top.length === 0) return <Dash />;
  const sum = top.reduce((acc, s) => acc + s.weightPercent, 0) || 1;
  return (
    <div className="w-full">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {top.map((s, i) => (
          <div
            key={s.sector}
            className={cn('h-full', SECTOR_COLORS[i % SECTOR_COLORS.length])}
            style={{ width: `${(s.weightPercent / sum) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
        {top.slice(0, 2).map((s, i) => (
          <span key={s.sector} className="flex items-center gap-1">
            <span
              className={cn(
                'size-1.5 rounded-full',
                SECTOR_COLORS[i % SECTOR_COLORS.length],
              )}
            />
            <span className="truncate">{s.sector}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// 세로로 쌓이는 ticker 칩.
function TickerChips({ tickers }: { tickers: (string | null)[] }) {
  const shown = tickers.filter((t): t is string => !!t).slice(0, 3);
  if (shown.length === 0) return <Dash />;
  return (
    <div className="flex flex-col items-start gap-1">
      {shown.map((t) => (
        <span
          key={t}
          className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

// TOP BUYS(+, emerald) / TOP SELLS(-, red) 칩.
function TradeChips({
  trades,
  kind,
}: {
  trades: ThirteenFTopTrade[];
  kind: 'buy' | 'sell';
}) {
  const shown = trades.filter((t) => !!t.ticker).slice(0, 2);
  if (shown.length === 0) return <Dash />;
  return (
    <div className="flex flex-col items-start gap-1">
      {shown.map((t) => (
        <span
          key={t.ticker}
          className={cn(
            'rounded px-1.5 py-0.5 text-[11px] font-medium',
            kind === 'buy'
              ? 'bg-emerald-500/15 text-emerald-500'
              : 'bg-red-500/15 text-red-500',
          )}
        >
          {kind === 'buy' ? '+' : '-'}
          {t.ticker}
        </span>
      ))}
    </div>
  );
}

export const thirteenFColumns: ColumnDef<ThirteenFListItem>[] = [
  {
    accessorKey: 'filerName',
    header: 'FUND / MANAGER',
    size: 260,
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Building2 className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {row.original.filerName}
          </p>
          <p className="truncate font-mono text-[10px] text-muted-foreground/70">
            {row.original.accession}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'aum',
    header: 'AUM',
    size: 110,
    meta: { align: 'right' },
    cell: ({ row }) => {
      const s = row.original.summary;
      return s ? (
        <span className="text-sm font-semibold">{formatAum(s.aumUsd)}</span>
      ) : (
        <Dash />
      );
    },
  },
  {
    id: 'qoq',
    header: 'Q/Q',
    size: 90,
    meta: { align: 'right' },
    cell: ({ row }) => {
      const v = row.original.summary?.qoqPercent;
      if (v == null) return <Dash />;
      const up = v >= 0;
      return (
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[11px] font-medium',
            up
              ? 'bg-emerald-500/15 text-emerald-500'
              : 'bg-red-500/15 text-red-500',
          )}
        >
          {up ? '+' : ''}
          {v.toFixed(1)}%
        </span>
      );
    },
  },
  {
    id: 'trend',
    header: 'TREND',
    size: 100,
    cell: ({ row }) => <Sparkline data={row.original.summary?.trend ?? []} />,
  },
  {
    id: 'holdings',
    header: 'HOLDINGS',
    size: 90,
    meta: { align: 'right' },
    cell: ({ row }) => {
      const s = row.original.summary;
      return s ? (
        <span className="text-sm">{s.holdingCount.toLocaleString()}</span>
      ) : (
        <Dash />
      );
    },
  },
  {
    id: 'sectors',
    header: 'TOP SECTORS',
    size: 160,
    cell: ({ row }) => <SectorBar sectors={row.original.summary?.topSectors ?? []} />,
  },
  {
    id: 'topHoldings',
    header: 'TOP HOLDINGS',
    size: 110,
    cell: ({ row }) => (
      <TickerChips
        tickers={(row.original.summary?.topHoldings ?? []).map((h) => h.ticker)}
      />
    ),
  },
  {
    id: 'topBuys',
    header: 'TOP BUYS',
    size: 110,
    cell: ({ row }) => (
      <TradeChips trades={row.original.summary?.topBuys ?? []} kind="buy" />
    ),
  },
  {
    id: 'topSells',
    header: 'TOP SELLS',
    size: 110,
    cell: ({ row }) => (
      <TradeChips trades={row.original.summary?.topSells ?? []} kind="sell" />
    ),
  },
  {
    accessorKey: 'fileDate',
    header: 'REPORTED',
    size: 110,
    meta: {
      align: 'right',
      headerClassName: 'text-muted-foreground',
      cellClassName: 'text-sm text-muted-foreground',
    },
  },
];
