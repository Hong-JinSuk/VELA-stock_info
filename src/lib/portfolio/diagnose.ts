import {
  ASSET_CLASSES,
  ASSET_CLASS_META,
  type AssetClass,
} from '@/constants/asset-classes';
import type {
  ClassDiagnosis,
  ClassStatus,
  ConcentrationWarning,
  Diagnosis,
  Holdings,
} from '@/types/portfolio';

// 허용 편차(%p)의 상한. 비중이 큰 자산군은 여기서 멈춘다(종전의 고정 밴드와 동일).
export const MAX_DEVIATION_BAND = 5;
// 허용 편차(%p)의 하한. 상대 기준만 쓰면 작은 비중이 0.5%p 흔들려도 '과다'가 되어
// 지나치게 예민해지므로, 작은 비중은 어느 정도 몰리는 것을 허용한다.
export const MIN_DEVIATION_BAND = 2.5;
// 상대 기준 — 목표 비중의 이 비율만큼을 허용 편차로 본다(자산배분의 통상적인 25% 룰).
export const RELATIVE_BAND_RATIO = 0.25;
// 한 종목이 전체 자산의 이 비율(%) 초과면 집중 위험으로 경고.
export const CONCENTRATION_THRESHOLD = 20;

// 목표 비중에 따른 허용 편차(%p). 목표의 25%를 쓰되 MIN~MAX로 클램프한다.
// 목표 20% 이상은 종전과 같은 ±5%p, 10% 이하는 하한 ±2.5%p로 완화된 상태를 유지.
export function deviationBand(targetPct: number): number {
  const relative = safe(targetPct) * RELATIVE_BAND_RATIO;
  return Math.min(MAX_DEVIATION_BAND, Math.max(MIN_DEVIATION_BAND, relative));
}

// 자산군별 금액 합계 (주식은 종목 amount 합산).
export function amountByClass(h: Holdings): Record<AssetClass, number> {
  const stockTotal = h.stocks.reduce((sum, s) => sum + safe(s.amount), 0);
  return {
    STOCK: stockTotal,
    BOND: safe(h.amounts.BOND),
    REAL_ESTATE: safe(h.amounts.REAL_ESTATE),
    CASH: safe(h.amounts.CASH),
    ETC: safe(h.amounts.ETC),
  };
}

// 위험점수 0~100. 자산군 비중(%)에 위험가중치를 곱해 합산 (주식 100% → 100).
export function riskScore(pctByClass: Record<AssetClass, number>): number {
  return ASSET_CLASSES.reduce(
    (sum, c) => sum + pctByClass[c] * ASSET_CLASS_META[c].riskWeight,
    0,
  );
}

// 목표 배분(target: 자산군별 %)과 실제 보유(holdings)를 비교해 진단 결과를 만든다.
// 총액이 0이면 진단 불가(null).
export function diagnose(
  target: Record<AssetClass, number>,
  h: Holdings,
): Diagnosis | null {
  const amounts = amountByClass(h);
  const total = ASSET_CLASSES.reduce((sum, c) => sum + amounts[c], 0);
  if (total <= 0) return null;

  const pct = (amount: number) => (amount / total) * 100;

  const byClass: ClassDiagnosis[] = ASSET_CLASSES.map((c) => {
    const actualPct = pct(amounts[c]);
    const deviation = actualPct - target[c];
    const band = deviationBand(target[c]);
    const status: ClassStatus =
      Math.abs(deviation) <= band ? 'ok' : deviation > 0 ? 'over' : 'under';
    const targetAmount = (target[c] / 100) * total;
    return {
      assetClass: c,
      targetPct: target[c],
      actualPct,
      actualAmount: amounts[c],
      deviation,
      band,
      status,
      rebalanceAmount: targetAmount - amounts[c],
    };
  });

  const actualPctByClass = ASSET_CLASSES.reduce(
    (acc, c) => {
      acc[c] = pct(amounts[c]);
      return acc;
    },
    {} as Record<AssetClass, number>,
  );

  const concentration: ConcentrationWarning[] = h.stocks
    .filter((s) => safe(s.amount) > 0 && pct(s.amount) > CONCENTRATION_THRESHOLD)
    .map((s) => ({ symbol: s.symbol, name: s.name, pctOfTotal: pct(s.amount) }))
    .sort((a, b) => b.pctOfTotal - a.pctOfTotal);

  return {
    total,
    byClass,
    actualRisk: riskScore(actualPctByClass),
    targetRisk: riskScore(target),
    concentration,
  };
}

// 커스텀 목표 비중이 유효한지(합 100, 각 0 이상). 합계도 함께 반환.
export function customTargetSum(target: Record<AssetClass, number>): number {
  return ASSET_CLASSES.reduce((sum, c) => sum + safe(target[c]), 0);
}

function safe(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}
