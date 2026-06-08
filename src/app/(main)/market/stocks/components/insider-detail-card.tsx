'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { fmtShares } from '@/lib/stock/format';
import type { InsiderAnalysis } from '@/types/stock';
import { Activity } from 'lucide-react';

type Tone = 'buy' | 'sell' | 'neutral';

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) {
  const cls =
    tone === 'buy'
      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
      : tone === 'sell'
        ? 'border-rose-500/20 bg-rose-500/5 text-rose-400'
        : 'border-border bg-secondary/30 text-foreground/70';
  return (
    <div className={`rounded-xl border p-3 text-center ${cls}`}>
      <p className="text-[11px] text-muted-foreground break-keep">{label}</p>
      <p className="text-base font-bold tabular-nums mt-1">{fmtShares(value)}</p>
    </div>
  );
}

function InsiderBody({ analysis }: { analysis: InsiderAnalysis }) {
  const b = analysis.buckets;
  const buy = b.openMarketBuy;
  const sell = b.openMarketSell;
  // 비율 바는 신호(매수/매도)만. 중립(보상·옵션)은 물량이 압도적이라 같이 넣으면
  // 신호가 안 보임 → 아래에 수치로만 따로 표시.
  const signalTotal = buy + sell;
  const sPct = (v: number) => (signalTotal > 0 ? (v / signalTotal) * 100 : 0);

  return (
    <>
      {/* 매수 vs 매도 비율 (신호만) */}
      {signalTotal > 0 ? (
        <>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full mb-2.5">
            <div className="bg-emerald-500" style={{ width: `${sPct(buy)}%` }} />
            <div className="bg-rose-500" style={{ width: `${sPct(sell)}%` }} />
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              매수 신호
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              매도 신호
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground/60 mb-5">
          최근 12개월 공개시장 매수/매도 내역 없음
        </p>
      )}

      {/* 신호: 공개시장 매수/매도 */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <StatCard label="공개시장 매수 (P)" value={buy} tone="buy" />
        <StatCard label="공개시장 매도 (S)" value={sell} tone="sell" />
      </div>

      {/* 중립 (참고) — 신호 아님, 수치만 */}
      <p className="flex items-center gap-2 text-sm font-semibold mb-1">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
        중립 <span className="text-xs font-normal text-muted-foreground/60">(참고 · 신호 아님)</span>
      </p>
      <p className="text-[11px] text-muted-foreground/60 mb-3">
        보상·옵션 수령, 세금 충당, 증여 등 — 일정·기계적 거래라 매매 신호로 보지 않음.
      </p>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="보상/옵션 수령" value={b.awardGrant} tone="neutral" />
        <StatCard label="세금/옵션비용" value={b.taxOption} tone="neutral" />
        <StatCard
          label="증여/기타"
          value={b.otherAcquisition + b.otherDisposition}
          tone="neutral"
        />
      </div>
    </>
  );
}

export default function InsiderDetailCard({
  analysis,
  loading,
}: {
  analysis: InsiderAnalysis | undefined;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4 shrink-0" />
          내부자 거래 유형별 분류 (최근 12개월)
        </div>
        <span className="text-xs text-muted-foreground/70 border border-border rounded-md px-2 py-1">
          단위: 주식 수
        </span>
      </div>

      {loading ? (
        <div>
          <Skeleton className="h-2.5 w-full mb-5" />
          <div className="grid grid-cols-2 gap-2 mb-5">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        </div>
      ) : !analysis || !analysis.hasData ? (
        <div className="py-8 text-center text-sm text-muted-foreground/60">
          데이터 없음
        </div>
      ) : (
        <InsiderBody analysis={analysis} />
      )}
    </div>
  );
}
