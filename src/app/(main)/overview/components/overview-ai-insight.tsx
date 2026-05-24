'use client';

import { Card } from '@/components/ui/card';
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
}

export default function OverviewAiInsight() {
  const { data, isLoading: loading, isError: error } = useOverviewInsight();
  const insight = data?.insight;
  const isToday = data?.isToday ?? true;

  return (
    <Card className="border border-border bg-card/40 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-none ring-0 mt-8">
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
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">
              VELA AI가 시장 데이터를 바탕으로 시장을 분석 중입니다...
            </p>
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

function SectorCard({ name, reason }: SectorCardProps) {
  const { ref, isClamped } = useTextClamp<HTMLParagraphElement>();
  const isMobile = useIsMobile();

  return (
    <div className="bg-secondary/30 border border-border rounded-xl p-4 flex-1 flex flex-col">
      <p className="font-semibold text-foreground mb-2 shrink-0">{name}</p>
      <Tooltip>
        <TooltipTrigger asChild>
          <p
            ref={ref}
            className={cn(
              'text-sm text-muted-foreground leading-relaxed cursor-default text-left',
              !isMobile && 'line-clamp-3 ',
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
