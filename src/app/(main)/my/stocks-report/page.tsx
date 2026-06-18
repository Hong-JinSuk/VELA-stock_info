'use client';
// useReactTable 인스턴스(가변 객체)를 다루므로 React Compiler 제외 (13f 페이지와 동일 규칙).
'use no memo';

import DataTable from '@/components/common/data-table/data-table';
import { useStocksReport } from '@/lib/services/stocks-report/use-stocks-report';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { stocksReportColumns } from './columns';

export default function StocksReportPage() {
  const router = useRouter();
  const { data, isLoading, isError, error } = useStocksReport();

  const table = useReactTable({
    data: data ?? [],
    columns: stocksReportColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onRowClick: (row) => router.push(`/market/stocks/${row.original.symbol}`),
    },
  });

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto no-scrollbar p-6">
      <header>
        <h1 className="font-serif text-xl tracking-tight">종목 보고서</h1>
        <p className="mt-1 text-sm text-muted-foreground break-keep">
          즐겨찾기한 종목의 적정주가와 상승여력을 한눈에 비교합니다.
        </p>
      </header>

      {isError ? (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : '보고서를 불러올 수 없습니다.'}
        </div>
      ) : !isLoading && (data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          <p className="break-keep">즐겨찾기한 종목이 없습니다.</p>
          <Link
            href="/market/stocks"
            className="mt-2 inline-block text-foreground underline underline-offset-4"
          >
            종목 찾으러 가기
          </Link>
        </div>
      ) : (
        <>
          <DataTable
            table={table}
            rowKey="symbol"
            rowHeight={64}
            isLoading={isLoading}
            showPagination={false}
          />
          <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-card/40 p-4 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p className="break-keep">
              적정주가는 성장성·수익성 지표를 종합한 자체 추정치이며, 새벽 배치
              스냅샷 기준이라 실시간 시세와 다를 수 있습니다. 투자 판단의
              참고용입니다.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
