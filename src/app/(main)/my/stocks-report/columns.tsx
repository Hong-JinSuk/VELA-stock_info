import { cn } from '@/lib/utils';
import type { StockReportItem } from '@/types/stocks-report';
import type { ColumnDef } from '@tanstack/react-table';

function usd(v: number | null): string {
  if (v == null) return '—';
  return `$${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Dash() {
  return <span className="text-muted-foreground/40">—</span>;
}

// "2026-06-17T..." → "06.17". 기준일(스냅샷) 표기.
function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${m}.${d}`;
}

// ROA 5단계 품질 → 색/라벨 (macro-card 신호 색과 같은 결).
function roaQuality(roa: number): { label: string; cls: string } {
  if (roa >= 15) return { label: '우수', cls: 'text-emerald-500' };
  if (roa >= 5) return { label: '양호', cls: 'text-sky-500' };
  if (roa >= 0) return { label: '보통', cls: 'text-muted-foreground' };
  return { label: '주의', cls: 'text-rose-500' };
}

export const stocksReportColumns: ColumnDef<StockReportItem>[] = [
  {
    accessorKey: 'name',
    header: '종목',
    cell: ({ row }) => {
      const { name, symbol, snapshotAt } = row.original;
      const d = shortDate(snapshotAt);
      return (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {name}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground/70">
            {symbol}
            {d && <span className="ml-1.5 not-italic">· {d} 기준</span>}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'price',
    header: '현재가',
    size: 96,
    meta: { align: 'right' },
    cell: ({ row }) => {
      const { status, price } = row.original;
      // 가격은 알면 항상 보여준다(추정 불가여도). 아직 스냅샷 전이면 '집계 중'.
      if (price != null && price > 0) {
        return <span className="text-sm tabular-nums">{usd(price)}</span>;
      }
      return (
        <span className="text-xs text-muted-foreground/60">
          {status === 'PENDING' ? '집계 중' : '—'}
        </span>
      );
    },
  },
  {
    accessorKey: 'fairValue',
    header: '적정주가',
    size: 96,
    meta: { align: 'right' },
    cell: ({ row }) => {
      const { status, fairValue } = row.original;
      if (status === 'PENDING')
        return <span className="text-xs text-muted-foreground/60">집계 중</span>;
      if (status === 'NO_DATA' || fairValue == null)
        return <span className="text-xs text-muted-foreground/50">추정 불가</span>;
      return (
        <span className="text-sm font-semibold tabular-nums">
          {usd(fairValue)}
        </span>
      );
    },
  },
  {
    accessorKey: 'upsidePct',
    header: '상승여력',
    size: 88,
    meta: { align: 'center' },
    cell: ({ row }) => {
      const { status, upsidePct } = row.original;
      if (status !== 'OK' || upsidePct == null) return <Dash />;
      const up = upsidePct >= 0;
      return (
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-xs font-medium tabular-nums',
            up
              ? 'bg-emerald-500/15 text-emerald-500'
              : 'bg-rose-500/15 text-rose-500',
          )}
        >
          {up ? '+' : ''}
          {upsidePct.toFixed(1)}%
        </span>
      );
    },
  },
  {
    accessorKey: 'roaTtm',
    header: 'ROA',
    size: 80,
    meta: { align: 'center' },
    cell: ({ row }) => {
      const { roaTtm } = row.original;
      if (roaTtm == null) return <Dash />;
      const q = roaQuality(roaTtm);
      return (
        <div className="flex flex-col items-center leading-tight">
          <span className={cn('text-sm font-medium tabular-nums', q.cls)}>
            {roaTtm.toFixed(1)}%
          </span>
          <span className={cn('text-[10px]', q.cls)}>{q.label}</span>
        </div>
      );
    },
  },
];
