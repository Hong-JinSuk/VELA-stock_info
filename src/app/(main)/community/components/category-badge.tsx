import {
  FEEDBACK_CATEGORY_BADGE,
  FEEDBACK_CATEGORY_LABELS,
} from '@/constants/community';
import { cn } from '@/lib/utils';
import type { FeedbackCategory } from '@/types/community';

// 건의사항 카테고리 뱃지 (고정 폭 라벨).
export default function CategoryBadge({
  category,
  className,
}: {
  category: FeedbackCategory;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        FEEDBACK_CATEGORY_BADGE[category],
        className,
      )}
    >
      {FEEDBACK_CATEGORY_LABELS[category]}
    </span>
  );
}
