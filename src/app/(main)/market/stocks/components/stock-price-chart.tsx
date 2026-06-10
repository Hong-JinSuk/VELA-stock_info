'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  type CandleRange,
  useStockCandle,
} from '@/lib/services/stock/use-stock-candle';
import { toMonthDay } from '@/lib/stock/format';
import type { PriceTarget, StockCandlePoint } from '@/types/stock';
import { BarChart3 } from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  ReferenceDot,
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

const TARGET_COLOR = '#10b981'; // 기본(매수) 폴백
// 목표가 팬이 차지할 우측 폭 비율 (히스토리 길이 대비).
const FAN_FRACTION = 0.22;
// 색 임계: 현재가 대비 -3% 이하 → 빨강, +10% 이상 → 초록, 그 사이는 노랑을 거치는 연속 보간.
const FAN_DOWN = -0.03;
const FAN_UP = 0.1;
const RED: [number, number, number] = [244, 63, 94]; // #f43f5e
const YELLOW: [number, number, number] = [245, 158, 11]; // #f59e0b
const GREEN: [number, number, number] = [16, 185, 129]; // #10b981

function lerp(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// 목표가 값 vs 현재가 → 색. -3%↓ 빨강, +10%↑ 초록, 사이는 빨강→노랑→초록 연속 보간.
function sentimentColor(value: number, current: number): string {
  const r = (value - current) / current;
  const t = Math.max(0, Math.min(1, (r - FAN_DOWN) / (FAN_UP - FAN_DOWN)));
  return t < 0.5
    ? lerp(RED, YELLOW, t / 0.5)
    : lerp(YELLOW, GREEN, (t - 0.5) / 0.5);
}

type Row = {
  date: string;
  close: number | null;
  tMean?: number | null;
  tHigh?: number | null;
  tLow?: number | null;
  band?: [number, number] | null; // [저, 고] 범위 영역(그라데이션 fill)
};

// 히스토리 + (목표가 ON일 때) 현재가 → 평균/고/저로 뻗는 미래 팬 구간을 붙인다.
// 엘보(마지막 히스토리 지점)에서 현재가로부터 세 선이 출발, ~12개월 뒤 지점에서 목표가에 도달.
function buildChartData(
  points: StockCandlePoint[],
  target: PriceTarget | null,
  show: boolean,
): { data: Row[]; horizonDate: string | null; anchorDate: string | null } {
  const data: Row[] = points.map((p) => ({ date: p.date, close: p.close }));
  if (!show || !target || points.length === 0) {
    return { data, horizonDate: null, anchorDate: null };
  }
  const histLen = points.length;
  const futureN = Math.max(8, Math.round(histLen * FAN_FRACTION));
  const anchorDate = points[histLen - 1].date;
  data[histLen - 1] = {
    ...data[histLen - 1],
    tMean: target.current,
    tHigh: target.current,
    tLow: target.current,
    band: [target.current, target.current], // 엘보: 폭 0에서 시작
  };
  const start = new Date(anchorDate);
  let horizonDate = anchorDate;
  for (let i = 1; i <= futureN; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + Math.round((i * 365) / futureN));
    const date = d.toISOString().slice(0, 10);
    const horizon = i === futureN;
    if (horizon) horizonDate = date;
    data.push({
      date,
      close: null,
      tMean: horizon ? target.mean : null,
      tHigh: horizon ? target.high : null,
      tLow: horizon ? target.low : null,
      band: horizon ? [target.low, target.high] : null,
    });
  }
  return { data, horizonDate, anchorDate };
}

const TOOLTIP_LABELS: Record<string, string> = {
  close: '종가',
  tMean: '목표 평균',
  tHigh: '목표 고',
  tLow: '목표 저',
};

