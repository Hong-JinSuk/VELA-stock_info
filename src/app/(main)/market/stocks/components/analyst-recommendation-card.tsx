'use client';

import { Separator } from '@/components/ui/separator';
import type { AnalystRecommendation } from '@/types/stock';
import { Activity } from 'lucide-react';

// 0~100 합의점수 구간(각 20). CNN Fear&Greed처럼 바늘이 가리키는 구간만 색으로 강조.
const ZONES: Array<{
  key: keyof Pick<
    AnalystRecommendation,
    'strongSell' | 'sell' | 'hold' | 'buy' | 'strongBuy'
  >;
  label: string;
  color: string; // SVG stroke/fill용 hex (다크테마 대비 vivid)
  textClass: string;
}> = [
  {
    key: 'strongSell',
    label: '강력매도',
    color: '#e11d48',
    textClass: 'text-rose-500',
  },
  { key: 'sell', label: '매도', color: '#fb7185', textClass: 'text-rose-400' },
  { key: 'hold', label: '중립', color: '#f59e0b', textClass: 'text-amber-400' },
  {
    key: 'buy',
    label: '매수',
    color: '#34d399',
    textClass: 'text-emerald-400',
  },
  {
    key: 'strongBuy',
    label: '강력매수',
    color: '#059669',
    textClass: 'text-emerald-500',
  },
];

// 게이지 기하 (viewBox 240×150).
const CX = 120;
const CY = 116;
const R = 84;
const STROKE = 20;
const LABEL_R = R + 17;
const TICK_R = R - STROKE - 7;

// 합의점수: 가중평균(강력매수5 … 강력매도1)을 0~100으로 환산.
function consensusScore(rec: AnalystRecommendation): number {
  const w =
    rec.strongBuy * 5 +
    rec.buy * 4 +
    rec.hold * 3 +
    rec.sell * 2 +
    rec.strongSell * 1;
  return Math.round(((w / rec.total - 1) / 4) * 100);
}

// 점수(0=좌, 100=우)를 반원 위 좌표로. 각도 π(좌)→0(우).
function polar(score: number, r: number): [number, number] {
  const a = Math.PI * (1 - Math.max(0, Math.min(100, score)) / 100);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

function arcPath(s0: number, s1: number, r: number): string {
  const [x0, y0] = polar(s0, r);
  const [x1, y1] = polar(s1, r);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
}

function zoneIndex(score: number): number {
  return Math.min(ZONES.length - 1, Math.max(0, Math.floor(score / 20)));
}

export default function AnalystRecommendationCard({
  rec,
}: {
  rec: AnalystRecommendation | null;
}) {
  const hasData = rec && rec.total > 0;
  const score = hasData ? consensusScore(rec) : 0;
  const zi = zoneIndex(score);
  const zone = ZONES[zi];
  const [nx, ny] = polar(score, R - 6);

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6 flex flex-col">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Activity className="w-4 h-4" />
        애널리스트 의견 (최근)
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 py-8">
          데이터 없음
        </div>
      ) : (
        <>
          <svg
            viewBox="0 0 240 150"
            className="w-full max-w-[320px] mx-auto"
            role="img"
            aria-label={`애널리스트 합의 ${zone.label} ${score}`}
          >
            {/* 구간 아크: 활성 구간만 색, 나머지는 회색 */}
            {ZONES.map((z, i) => (
              <path
                key={z.key}
                d={arcPath(i * 20 + 1.2, (i + 1) * 20 - 1.2, R)}
                fill="none"
                stroke={i === zi ? z.color : 'rgba(148,163,184,0.18)'}
                strokeWidth={STROKE}
                strokeLinecap="butt"
              />
            ))}

            {/* 구간 라벨 */}
            {ZONES.map((z, i) => {
              const [lx, ly] = polar(i * 20 + 10, LABEL_R);
              return (
                <text
                  key={z.key}
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: 9, fontWeight: 600 }}
                >
                  {z.label}
                </text>
              );
            })}

            {/* 스케일 0 / 50 / 100 */}
            {[0, 50, 100].map((t) => {
              const [tx, ty] = polar(t, TICK_R);
              return (
                <text
                  key={t}
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground/50"
                  style={{ fontSize: 8 }}
                >
                  {t}
                </text>
              );
            })}

            {/* 바늘 + 피벗 */}
            <g className="text-foreground">
              <line
                x1={CX}
                y1={CY}
                x2={nx}
                y2={ny}
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
              />
              <circle cx={CX} cy={CY} r={6} fill="currentColor" />
            </g>

            {/* 점수 + 구간명 */}
            <text
              x={CX}
              y={CY + 26}
              textAnchor="middle"
              style={{ fontSize: 30, fontWeight: 800 }}
              fill={zone.color}
            >
              {score}
            </text>
          </svg>

          <div
            className={`text-center -mt-1 text-sm font-bold ${zone.textClass}`}
          >
            {zone.label}
          </div>

          <Separator className="my-5" />

          <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-foreground">
            <span>기준일 {rec.period}</span>
            <span className="text-muted-foreground/30">·</span>
            <span>
              애널리스트{' '}
              <span className="font-semibold text-foreground/80">
                {rec.total}
              </span>
              명
            </span>
          </div>

          {/* 구간별 인원. 추천(바늘이 가리키는) 구간만 색 칩으로 강조. */}
          <div className="grid grid-cols-5 gap-1.5">
            {ZONES.map((z, i) => {
              const active = i === zi;
              return (
                <div
                  key={z.key}
                  className="flex flex-col items-center gap-1 rounded-xl border py-2 px-1 transition-colors"
                  style={
                    active
                      ? {
                          backgroundImage: `linear-gradient(160deg, ${z.color}40 0%, ${z.color}12 100%)`,
                          borderColor: `${z.color}66`,
                        }
                      : { borderColor: 'transparent' }
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: z.color }}
                  />
                  <span className={`text-[10px] leading-tight break-keep ${z.textClass}`}>
                    {z.label}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${z.textClass}`}>
                    {rec[z.key]}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
