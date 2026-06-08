'use client';

import { fmtNum, shortExchange } from '@/lib/stock/format';
import type { StockProfile, StockQuote } from '@/types/stock';
import { ExternalLink, TrendingDown, TrendingUp } from 'lucide-react';

export default function StockHeaderCard({
  profile,
  quote,
}: {
  profile: StockProfile;
  quote: StockQuote;
}) {
  const down = quote.change < 0;
  const color = down ? 'text-rose-500' : 'text-emerald-500';
  const Arrow = down ? TrendingDown : TrendingUp;
  const exchangeShort = shortExchange(profile.exchange);

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {profile.logo ? (
          // 외부 로고 URL — next/image remotePatterns 설정 회피 위해 img 사용
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.logo}
            alt={profile.ticker}
            className="w-14 h-14 rounded-2xl object-contain bg-white/5 border border-border p-1 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-secondary border border-border shrink-0" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight">
              {profile.ticker}
            </h2>
            {exchangeShort && (
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground bg-secondary border border-border rounded-md px-2 py-0.5">
                {exchangeShort}
              </span>
            )}
          </div>
          {profile.weburl ? (
            <a
              href={profile.weburl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {profile.name}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">{profile.name}</p>
          )}
          {profile.industry && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {profile.industry}
            </p>
          )}
        </div>
      </div>

      <div className="text-left sm:text-right shrink-0">
        <div className="flex items-baseline gap-1.5 sm:justify-end">
          <span className="text-sm text-muted-foreground">
            {profile.currency}
          </span>
          <span className="text-4xl font-bold tracking-tight tabular-nums">
            {fmtNum(quote.current)}
          </span>
        </div>
        <div
          className={`flex items-center gap-1 sm:justify-end mt-1 font-semibold tabular-nums ${color}`}
        >
          <Arrow className="w-4 h-4" />
          {fmtNum(Math.abs(quote.change))} ({fmtNum(Math.abs(quote.percentChange))}
          %)
        </div>
      </div>
    </div>
  );
}
