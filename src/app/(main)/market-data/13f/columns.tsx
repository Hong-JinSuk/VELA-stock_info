import FavoriteButton from '@/components/common/favorite-button';
import Sparkline from '@/components/common/sparkline';
import { sectorColor } from '@/constants/sector-colors';
import { fmtUsdCompact } from '@/lib/stock/format';
import { cn } from '@/lib/utils';
import type {
  ThirteenFListItem,
  ThirteenFTopSector,
  ThirteenFTopTrade,
} from '@/types/thirteenf';
import type { ColumnDef } from '@tanstack/react-table';
import { Building2 } from 'lucide-react';

// 즐겨찾기 별표 컬럼 (목록 맨 앞에 붙여 쓴다). 기본 thirteenFColumns에는 포함하지 않아
// welcome 데모 등 즐겨찾기가 불필요한 곳은 영향 없음.
export const thirteenFFavoriteColumn: ColumnDef<ThirteenFListItem> = {
  id: 'favorite',
  header: '',
  size: 40,
  meta: { align: 'center' },
  cell: ({ row }) => (
    <FavoriteButton
      type="THIRTEENF_FILER"
      itemKey={row.original.cik}
      label={row.original.filerName}
      size={15}
    />
  ),
};

// summary 없는 행에서 리치 셀에 표시할 placeholder.
function Dash() {
  return <span className="text-muted-foreground/40">—</span>;
}

// "2025-09-30" → "2025 Q3". 구분기 summary 라벨용.
function quarterLabel(periodEnding: string): string {
  const [y, m] = periodEnding.split('-');
  const quarter = Math.ceil(Number(m) / 3);
  return `${y} Q${quarter}`;
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
      const { summary: s, summaryAsOf } = row.original;
      if (!s) return <Dash />;
      return (
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-semibold">{fmtUsdCompact(s.aumUsd)}</span>
          {/* 최신 분기가 아닌 마지막 보고 기준 데이터임을 표시 (보고 중단/지연 filer). */}
          {summaryAsOf && (
            <span className="whitespace-nowrap text-[10px] text-amber-500/80">
              {quarterLabel(summaryAsOf)} 기준
            </span>
          )}
        </div>
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
