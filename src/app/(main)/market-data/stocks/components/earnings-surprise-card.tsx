'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { EarningsSurprise } from '@/types/stock';
import { TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const BEAT = '#10b981'; // 예상 상회
const MISS = '#f43f5e'; // 예상 하회
const EST = '#64748b'; // 컨센서스(예상)

function fmtEps(v: number | null): string {
  return v == null ? '–' : `$${v.toFixed(2)}`;
}

function fmtPct(v: number | null): string {
  if (v == null) return '–';
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

export default function EarningsSurpriseCard({
  earnings,
  loading,
}: {
  earnings: EarningsSurprise | undefined;
  loading: boolean;
}) {
  const points = earnings?.points ?? [];
  const hasData = points.some((p) => p.actual != null || p.estimate != null);
  const latest = points[points.length - 1];

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6 flex flex-col">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <TrendingUp className="w-4 h-4" />
        실적 서프라이즈 (EPS)
      </div>

      {loading ? (
        <Skeleton className="h-[260px] w-full" />
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 py-8">
          실적 발표 데이터 없음
        </div>
      ) : (
        <>
          {/* 요약: 최근 서프라이즈 + 예상 상회 횟수 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {latest && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">최근 ({latest.label})</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${
                    latest.beat
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-rose-500/15 text-rose-500'
                  }`}
                >
                  {fmtPct(latest.surprisePercent)}
                </span>
              </div>
            )}
            {earnings && earnings.total > 0 && (
              <span className="text-xs text-muted-foreground">
                최근 {earnings.total}분기 중{' '}
                <span className="font-semibold text-emerald-500">
                  {earnings.beatCount}회
                </span>{' '}
                예상 상회
              </span>
            )}
          </div>

          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={points}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                barGap={2}
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
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickFormatter={(v) => `$${Number(v).toFixed(1)}`}
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
                  // 실제 막대는 <Cell>로 색을 칠해 series fill이 없어 툴팁 글자색이 미지정→안 보임.
                  // itemStyle로 두 항목 모두 읽기 좋은 밝은 색으로 고정.
                  itemStyle={{ color: '#e4e4e7' }}
                  formatter={(value, name) => [
                    fmtEps(Number(value)),
                    name === 'estimate' ? '예상' : '실제',
                  ]}
                />
                <Bar
                  dataKey="estimate"
                  fill={EST}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={34}
                />
                <Bar dataKey="actual" radius={[3, 3, 0, 0]} maxBarSize={34}>
                  {points.map((p) => (
                    <Cell key={p.period} fill={p.beat ? BEAT : MISS} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-5 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: EST }} />
              예상 EPS
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: BEAT }}
              />
              실제 (상회)
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: MISS }}
              />
              실제 (하회)
            </span>
          </div>
        </>
      )}
    </div>
  );
}
