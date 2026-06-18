'use client';

import { useIndicatorBatchMutation } from '@/lib/services/admin/use-indicator-batch-mutation';
import { useOverviewSnapshotMutation } from '@/lib/services/admin/use-overview-snapshot-mutation';
import { useStocksValuationBatchMutation } from '@/lib/services/admin/use-stocks-valuation-batch-mutation';
import { useThirteenFFilersBatchMutation } from '@/lib/services/admin/use-thirteenf-filers-batch-mutation';
import { useThirteenFSummaryBatchMutation } from '@/lib/services/admin/use-thirteenf-summary-batch-mutation';
import { IconLoader2, IconRefresh } from '@tabler/icons-react';
import type { UseMutationResult } from '@tanstack/react-query';

// /admin 페이지의 "수동 배치" 섹션 — 사이드바에 흩어져 있던 배치 트리거를 한곳에 모음.
export default function AdminBatchActions() {
  const overview = useOverviewSnapshotMutation();
  const indicator = useIndicatorBatchMutation();
  const filers = useThirteenFFilersBatchMutation();
  const summary = useThirteenFSummaryBatchMutation();
  const valuation = useStocksValuationBatchMutation();

  const actions: {
    key: string;
    label: string;
    pendingLabel: string;
    desc: string;
    mutation: UseMutationResult<unknown, Error, void, unknown>;
  }[] = [
    {
      key: 'overview',
      label: '오버뷰 수동 배치',
      pendingLabel: '오버뷰 배치 실행 중...',
      desc: '오버뷰 인사이트 스냅샷',
      mutation: overview,
    },
    {
      key: 'indicator',
      label: '지표 수동 배치',
      pendingLabel: '지표 배치 실행 중...',
      desc: 'FRED + Yahoo 지표',
      mutation: indicator,
    },
    {
      key: 'filers',
      label: '13F 명단 수동 배치',
      pendingLabel: '13F 명단 배치 실행 중...',
      desc: 'SEC 13F 매니저 명단',
      mutation: filers,
    },
    {
      key: 'summary',
      label: '13F 요약 수동 배치',
      pendingLabel: '13F 요약 배치 실행 중...',
      desc: '펀드 요약(AUM/섹터/매매) · 클릭당 5개 filer',
      mutation: summary,
    },
    {
      key: 'valuation',
      label: '적정주가 수동 배치',
      pendingLabel: '적정주가 배치 실행 중...',
      desc: '종목 보고서/섹터 적정주가 · 미스냅샷 우선 50개',
      mutation: valuation,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map(({ key, label, pendingLabel, desc, mutation }) => {
        const pending = mutation.isPending;
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
