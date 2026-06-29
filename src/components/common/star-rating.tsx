'use client';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

// 공용 별점 — onChange 있으면 입력 모드(1~5 정수), 없으면 읽기 전용 표시.
// 모바일 터치 타깃 확보를 위해 입력 모드는 각 별을 패딩 있는 button으로 감싼다.
const SIZE = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-7',
} as const;

export default function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  className,
}: {
  value: number | null;
  onChange?: (v: number) => void;
  max?: number;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const readOnly = !onChange;
  const current = value ?? 0;

  return (
    <div
      className={cn('inline-flex items-center', readOnly ? 'gap-0.5' : 'gap-0', className)}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `별점 ${current}점` : '별점 선택'}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const filled = n <= current;
        const star = (
          <Star
            className={cn(
              SIZE[size],
              filled
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-muted-foreground/40',
            )}
          />
        );
        if (readOnly) return <span key={n}>{star}</span>;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            aria-label={`${n}점`}
            aria-pressed={filled}
            className="rounded p-1 transition-transform hover:scale-110 active:scale-95"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
