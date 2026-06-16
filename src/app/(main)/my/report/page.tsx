'use client';

import { useFavorites } from '@/lib/services/favorites/use-favorites';
import { FileBarChart } from 'lucide-react';
import FavoriteThirteenFConsensus from './components/favorite-13f-consensus';

// 마이페이지 보고서 — 즐겨찾기한 13F 기관들의 공통 매매 컨센서스 등.
export default function Page() {
  const { data: favorites, isLoading, isError, error } =
    useFavorites('THIRTEENF_FILER');
  const ciks = (favorites ?? []).map((f) => f.itemKey);

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-8 overflow-y-auto no-scrollbar p-6">
      <header>
        <h1 className="font-serif text-xl tracking-tight">보고서</h1>
        <p className="mt-1 text-sm text-muted-foreground break-keep">
          즐겨찾기한 기관·종목을 바탕으로 한 분석 리포트.
        </p>
      </header>

      {isError ? (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : '보고서를 불러올 수 없습니다.'}
        </div>
      ) : isLoading ? (
        <div className="text-sm text-muted-foreground">불러오는 중...</div>
      ) : ciks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <FileBarChart className="mx-auto mb-3 size-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            즐겨찾기한 13F 기관이 없어요.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70 break-keep">
            13F 목록에서 기관을 즐겨찾기하면 공통 매매 컨센서스가 여기 표시됩니다.
          </p>
        </div>
      ) : (
        <section>
          <header className="mb-3 flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-foreground">
              13F 공통 매매
            </h2>
          </header>
          <FavoriteThirteenFConsensus ciks={ciks} />
        </section>
      )}
    </main>
  );
}
