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

// 목표 대비 |편차| 이 값(%p) 이내면 '적정'으로 본다.
export const DEVIATION_BAND = 5;
// 한 종목이 전체 자산의 이 비율(%) 초과면 집중 위험으로 경고.
export const CONCENTRATION_THRESHOLD = 20;

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
    const status: ClassStatus =
      Math.abs(deviation) <= DEVIATION_BAND
        ? 'ok'
        : deviation > 0
          ? 'over'
          : 'under';
    const targetAmount = (target[c] / 100) * total;
    return {
      assetClass: c,
      targetPct: target[c],
      actualPct,
      actualAmount: amounts[c],
      deviation,
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
