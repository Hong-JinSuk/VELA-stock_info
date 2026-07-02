import type { CommunityBoardType, FeedbackCategory } from '@/types/community';

// 건의사항 카테고리 라벨/순서/뱃지 색.
export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  BUG: '버그',
  FEATURE: '기능 요청',
  IMPROVEMENT: '개선 제안',
  ETC: '기타',
};

export const FEEDBACK_CATEGORY_ORDER: FeedbackCategory[] = [
  'BUG',
  'FEATURE',
  'IMPROVEMENT',
  'ETC',
];

// 뱃지 색 (라이트/다크 공통 톤). border+bg+text 조합.
export const FEEDBACK_CATEGORY_BADGE: Record<FeedbackCategory, string> = {
  BUG: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  FEATURE: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  IMPROVEMENT:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  ETC: 'border-border bg-muted text-muted-foreground',
};

// 관리 대상 보드 목록 (admin 탭).
export const COMMUNITY_BOARDS: { type: CommunityBoardType; label: string }[] = [
  { type: 'REVIEW', label: '사용 후기' },
  { type: 'FEEDBACK', label: '건의사항' },
];
