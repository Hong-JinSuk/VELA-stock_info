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
  const line = coords
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
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

// 섹터별 고정 색 (gemini-server sector-bucket.ts의 10개 버킷과 1:1).
// 순서(비중 desc)와 무관하게 같은 섹터는 어느 행에서든 같은 색으로 보인다.
const SECTOR_COLOR_BY_NAME: Record<string, string> = {
  Technology: 'bg-blue-500',
  Financials: 'bg-emerald-500',
  'Health Care': 'bg-rose-500',
  Consumer: 'bg-amber-500',
  'Communication Services': 'bg-violet-500',
  Industrials: 'bg-slate-500',
  Energy: 'bg-orange-500',
  Materials: 'bg-teal-500',
  Utilities: 'bg-yellow-400',
  'Real Estate': 'bg-cyan-500',
};
const SECTOR_COLOR_FALLBACK = 'bg-zinc-400';

function sectorColor(sector: string): string {
  return SECTOR_COLOR_BY_NAME[sector] ?? SECTOR_COLOR_FALLBACK;
}

// TOP SECTORS: top 섹터를 상대 비율로 채운 바 + 상위 2개 레전드. 비중 desc 순서 유지.
function SectorBar({ sectors }: { sectors: ThirteenFTopSector[] }) {
  const top = sectors.slice(0, 4);
  if (top.length === 0) return <Dash />;
  const sum = top.reduce((acc, s) => acc + s.weightPercent, 0) || 1;
  return (
    <div className="w-full">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {top.map((s) => (
          <div
            key={s.sector}
            className={cn('h-full', sectorColor(s.sector))}
            style={{ width: `${(s.weightPercent / sum) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
        {top.slice(0, 2).map((s) => (
          <span key={s.sector} className="flex items-center gap-1">
            <span
              className={cn('size-1.5 rounded-full', sectorColor(s.sector))}
            />
            <span className="truncate">{s.sector}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// 세로로 쌓이는 종목 칩. ticker 있으면 ticker, 없으면 이름으로 폴백(잘라서).
function TickerChips({
  items,
}: {
  items: { ticker: string | null; name: string }[];
}) {
  const shown = items.slice(0, 3);
  if (shown.length === 0) return <Dash />;
  return (
    <div className="flex flex-col items-start gap-1">
      {shown.map((x, i) => (
        <span
          key={x.ticker ?? `${x.name}-${i}`}
          className="max-w-[100px] truncate rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium"
        >
          {x.ticker ?? x.name}
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
  const shown = trades.slice(0, 3);
  if (shown.length === 0) return <Dash />;
  return (
    <div className="flex flex-col items-start gap-1">
      {shown.map((t, i) => (
        <span
          key={t.ticker ?? `${t.name}-${i}`}
          className={cn(
            'max-w-[100px] truncate rounded px-1.5 py-0.5 text-[11px] font-medium',
            kind === 'buy'
              ? 'bg-emerald-500/15 text-emerald-500'
              : 'bg-red-500/15 text-red-500',
          )}
        >
          {kind === 'buy' ? '+' : '-'}
          {t.ticker ?? t.name}
        </span>
      ))}
    </div>
  );
}

export const thirteenFColumns: ColumnDef<ThirteenFListItem>[] = [
  {
    accessorKey: 'filerName',
    header: '펀드 / 매니저',
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
          {row.original.krName && (
            <p className="truncate text-[11px] text-muted-foreground">
              {row.original.krName}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    id: 'aum',
    header: '운용자산',
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
    header: '전분기 대비',
    size: 90,
    meta: { align: 'center' },
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
    header: '추이',
    size: 100,
    meta: { align: 'center' },
    cell: ({ row }) => <Sparkline data={row.original.summary?.trend ?? []} />,
  },
  {
    id: 'holdings',
    header: '보유 종목 수',
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
    header: '주요 섹터',
    size: 160,
    cell: ({ row }) => (
      <SectorBar sectors={row.original.summary?.topSectors ?? []} />
    ),
  },
  {
    id: 'topHoldings',
    header: '주요 보유',
    size: 110,
    cell: ({ row }) => (
      <TickerChips items={row.original.summary?.topHoldings ?? []} />
    ),
  },
  {
    id: 'topBuys',
    header: '주요 매수',
    size: 110,
    cell: ({ row }) => (
      <TradeChips trades={row.original.summary?.topBuys ?? []} kind="buy" />
    ),
  },
  {
    id: 'topSells',
    header: '주요 매도',
    size: 110,
    cell: ({ row }) => (
      <TradeChips trades={row.original.summary?.topSells ?? []} kind="sell" />
    ),
  },
  {
    accessorKey: 'fileDate',
    header: '보고일',
    size: 110,
    meta: {
      align: 'center',
      headerClassName: 'text-muted-foreground',
      cellClassName: 'text-sm text-muted-foreground',
    },
  },
];
