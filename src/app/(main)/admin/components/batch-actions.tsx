'use client';

import { useIndicatorBatchMutation } from '@/lib/services/admin/use-indicator-batch-mutation';
import { useOverviewSnapshotMutation } from '@/lib/services/admin/use-overview-snapshot-mutation';
import { useStocksValuationBatchMutation } from '@/lib/services/admin/use-stocks-valuation-batch-mutation';
import { useThirteenFFilersBatchMutation } from '@/lib/services/admin/use-thirteenf-filers-batch-mutation';
import { useThirteenFSummaryBatchMutation } from '@/lib/services/admin/use-thirteenf-summary-batch-mutation';
import { IconLoader2, IconRefresh } from '@tabler/icons-react';
import { useIsMutating, type UseMutationResult } from '@tanstack/react-query';

// /admin 페이지의 "수동 배치" 섹션 — 사이드바에 흩어져 있던 배치 트리거를 한곳에 모음.
export default function AdminBatchActions() {
  const overview = useOverviewSnapshotMutation();
  const indicator = useIndicatorBatchMutation();
  const filers = useThirteenFFilersBatchMutation();
  const summary = useThirteenFSummaryBatchMutation();
  const valuation = useStocksValuationBatchMutation();

  // 진행상태는 컴포넌트 로컬(mutation.isPending)이 아니라 QueryClient 전역(useIsMutating)으로 읽는다.
  // → 배치 도중 다른 페이지로 이동했다 돌아와도 "배치중" 상태가 그대로 유지됨(서버 작업은 계속 도므로).
  const overviewRunning = useIsMutating({ mutationKey: ['admin-overview-snapshot'] }) > 0;
  const indicatorRunning = useIsMutating({ mutationKey: ['admin-indicator-batch'] }) > 0;
  const filersRunning = useIsMutating({ mutationKey: ['admin-13f-filers-batch'] }) > 0;
  const summaryRunning = useIsMutating({ mutationKey: ['admin-13f-summary-batch'] }) > 0;
  const valuationRunning =
    useIsMutating({ mutationKey: ['admin-stocks-valuation-batch'] }) > 0;

  const actions: {
    key: string;
    label: string;
    pendingLabel: string;
    desc: string;
    mutation: UseMutationResult<unknown, Error, void, unknown>;
    running: boolean;
  }[] = [
    {
      key: 'overview',
      label: '오버뷰 수동 배치',
      pendingLabel: '오버뷰 배치 실행 중...',
      desc: '오버뷰 인사이트 스냅샷',
      mutation: overview,
      running: overviewRunning,
    },
    {
      key: 'indicator',
      label: '지표 수동 배치',
      pendingLabel: '지표 배치 실행 중...',
      desc: 'FRED + Yahoo 지표',
      mutation: indicator,
      running: indicatorRunning,
    },
    {
      key: 'filers',
      label: '13F 명단 수동 배치',
      pendingLabel: '13F 명단 배치 실행 중...',
      desc: 'SEC 13F 매니저 명단',
      mutation: filers,
      running: filersRunning,
    },
    {
      key: 'summary',
      label: '13F 요약 수동 배치',
      pendingLabel: '13F 요약 배치 실행 중...',
      desc: '펀드 요약(AUM/섹터/매매) · 클릭당 5개 filer',
      mutation: summary,
      running: summaryRunning,
    },
    {
      key: 'valuation',
      label: '적정주가 수동 배치',
      pendingLabel: '적정주가 배치 실행 중...',
      desc: '종목 보고서/섹터 적정주가 · 미스냅샷 우선 50개',
      mutation: valuation,
      running: valuationRunning,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map(({ key, label, pendingLabel, desc, mutation, running }) => {
        const pending = running;
        return (
          <button
            key={key}
            type="button"
            disabled={pending}
            onClick={() => mutation.mutate()}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card/40 p-5 text-left transition-colors hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {pending ? (
                <IconLoader2 className="size-5 animate-spin" />
              ) : (
                <IconRefresh className="size-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {pending ? pendingLabel : label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground break-keep">
                {desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
