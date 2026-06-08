'use client';

import { fmtMarketCap, fmtNum } from '@/lib/stock/format';
import type { StockProfile, StockQuote } from '@/types/stock';
import { Activity } from 'lucide-react';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export default function StockQuoteCard({
  quote,
  profile,
}: {
  quote: StockQuote;
  profile: StockProfile;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Activity className="w-4 h-4" />
        현재가 정보
      </div>
      <Row label="전일종가" value={fmtNum(quote.previousClose)} />
      <Row label="시가" value={fmtNum(quote.open)} />
      <Row
        label="당일 변동폭"
        value={`${fmtNum(quote.low)} – ${fmtNum(quote.high)}`}
      />
      <Row label="시가총액" value={fmtMarketCap(profile.marketCap)} />
    </div>
  );
}
