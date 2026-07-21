'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useTokenThroughput } from '@/lib/services/indicators/use-token-throughput';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// 라인/영역 강조색 — sky-500. 라이트/다크 배경 모두 대비가 충분해 고정.
const ACCENT = '#0ea5e9';

// 토큰 수 축약 — OpenRouter 일별 총량은 보통 조 단위.
function fmtTokens(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)}조`;
  if (v >= 1e8) return `${(v / 1e8).toFixed(0)}억`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(0)}만`;
  return v.toLocaleString();
}

// AI 토큰 처리량(OpenRouter) 라인 그래프. 키 미설정/데이터 없음은 안내로 대체.
// 색은 currentColor(래퍼의 text-muted-foreground) + CSS 변수로 테마를 따라간다.
export default function TokenThroughputChart() {
  const { data, isLoading, isError } = useTokenThroughput();

  if (isLoading) return <Skeleton className="h-[220px] w-full rounded-lg" />;

  if (isError || !data || data.unavailable || data.points.length < 2) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border px-4 text-center text-xs text-muted-foreground/70 break-keep">
        {data?.unavailable
          ? 'OpenRouter API 키(OPENROUTER_API_KEY)가 설정되지 않아 그래프를 불러올 수 없어요.'
          : '데이터를 불러올 수 없습니다.'}
      </div>
    );
  }

  const chartData = data.points.map((p) => ({
    date: p.date.slice(5), // MM-DD
    tokens: p.tokens,
  }));

  return (
    <div className="h-[220px] w-full text-muted-foreground">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
        >
          <defs>
            <linearGradient id="tokenFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.15}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="currentColor"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            stroke="currentColor"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={46}
            tickFormatter={fmtTokens}
          />
          <Tooltip
            cursor={{ stroke: 'currentColor', strokeOpacity: 0.25 }}
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--popover-foreground)',
            }}
            labelStyle={{ color: 'var(--muted-foreground)' }}
            itemStyle={{ color: 'var(--popover-foreground)' }}
            formatter={(value) => [fmtTokens(Number(value)), '토큰']}
          />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#tokenFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
