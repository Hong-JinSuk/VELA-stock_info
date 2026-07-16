'use client';

import { ASSET_CLASS_META } from '@/constants/asset-classes';
import type { ClassDiagnosis, Diagnosis } from '@/types/portfolio';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

// 위험 성향이 목표와 이 값(점) 넘게 벌어지면 공격적/보수적으로 판정.
const RISK_GAP = 5;

// 진단 결과 — 위험 성향 요약 + 자산군별 목표 대비 과부족 + 종목 집중 경고.
export default function DiagnosisResult({ result }: { result: Diagnosis }) {
  const { byClass, actualRisk, targetRisk, concentration } = result;
  const riskGap = actualRisk - targetRisk;
  const riskVerdict =
    riskGap > RISK_GAP
      ? { label: '목표보다 공격적', tone: 'text-rose-500' }
      : riskGap < -RISK_GAP
        ? { label: '목표보다 보수적', tone: 'text-sky-500' }
        : { label: '목표 수준에 부합', tone: 'text-emerald-500' };

  return (
    <div className="flex flex-col gap-6">
      {/* 위험 성향 요약 */}
      <section className="rounded-2xl border border-border bg-card/40 p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-foreground">위험 성향</h3>
          <span className={`text-sm font-semibold ${riskVerdict.tone}`}>
            {riskVerdict.label}
          </span>
        </div>
        <div className="relative mt-4 h-2.5 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/70"
            style={{ width: `${clampPct(actualRisk)}%` }}
          />
          <div
            className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-foreground"
            style={{ left: `${clampPct(targetRisk)}%` }}
            title={`목표 ${Math.round(targetRisk)}`}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground/60">
          <span>안정</span>
          <span>
            현재 {Math.round(actualRisk)} · 목표 {Math.round(targetRisk)}
          </span>
          <span>공격</span>
        </div>
      </section>

      {/* 자산군별 진단 */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">
          자산군별 목표 대비
        </h3>
        <div className="flex flex-col gap-4">
          {byClass.map((d) => (
            <ClassRow key={d.assetClass} d={d} />
          ))}
        </div>
      </section>

      {/* 종목 집중 경고 */}
      {concentration.length > 0 && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">
              종목 집중 위험
            </h3>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {concentration.map((c) => (
              <li
                key={c.symbol}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">
                  <span className="font-mono font-medium text-foreground">
                    {c.symbol}
                  </span>{' '}
                  {c.name}
                </span>
                <span className="tabular-nums text-amber-600 dark:text-amber-400">
                  전체의 {c.pctOfTotal.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground/70 break-keep">
            한 종목 비중이 커지면 그 종목의 급락이 전체에 큰 타격이 됩니다. 분산을
            고려해 보세요.
          </p>
        </section>
      )}

      <p className="text-[11px] text-muted-foreground/50 break-keep">
        본 진단은 입력한 배분을 목표와 비교한 참고용 정보이며, 특정 종목·상품의
        매매를 권유하는 투자자문이 아닙니다.
      </p>
    </div>
  );
}

function ClassRow({ d }: { d: ClassDiagnosis }) {
  const meta = ASSET_CLASS_META[d.assetClass];
  const rebalance = Math.round(d.rebalanceAmount);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${meta.bar}`} />
          <span className="font-medium text-foreground">{meta.label}</span>
        </span>
        <DeviationBadge d={d} />
      </div>

      {/* 트랙: 실제 채움 + 목표 마커 */}
      <div className="relative h-2.5 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${meta.bar}`}
          style={{ width: `${Math.min(d.actualPct, 100)}%` }}
        />
        <div
          className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-foreground/70"
          style={{ left: `${Math.min(d.targetPct, 100)}%` }}
          title={`목표 ${d.targetPct}%`}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] tabular-nums text-muted-foreground/70">
        <span>
          현재 {d.actualPct.toFixed(1)}% · 목표 {d.targetPct}%
        </span>
        {d.status !== 'ok' && rebalance !== 0 && (
          <span className={rebalance > 0 ? 'text-sky-500' : 'text-rose-500'}>
            {rebalance > 0
              ? `${Math.abs(rebalance).toLocaleString()} 매수 필요`
              : `${Math.abs(rebalance).toLocaleString()} 매도 검토`}
          </span>
        )}
      </div>
    </div>
  );
}

function DeviationBadge({ d }: { d: ClassDiagnosis }) {
  if (d.status === 'ok') {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
        적정
      </span>
    );
  }
  const over = d.status === 'over';
  const Icon = over ? TrendingUp : TrendingDown;
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
        over ? 'bg-rose-500/10 text-rose-500' : 'bg-sky-500/10 text-sky-500'
      }`}
    >
      <Icon className="size-3" />
      {over ? '과다' : '부족'} {d.deviation > 0 ? '+' : ''}
      {d.deviation.toFixed(1)}%p
    </span>
  );
}

// 0~100 사이로 클램프 (막대/마커 위치 %).
function clampPct(pct: number): number {
  return Math.min(Math.max(pct, 0), 100);
}
