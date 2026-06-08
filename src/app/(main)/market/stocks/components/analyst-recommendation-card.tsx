'use client';

import type { AnalystRecommendation } from '@/types/stock';
import { Activity } from 'lucide-react';

const SEGMENTS: Array<{
  key: keyof Pick<
    AnalystRecommendation,
    'strongBuy' | 'buy' | 'hold' | 'sell' | 'strongSell'
  >;
  label: string;
  bar: string;
  text: string;
}> = [
  { key: 'strongBuy', label: '강력 매수', bar: 'bg-emerald-600', text: 'text-emerald-500' },
  { key: 'buy', label: '매수', bar: 'bg-emerald-400', text: 'text-emerald-400' },
  { key: 'hold', label: '중립', bar: 'bg-amber-400', text: 'text-amber-400' },
  { key: 'sell', label: '매도', bar: 'bg-rose-400', text: 'text-rose-400' },
  { key: 'strongSell', label: '강력 매도', bar: 'bg-rose-600', text: 'text-rose-500' },
];

export default function AnalystRecommendationCard({
  rec,
}: {
  rec: AnalystRecommendation | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6 flex flex-col">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Activity className="w-4 h-4" />
        애널리스트 의견 (최근)
      </div>

      {!rec || rec.total === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 py-8">
          데이터 없음
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              기준일: {rec.period}
            </span>
            <span className="text-sm font-bold">총 {rec.total}명</span>
          </div>

          <div className="flex h-2.5 w-full overflow-hidden rounded-full">
            {SEGMENTS.map((s) => {
              const v = rec[s.key];
              if (v <= 0) return null;
              return (
                <div
                  key={s.key}
                  className={s.bar}
                  style={{ width: `${(v / rec.total) * 100}%` }}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-5 gap-1 mt-4 text-center">
            {SEGMENTS.map((s) => (
              <div key={s.key}>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className={`text-sm font-bold mt-1 ${s.text}`}>
                  {rec[s.key]}명
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
