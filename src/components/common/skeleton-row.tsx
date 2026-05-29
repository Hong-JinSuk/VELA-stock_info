'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonRowProps {
  count?: number;
  className?: string;
  itemClassName?: string;
}

const COL_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-4',
};

export default function SkeletonRow({
  count = 1,
  className,
  itemClassName,
}: SkeletonRowProps) {
  const colClass = COL_CLASS[count] ?? 'grid-cols-1';

  return (
    <div className={cn('grid gap-4', colClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'border border-border bg-secondary/30 rounded-xl p-4 space-y-2',
            itemClassName,
          )}
        >
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
