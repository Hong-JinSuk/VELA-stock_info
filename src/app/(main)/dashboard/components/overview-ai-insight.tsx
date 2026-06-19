'use client';

import SkeletonCard from '@/components/common/skeleton-card';
import SkeletonRow from '@/components/common/skeleton-row';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOverviewInsight } from '@/lib/services/stock/use-overview-insight';
import { cn } from '@/lib/utils';
import { Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { type CSSProperties } from 'react';

interface SectorCardProps {
  name: string;
  reason: string;
  leading?: string[];
  tone: 'emerald' | 'red';
}

const descriptionInsight =
  'Today Insight는 최근 2주 데이터 기반으로 제공하고 있습니다.';

export default function OverviewAiInsight() {
  const { data, isLoading: loading, isError: error } = useOverviewInsight();
  const isMobile = useIsMobile();
  const insight = data?.insight;
  const isToday = data?.isToday ?? true;
  // subgrid 행 개수 = 두 컬럼 중 더 많은 섹터 수 (헤더 행은 별도). 같은 행 카드 높이 정렬용.
  const rowCount = Math.max(
    insight?.promisingSectors.length ?? 0,
    insight?.poorSectors.length ?? 0,
  );

  return (
    <Card className="border border-border bg-card/40 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-none ring-0 sm:h-full sm:min-h-0">
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-500/[0.03] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
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
        {isMobile ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground/40 text-muted-foreground text-[9px] font-bold cursor-default shrink-0">
                ?
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="w-auto p-2 px-3 text-sm">
              <p>{descriptionInsight}</p>
            </PopoverContent>
          </Popover>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground/40 text-muted-foreground text-[9px] font-bold cursor-default shrink-0">
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{descriptionInsight}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* 데스크톱: 카드(고정높이 박스) 안에서 본문만 스크롤. 모바일: 페이지가 스크롤하므로 그대로 */}
      <div className="relative z-10 sm:flex-1 sm:min-h-0 sm:overflow-y-auto no-scrollbar sm:pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
        {loading && !insight ? (
          <div className="space-y-6">
            <SkeletonRow count={1} />
            <SkeletonCard rows={2} cols={2} />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-400 text-sm">{error}</div>
        ) : insight ? (
          <div className="@container space-y-6">
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-foreground font-medium leading-relaxed">
                &ldquo;{insight.overview}&rdquo;
              </p>
            </div>

            {/*
              카드(컨테이너) 폭 기준: 500px 미만 1열(세로), 이상 2열.
              데스크톱은 각 컬럼을 subgrid로 만들어 부모의 행 트랙을 공유 → 같은 행의
              유망/부진 카드 높이가 더 큰 쪽 기준으로 정렬됨. (모바일은 그룹별 세로 스택)
            */}
            <div
              className="grid grid-cols-1 gap-6 @[500px]:grid-cols-2 @[500px]:gap-x-6 @[500px]:gap-y-4 @[500px]:[grid-template-rows:auto_repeat(var(--rows),auto)]"
              style={{ '--rows': rowCount } as CSSProperties}
            >
              <div className="flex flex-col gap-4 @[500px]:grid @[500px]:grid-rows-subgrid @[500px]:row-span-full">
                <h4 className="flex items-center gap-2 text-emerald-500 font-semibold px-1 shrink-0">
                  <TrendingUp className="w-4 h-4" /> 유망 섹터
                </h4>
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

              <div className="flex flex-col gap-4 @[500px]:grid @[500px]:grid-rows-subgrid @[500px]:row-span-full">
                <h4 className="flex items-center gap-2 text-red-500 font-semibold px-1 shrink-0">
                  <TrendingDown className="w-4 h-4" /> 부진 섹터
                </h4>
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
        ) : null}
      </div>
    </Card>
  );
}

function SectorCard({ name, reason, leading, tone }: SectorCardProps) {
  const chipClass =
    tone === 'emerald'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
      : 'border-red-500/25 bg-red-500/10 text-red-400';

  return (
    <div className="bg-secondary/30 border border-border rounded-xl p-4 flex-1 flex flex-col">
      <div className="mb-2">
        <p className="font-semibold text-foreground">{name}</p>
        {leading && leading.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
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
      </div>
      {/* 전체 텍스트 표시 — 넘치면 카드 본문(상위 컨테이너)이 스크롤 */}
      <p className="text-sm text-muted-foreground leading-relaxed text-left">
        {reason}
      </p>
    </div>
  );
}
