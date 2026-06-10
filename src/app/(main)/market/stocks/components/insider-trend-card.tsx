'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { InsiderMonthlyPoint } from '@/types/stock';
import { Activity } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function abbrev(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
}

export default function InsiderTrendCard({
  monthly,
  loading,
}: {
  monthly: InsiderMonthlyPoint[];
  loading: boolean;
}) {
  const hasData = monthly.some((m) => m.buy > 0 || m.sell > 0);
  const chartData = monthly.map((m) => ({
    label: `${Number(m.month.slice(5))}월`,
    buy: m.buy,
    sell: m.sell,
  }));

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6 flex flex-col">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Activity className="w-4 h-4" />
        내부자 공개시장 매매 (최근 12개월)
      </div>

      {loading ? (
        <Skeleton className="h-[260px] w-full" />
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 py-8">
          최근 12개월 공개시장 매수/매도 내역 없음
        </div>
      ) : (
        <>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#10b981"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickFormatter={abbrev}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f43f5e"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickFormatter={abbrev}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                  contentStyle={{
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value, name) => [
                    Number(value).toLocaleString('en-US'),
                    name === 'buy' ? '매수' : '매도',
                  ]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="buy"
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="sell"
                  fill="#f43f5e"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-5 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              매수 (좌측, 주)
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              매도 (우측, 주)
            </span>
          </div>
          <p className="text-center text-xs text-muted-foreground/60 mt-2">
            보상·세금 등 중립 거래를 제외한, 내부자의 재량적 공개시장 매매(P/S) 추이입니다.
          </p>
        </>
      )}
    </div>
  );
}
