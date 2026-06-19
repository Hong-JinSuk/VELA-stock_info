import { Skeleton } from '@/components/ui/skeleton';
import type { ReactNode } from 'react';

function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card/40 p-5 lg:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

// 종목 상세 로딩 스켈레톤 — 실제 레이아웃과 높이를 맞춰 레이아웃 점프 방지.
export default function StockDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <Card className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </Card>

      {/* 차트 */}
      <Card>
        <Skeleton className="h-4 w-40 mb-4" />
        <Skeleton className="h-[280px] w-full" />
      </Card>

      {/* 현재가 + 주요 지표 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <Skeleton className="h-4 w-20 mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 애널리스트 + 내부자 동향 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-2.5 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </Card>
        <Card>
          <Skeleton className="h-4 w-44 mb-4" />
          <Skeleton className="h-[220px] w-full" />
        </Card>
      </div>

      {/* 내부자 상세 */}
      <Card>
        <Skeleton className="h-4 w-56 mb-4" />
        <Skeleton className="h-2.5 w-full mb-5" />
        <div className="grid grid-cols-2 gap-2 mb-5">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      </Card>

      {/* 뉴스 */}
      <div>
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card/40 p-4 space-y-2"
            >
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
