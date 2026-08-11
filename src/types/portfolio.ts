import type { AssetClass, NonStockAssetClass } from '@/constants/asset-classes';

// 사용자가 입력한 개별 주식 1건. amount는 평가금액(단위는 사용자 자유 — 상대 비중만 계산에 씀).
export type StockHolding = {
  id: string; // 클라 로우 식별자
  symbol: string;
  name?: string; // 표시용(한글명/영문 설명)
  amount: number;
};

// 사용자 보유 자산. 주식은 종목별 입력(합산), 나머지 자산군은 금액으로 입력.
export type Holdings = {
  stocks: StockHolding[];
  amounts: Record<NonStockAssetClass, number>;
};

export type ClassStatus = 'over' | 'under' | 'ok';

// 자산군 1개의 진단 결과.
export type ClassDiagnosis = {
  assetClass: AssetClass;
  targetPct: number;
  actualPct: number;
  actualAmount: number;
  deviation: number; // actualPct - targetPct (%p)
  band: number; // 이 자산군의 허용 편차(%p). 목표 비중에 따라 가변 — deviationBand() 참고
  status: ClassStatus;
  rebalanceAmount: number; // 목표 도달까지 필요한 금액. + 매수 / - 매도
};

// 특정 종목이 전체에서 과도한 비중을 차지할 때의 집중 경고.
export type ConcentrationWarning = {
  symbol: string;
  name?: string;
  pctOfTotal: number;
};

export type Diagnosis = {
  total: number;
  byClass: ClassDiagnosis[];
  actualRisk: number; // 0~100 (주식 100% = 100)
  targetRisk: number; // 0~100
  concentration: ConcentrationWarning[];
};
