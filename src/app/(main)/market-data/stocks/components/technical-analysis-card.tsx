'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useStockCandle } from '@/lib/services/stock/use-stock-candle';
import { toMonthDay } from '@/lib/stock/format';
import { analyzeTechnicals } from '@/lib/stock/technicals';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';
import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const MA20 = '#f59e0b'; // amber
const MA60 = '#38bdf8'; // sky
const MA120 = '#a78bfa'; // purple
const CLOSE = '#e4e4e7'; // 종가
const UP = '#10b981';
const DOWN = '#f43f5e';
const GRID = '#27272a';
const AXIS = '#71717a';

const TOOLTIP_STYLE = {
  background: '#0a0a0a',
  border: '1px solid #27272a',
  borderRadius: 8,
  fontSize: 12,
} as const;

function Chip({
  label,
  value,
  cls,
}: {
  label: string;
  value: string;
  cls?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card/40 px-3 py-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold', cls)}>{value}</span>
    </div>
  );
}

export default function TechnicalAnalysisCard({ ticker }: { ticker: string }) {
  // 1년 일봉으로 계산(120일선·MACD가 충분한 히스토리를 필요로 함). 외부 지표 API 없이 직접 계산.
  const { data: candles, isLoading } = useStockCandle(ticker, '1y');
  const { summary, rows } = useMemo(
    () => analyzeTechnicals(candles ?? []),
    [candles],
  );

  const trendText =
    summary.trend === 'up'
      ? '상승 추세 (정배열)'
      : summary.trend === 'down'
        ? '하락 추세 (역배열)'
        : summary.trend === 'mixed'
          ? '혼조'
          : '–';
  const trendCls =
    summary.trend === 'up'
      ? 'text-emerald-500'
      : summary.trend === 'down'
        ? 'text-rose-500'
        : 'text-muted-foreground';

  const crossText = summary.cross
    ? summary.cross.type === 'golden'
      ? `골든크로스 (${summary.cross.daysAgo}일 전)`
      : `데드크로스 (${summary.cross.daysAgo}일 전)`
    : '최근 없음';
  const crossCls = !summary.cross
    ? 'text-muted-foreground'
    : summary.cross.type === 'golden'
      ? 'text-emerald-500'
      : 'text-rose-500';

  const rsiText =
    summary.rsi == null
      ? '–'
      : `${summary.rsi.toFixed(0)} · ${
          summary.rsiZone === 'overbought'
            ? '과매수'
            : summary.rsiZone === 'oversold'
              ? '과매도'
              : '중립'
        }`;
  const rsiCls =
    summary.rsiZone === 'overbought'
      ? 'text-rose-500'
      : summary.rsiZone === 'oversold'
        ? 'text-sky-500'
        : 'text-foreground';

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6 flex flex-col">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Activity className="w-4 h-4" />
        기술적 분석 (최근 1년)
      </div>

      {isLoading ? (
        <Skeleton className="h-[420px] w-full" />
      ) : !summary.hasData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 py-8">
          기술적 분석에 필요한 데이터가 부족합니다.
        </div>
      ) : (
        <>
          {/* 요약 칩 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Chip label="추세" value={trendText} cls={trendCls} />
            <Chip label="20·60 크로스" value={crossText} cls={crossCls} />
            <Chip label="RSI(14)" value={rsiText} cls={rsiCls} />
          </div>

          {/* 가격 + 이동평균선 */}
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={rows}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={AXIS}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={48}
                  tickFormatter={toMonthDay}
                />
                <YAxis
                  stroke={AXIS}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: '#a1a1aa' }}
                  labelFormatter={(l) => String(l)}
                  formatter={(value, name) => [
                    value == null ? '–' : `$${Number(value).toFixed(2)}`,
                    name,
                  ]}
                />
                <Line type="monotone" dataKey="close" name="종가" stroke={CLOSE} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="ma20" name="MA20" stroke={MA20} strokeWidth={1} dot={false} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="ma60" name="MA60" stroke={MA60} strokeWidth={1} dot={false} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="ma120" name="MA120" stroke={MA120} strokeWidth={1} dot={false} connectNulls isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
            <Legend color={CLOSE} label="종가" />
            <Legend color={MA20} label="20일" />
            <Legend color={MA60} label="60일" />
            <Legend color={MA120} label="120일" />
          </div>

          {/* RSI */}
          <div className="mt-5 text-xs text-muted-foreground mb-1">RSI (14)</div>
          <div className="h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={rows}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  stroke={AXIS}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  domain={[0, 100]}
                  ticks={[30, 50, 70]}
                />
                <ReferenceLine y={70} stroke={DOWN} strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={30} stroke={UP} strokeDasharray="3 3" strokeOpacity={0.5} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value) => [value == null ? '–' : Number(value).toFixed(1), 'RSI']}
                />
                <Line type="monotone" dataKey="rsi" name="RSI" stroke="#c084fc" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* MACD */}
          <div className="mt-5 text-xs text-muted-foreground mb-1">MACD (12·26·9)</div>
          <div className="h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={rows}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} width={48} />
                <ReferenceLine y={0} stroke={AXIS} strokeOpacity={0.4} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value, name) => [value == null ? '–' : Number(value).toFixed(2), name]}
                />
                <Bar dataKey="hist" name="히스토그램">
                  {rows.map((r) => (
                    <Cell
                      key={r.date}
                      fill={(r.hist ?? 0) >= 0 ? UP : DOWN}
                      fillOpacity={0.5}
                    />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="macd" name="MACD" stroke={MA60} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="signal" name="시그널" stroke={MA20} strokeWidth={1} dot={false} connectNulls isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground/60 break-keep">
            Yahoo 일봉 종가로 직접 산출한 추세 참고 지표입니다. 매매 판단의 보조용으로만 활용하세요.
          </p>
        </>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-3 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
