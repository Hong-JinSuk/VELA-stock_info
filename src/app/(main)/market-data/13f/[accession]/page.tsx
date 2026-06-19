'use client';

import FavoriteButton from '@/components/common/favorite-button';
import { useThirteenFComparison } from '@/lib/services/market/use-thirteenf-comparison';
import type { ThirteenFChangeRow } from '@/types/thirteenf';
import { useParams } from 'next/navigation';

export default function Page() {
  const { accession } = useParams<{ accession: string }>();
  const { data, isLoading, isError, error } = useThirteenFComparison(accession);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        13F 비교 데이터를 불러오는 중...
      </div>
    );
  }
  if (isError) {
    return (
      <div className="p-6 text-sm text-red-500">
        로드 실패: {error instanceof Error ? error.message : '알 수 없는 오류'}
      </div>
    );
  }
  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">데이터 없음</div>;
  }

  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar p-6 gap-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-xl tracking-tight">{data.filerName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            현재 분기 {data.current.periodEnding} (접수 {data.current.fileDate}) ·
            {data.previous
              ? ` 비교 분기 ${data.previous.periodEnding} (접수 ${data.previous.fileDate})`
              : ' 이전 분기 13F 없음 — 모두 신규 매수로 표시됩니다.'}
          </p>
        </div>
        <FavoriteButton
          type="THIRTEENF_FILER"
          itemKey={data.cik}
          label={data.filerName}
          size={22}
        />
      </header>

      {data.holdingsWithheld ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            보유 명세 비공개 (비밀유지 신청)
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground break-keep">
            이 분기는 SEC 비밀유지 신청(confidential treatment)으로 종목별 보유
            명세가 비공개입니다. 매도한 것이 아니라 명세만 가려진 상태로, 보통 약
            1년 뒤 수정신고(13F-HR/A)로 공개됩니다.
          </p>
          {data.reportedValueUsd != null && (
            <p className="mt-3 text-sm tabular-nums">
              <span className="text-muted-foreground">표지 신고총액 </span>
              <span className="font-semibold text-foreground">
                {formatUsd(data.reportedValueUsd)}
              </span>
              {data.reportedEntryCount ? (
                <span className="text-muted-foreground">
                  {' '}
                  · {data.reportedEntryCount.toLocaleString()}개 종목
                </span>
              ) : null}
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground/60 break-keep">
            ※ 13F는 현금·비(非)13F 자산은 보고하지 않습니다. 신고총액은 13F 대상
            증권(미국 상장주식·ETF·옵션 등)의 시장가치 합계입니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Section
            title="🟢 Top Buy"
            rows={data.buys}
            count={data.buysCount}
            mode="buy"
            emptyText="이번 분기에 새로 매수하거나 비중을 늘린 종목이 없습니다."
          />
          <Section
            title="🔴 Top Sell"
            rows={data.sells}
            count={data.sellsCount}
            mode="sell"
            emptyText="이번 분기에 매도/축소한 종목이 없습니다."
          />
          <Section
            title="🔵 Top Hold"
            rows={data.holds}
            count={data.holdsCount}
            mode="hold"
            emptyText="보유 종목이 없습니다."
          />
        </div>
      )}
    </main>
  );
}

// 큰 숫자 표시. >= 1B → "1.23B$", >= 1M → "12.3M$", 그 외 콤마.
function formatUsd(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000_000)
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function ChangeRow({
  row,
  mode,
}: {
  row: ThirteenFChangeRow;
  mode: 'buy' | 'sell' | 'hold';
}) {
  const isNew = row.previousValueUsd === 0 && row.currentValueUsd > 0;
  const isSoldOut = row.currentValueUsd === 0 && row.previousValueUsd > 0;

  let badge: string | null = null;
  let badgeColor = '';
  if (mode === 'buy' && isNew) {
    badge = 'NEW';
    badgeColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  } else if (mode === 'sell' && isSoldOut) {
    badge = 'SOLD OUT';
    badgeColor = 'text-red-500 bg-red-500/10 border-red-500/20';
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {row.nameOfIssuer}
            {row.ticker && (
              <span className="ml-1.5 text-[11px] font-mono text-muted-foreground/80">
                ({row.ticker})
              </span>
            )}
          </p>
          {row.putCall && (
            <span
              className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border ${
                row.putCall === 'Call'
                  ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-rose-500 bg-rose-500/10 border-rose-500/20'
              }`}
              title={row.putCall === 'Call' ? '콜 옵션 (상승 베팅)' : '풋 옵션 (하락 베팅)'}
            >
              {row.putCall === 'Call' ? 'CALL' : 'PUT'}
            </span>
          )}
          {badge && (
            <span
              className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border ${badgeColor}`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          CUSIP {row.cusip} · 비중 {row.weightPercent.toFixed(2)}%
        </p>
      </div>
      <div className="text-right shrink-0 tabular-nums">
        {mode === 'hold' ? (
          <p className="text-sm font-semibold text-foreground">
            {formatUsd(row.currentValueUsd)}
          </p>
        ) : (
          <>
            <p
              className={`text-sm font-semibold ${
                row.deltaValueUsd >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {row.deltaValueUsd >= 0 ? '+' : ''}
              {formatUsd(row.deltaValueUsd)}
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              {formatUsd(row.previousValueUsd)} →{' '}
              {formatUsd(row.currentValueUsd)}
            </p>
          </>
        )}
      </div>
    </li>
  );
}

const PREVIEW_LIMIT = 5;

function Section({
  title,
  rows,
  count,
  mode,
  emptyText,
}: {
  title: string;
  rows: ThirteenFChangeRow[];
  count: number; // 전체 개수 (rows는 상위 N개로 cap되어 있어 별도로 받음)
  mode: 'buy' | 'sell' | 'hold';
  emptyText: string;
}) {
  const preview = rows.slice(0, PREVIEW_LIMIT);
  const remaining = Math.max(0, count - PREVIEW_LIMIT);
  return (
    <section className="border border-border rounded-xl p-5 bg-card/40 backdrop-blur-md">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-serif text-base font-semibold text-foreground">
          {title}
        </h2>
        <span className="text-[11px] text-muted-foreground/70 tabular-nums">
          {count}건
        </span>
      </div>
      {preview.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <>
          <ul className="space-y-0">
            {preview.map((r) => (
              <ChangeRow
                key={`${r.cusip}-${r.putCall ?? 'SH'}`}
                row={r}
                mode={mode}
              />
            ))}
          </ul>
          {remaining > 0 && (
            <p className="mt-3 text-[11px] text-muted-foreground/60">
              + {remaining}건 더 보기 (전체보기 기능 준비 중)
            </p>
          )}
        </>
      )}
    </section>
  );
}
