'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTextClamp } from '@/hooks/use-text-clamp';
import { useOverviewInsight } from '@/lib/services/stock/use-overview-insight';
import { cn } from '@/lib/utils';
import { Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

interface SectorCardProps {
  name: string;
  reason: string;
  leading?: string[];
  tone: 'emerald' | 'red';
}

export default function OverviewAiInsight() {
  const { data, isLoading: loading, isError: error } = useOverviewInsight();
  const insight = data?.insight;
  const isToday = data?.isToday ?? true;

  return (
    <Card className="border border-border bg-card/40 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-none ring-0">
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-500/[0.03] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-sm text-indigo-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-semibold text-foreground tracking-tight">
              Today Insight
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isToday
                ? 'Vela AI가 분석한 오늘의 섹터 전망'
                : 'Vela AI가 분석한 최신 섹터 전망'}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {loading && !insight ? (
          <div className="space-y-6">
            {/* overview 자리 */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* sector 2-col grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['emerald', 'red'] as const).map((tone) => (
                <div key={tone} className="flex flex-col gap-4 flex-1">
                  <h4
                    className={cn(
                      'flex items-center gap-2 font-semibold px-1 shrink-0',
                      tone === 'emerald' ? 'text-emerald-500' : 'text-red-500',
                    )}
                  >
                    {tone === 'emerald' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {tone === 'emerald' ? '유망 섹터' : '부진 섹터'}
                  </h4>
                  <div className="flex flex-col gap-4 flex-1">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className="bg-secondary/30 border border-border rounded-xl p-4 flex-1 flex flex-col"
                      >
                        <Skeleton className="h-5 w-1/3 mb-2" />
                        <Skeleton className="h-5 w-28 mb-3" />
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-11/12" />
                          <Skeleton className="h-3 w-4/5" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-400 text-sm">{error}</div>
        ) : insight ? (
          <div className="space-y-6">
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-foreground font-medium leading-relaxed">
                "{insight.overview}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4 flex-1">
                <h4 className="flex items-center gap-2 text-emerald-500 font-semibold px-1 shrink-0">
                  <TrendingUp className="w-4 h-4" /> 유망 섹터
                </h4>
                <div className="flex flex-col gap-4 flex-1">
                  {insight.promisingSectors.map((sector, idx) => (
                    <SectorCard
                      key={idx}
                      name={sector.name}
                      reason={sector.reason}
                      leading={sector.leading}
                      tone="emerald"
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                <h4 className="flex items-center gap-2 text-red-500 font-semibold px-1 shrink-0">
                  <TrendingDown className="w-4 h-4" /> 부진 섹터
                </h4>
                <div className="flex flex-col gap-4 flex-1">
                  {insight.poorSectors.map((sector, idx) => (
                    <SectorCard
                      key={idx}
                      name={sector.name}
                      reason={sector.reason}
                      leading={sector.leading}
                      tone="red"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function SectorCard({ name, reason, leading, tone }: SectorCardProps) {
  const { ref, isClamped } = useTextClamp<HTMLParagraphElement>();
  const isMobile = useIsMobile();

  const chipClass =
    tone === 'emerald'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
      : 'border-red-500/25 bg-red-500/10 text-red-400';

  return (
    <div className="bg-secondary/30 border border-border rounded-xl p-4 flex-1 flex flex-col">
      <p className="font-semibold text-foreground mb-2 shrink-0">{name}</p>
      {leading && leading.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
          {/* {leading.map((s) => (
            <span
              key={s}
              className={cn(
                'text-[11px] px-2 py-0.5 rounded-md border tabular-nums whitespace-nowrap',
                chipClass,
              )}
            >
              {s}
            </span>
          ))} */}
          <span
            className={cn(
              'text-[11px] px-2 py-0.5 rounded-md border tabular-nums whitespace-nowrap',
              chipClass,
            )}
          >
            {leading[0]}
          </span>
        </div>
      )}
      <p>{}</p>
      <Tooltip>
        <TooltipTrigger asChild>
          <p
            ref={ref}
            className={cn(
              'text-sm text-muted-foreground leading-relaxed cursor-default text-left',
              !isMobile && 'line-clamp-5 ',
            )}
          >
            {reason}
          </p>
        </TooltipTrigger>
        {isClamped && (
          <TooltipContent className="max-w-xs">
            <p>{reason}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
