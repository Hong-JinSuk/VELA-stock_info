import { cn } from '@/lib/utils';
import { AiPredictionResultType } from '@/types/ai';

interface PredictGridProps {
  predictions?: AiPredictionResultType['predictions'];
}

// 1/3/6/9/12개월 기간별 목표가와 상승 여력을 카드 그리드로 표시. 상승/하락 부호로 색상이 갈린다.
export default function PredictGrid({ predictions }: PredictGridProps) {
  if (!predictions) return null;

  return (
    <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2 sm:gap-3">
      {Object.entries(predictions).map(([period, data]) => (
        <div
          key={period}
          className="bg-secondary/50 border border-border p-4 rounded-2xl flex flex-col justify-center min-w-0"
        >
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2 truncate">
            {period.replace('m', ' Months')}
          </p>
          <p className="text-base md:text-lg lg:text-xl font-bold text-foreground tracking-tighter mb-1 break-words">
            {data.targetPrice}
          </p>
          <p
            className={cn(
              'text-xs font-bold tracking-wider truncate',
              data.upsidePotential?.includes('-')
                ? 'text-rose-400'
                : 'text-primary',
            )}
          >
            {data.upsidePotential}
          </p>
        </div>
      ))}
    </div>
  );
}
