'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  rows?: number;
  cols?: number;
  className?: string;
  itemClassName?: string;
}

const COL_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-4',
};

export default function SkeletonCard({
  rows = 1,
  cols = 1,
  className,
  itemClassName,
}: SkeletonCardProps) {
  const total = rows * cols;
  const colClass = COL_CLASS[cols] ?? 'grid-cols-1';

  return (
    <div className={cn('grid gap-4', colClass, className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'border border-border bg-secondary/30 rounded-xl p-4 flex flex-col gap-2',
            itemClassName,
          )}
        >
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-28" />
          <div className="space-y-2 mt-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
