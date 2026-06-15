'use client';

import { BarChart3 } from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildSampleCandles } from './sample-data';

const RANGES = ['1개월', '6개월', '1년', 'YTD'] as const;
const ACTIVE_RANGE = '6개월';
const UP_COLOR = '#10b981';

function toMonthDay(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

// 종목 상세 데모 — 실제 차트(StockPriceChart)는 라이브 API 훅을 쓰므로,
// 같은 비주얼을 고정 샘플 시계열로 재현한 정적 차트.
export default function StockDetailDemo() {
  const data = buildSampleCandles();
  const first = data[0].close;
  const last = data[data.length - 1].close;
  const changePct = ((last - first) / first) * 100;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">AAPL</span>
            <span className="truncate text-xs text-muted-foreground">
              Apple Inc.
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              ${last.toFixed(2)}
            </span>
            <span className="text-sm font-medium tabular-nums text-emerald-500">
              +{changePct.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/40 p-0.5">
          {RANGES.map((r) => (
            <span
              key={r}
              className={`rounded-md px-2.5 py-1 text-xs ${
                r === ACTIVE_RANGE
                  ? 'bg-foreground font-medium text-background'
                  : 'text-muted-foreground'
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <BarChart3 className="h-4 w-4" />
        주가 추이 (일봉)
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="demoPriceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={UP_COLOR} stopOpacity={0.28} />
                <stop offset="100%" stopColor={UP_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={toMonthDay}
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={48}
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
              stroke={UP_COLOR}
              strokeWidth={2}
              fill="url(#demoPriceFill)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