export default function StockPriceChart({
  ticker,
  priceTarget,
}: {
  ticker: string;
  priceTarget?: PriceTarget | null;
}) {
  const [range, setRange] = useState<CandleRange>('6mo');
  const [showTarget, setShowTarget] = useState(false);
  const { data, isLoading } = useStockCandle(ticker, range);
  const points = data ?? [];

  const canTarget = !!priceTarget;
  const show = showTarget && canTarget;
  const { data: chartData, horizonDate, anchorDate } = buildChartData(
    points,
    priceTarget ?? null,
    show,
  );
  const upside = priceTarget
    ? ((priceTarget.mean - priceTarget.current) / priceTarget.current) * 100
    : 0;
  const upsideStr = `${upside >= 0 ? '+' : ''}${upside.toFixed(1)}%`;
  // 팬 각 선을 자기 값(고/평균/저) vs 현재가 기준으로 색칠.
  const highColor = priceTarget
    ? sentimentColor(priceTarget.high, priceTarget.current)
    : TARGET_COLOR;
  const meanColor = priceTarget
    ? sentimentColor(priceTarget.mean, priceTarget.current)
    : TARGET_COLOR;
  const lowColor = priceTarget
    ? sentimentColor(priceTarget.low, priceTarget.current)
    : TARGET_COLOR;
  // 가격선 색 = 표시 기간의 등락(첫 종가 대비 마지막 종가). 상승=초록, 하락=빨강.
  const firstClose = points.length ? points[0].close : null;
  const lastClose = points.length ? points[points.length - 1].close : null;
  const priceUp =
    firstClose != null && lastClose != null ? lastClose >= firstClose : true;
  const priceColor = priceUp ? '#10b981' : '#f43f5e';

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="w-4 h-4" />
          주가 추이 (일봉)
        </div>
        <div className="flex items-center gap-2">
          {canTarget && (
            <button
              type="button"
              onClick={() => setShowTarget((v) => !v)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                show
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-medium'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              목표주가
            </button>
          )}
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
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: show ? 76 : 8, bottom: 0, left: 8 }}
            >
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={priceColor} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={priceColor} stopOpacity={0} />
                </linearGradient>
                {/* 목표가 팬(고~저) 영역: 위 초록 → 가운데 노랑 → 아래 빨강 세로 그라데이션 */}
                <linearGradient id="fanFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.13} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.22} />
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
                formatter={(value, name) => {
                  if (value == null) return ['', ''];
                  return [
                    `$${Number(value).toFixed(2)}`,
                    TOOLTIP_LABELS[String(name)] ?? String(name),
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={priceColor}
                strokeWidth={2}
                fill="url(#priceFill)"
                dot={false}
                isAnimationActive={false}
              />

              {show && (
                <Area
                  dataKey="band"
                  stroke="none"
                  fill="url(#fanFill)"
                  connectNulls
                  isAnimationActive={false}
                />
              )}

              {show && (
                <>
                  <Line
                    dataKey="tHigh"
                    stroke={highColor}
                    strokeWidth={1.5}
                    strokeDasharray="2 4"
                    strokeOpacity={0.5}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="tLow"
                    stroke={lowColor}
                    strokeWidth={1.5}
                    strokeDasharray="2 4"
                    strokeOpacity={0.5}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="tMean"
                    stroke={meanColor}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </>
              )}

              {show && priceTarget && anchorDate && horizonDate && (
                <>
                  <ReferenceDot
                    x={anchorDate}
                    y={priceTarget.current}
                    r={3}
                    fill={priceColor}
                    stroke="none"
                    label={{
                      value: `현재 $${priceTarget.current.toFixed(0)}`,
                      position: 'left',
                      fill: priceColor,
                      fontSize: 10,
                    }}
                  />
                  <ReferenceDot
                    x={horizonDate}
                    y={priceTarget.high}
                    r={3}
                    fill={highColor}
                    fillOpacity={0.7}
                    stroke="none"
                    label={{
                      value: `고 $${priceTarget.high.toFixed(0)}`,
                      position: 'right',
                      fill: highColor,
                      fontSize: 10,
                    }}
                  />
                  <ReferenceDot
                    x={horizonDate}
                    y={priceTarget.low}
                    r={3}
                    fill={lowColor}
                    fillOpacity={0.7}
                    stroke="none"
                    label={{
                      value: `저 $${priceTarget.low.toFixed(0)}`,
                      position: 'right',
                      fill: lowColor,
                      fontSize: 10,
                    }}
                  />
                  <ReferenceDot
                    x={horizonDate}
                    y={priceTarget.mean}
                    r={3.5}
                    fill={meanColor}
                    stroke="none"
                    label={{
                      value: `평균 $${priceTarget.mean.toFixed(0)}`,
                      position: 'right',
                      fill: meanColor,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {show && priceTarget && (
        <p className="text-center text-xs text-muted-foreground/60 mt-2 break-keep">
          애널리스트 {priceTarget.count}명의 12개월 목표주가 컨센서스 (Yahoo) ·
          현재가 대비 평균 {upsideStr}
        </p>
      )}
    </div>
  );
}
