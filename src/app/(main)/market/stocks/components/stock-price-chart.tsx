'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  type CandleRange,
  useStockCandle,
} from '@/lib/services/stock/use-stock-candle';
import { toMonthDay } from '@/lib/stock/format';
import { BarChart3 } from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const RANGES: Array<{ value: CandleRange; label: string }> = [
  { value: '1mo', label: '1개월' },
  { value: '6mo', label: '6개월' },
  { value: '1y', label: '1년' },
  { value: 'ytd', label: 'YTD' },
];

export default function StockPriceChart({ ticker }: { ticker: string }) {
  const [range, setRange] = useState<CandleRange>('6mo');
  const { data, isLoading } = useStockCandle(ticker, range);
  const points = data ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="w-4 h-4" />
          주가 추이 (일봉)
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/40 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                range === r.value
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[320px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : points.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground/60">
            차트 데이터를 불러올 수 없습니다.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 10, right: 8, bottom: 0, left: 8 }}
            >
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={toMonthDay}
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => `$${Math.round(v)}`}
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, '종가']}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#priceFill)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
