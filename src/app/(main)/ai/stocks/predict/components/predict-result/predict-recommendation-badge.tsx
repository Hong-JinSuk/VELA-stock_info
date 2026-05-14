import { cn } from '@/lib/utils';
import { AiPredictionResultType } from '@/types/ai';

interface PredictRecommendationBadgeProps {
  recommendation?: AiPredictionResultType['recommendation'];
}

const RECOMMENDATION_STYLE: Record<
  AiPredictionResultType['recommendation'],
  string
> = {
  '강력 매수': 'bg-primary/30 text-primary border-primary/50',
  매수: 'bg-primary/20 text-primary border-primary/30',
  보류: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  매도: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  '강력 매도': 'bg-rose-500/30 text-rose-400 border-rose-500/50',
};

// AI 추천 의견(강력 매수~강력 매도)을 색상 배지로 표시. 종목명 옆에 인라인으로 배치된다.
export default function PredictRecommendationBadge({
  recommendation,
}: PredictRecommendationBadgeProps) {
  if (!recommendation) return null;

  const style =
    RECOMMENDATION_STYLE[recommendation] ??
    'bg-primary/20 text-primary border-primary/30';

  return (
    <span
      className={cn(
        'px-3 py-1 rounded-full text-xs font-bold border ml-3 align-middle',
        style,
      )}
    >
      {recommendation}
    </span>
  );
}
