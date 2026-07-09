'use client';

import { analysisSectorIcon } from '@/constants/analysis-sector-icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalysisSectors } from '@/lib/services/analysis/use-analysis-sectors';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisSectorsPage() {
  const { data, isLoading, isError, error } = useAnalysisSectors();

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto no-scrollbar p-6">
      <header>
        <h1 className="font-serif text-xl tracking-tight">섹터 분석</h1>
        <p className="mt-1 text-sm text-muted-foreground break-keep">
          테마·섹터별로 묶은 종목 바구니와 적정주가를 한눈에 비교합니다.
        </p>
      </header>

      {isError ? (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : '불러올 수 없습니다.'}
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          아직 등록된 섹터가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((s) => {
            const Icon = analysisSectorIcon(s.name, s.slug);
            return (
              <Link
                key={s.id}
                href={`/data-analysis/sectors/${s.slug}`}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-card/40 p-5 transition-colors hover:bg-accent/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {s.name}
                  </p>
                  {s.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground break-keep">
                      {s.description}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    종목 {s.itemCount}개
                  </p>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
