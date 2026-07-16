// 포트폴리오 진단용 자산군(asset class) 정의 — 목표/실제 배분 비교의 기본 단위.
// ⚠️ 서비스 정책상 크립토(코인/블록체인)는 자산군에 포함하지 않는다. "기타"는 금·원자재 등만.
// 색/라벨은 UI 표현 맵(sector-colors 패턴). riskWeight는 위험점수 산출에만 쓰는 가중치(0~1).

export const ASSET_CLASSES = [
  'STOCK',
  'BOND',
  'REAL_ESTATE',
  'CASH',
  'ETC',
] as const;

export type AssetClass = (typeof ASSET_CLASSES)[number];

// 주식을 뺀 나머지(사용자는 이들을 '금액'으로 직접 입력, 주식은 종목별 합산).
export const NON_STOCK_CLASSES = ['BOND', 'REAL_ESTATE', 'CASH', 'ETC'] as const;
export type NonStockAssetClass = (typeof NON_STOCK_CLASSES)[number];

export type AssetClassMeta = {
  label: string;
  hint: string; // 무엇이 포함되는지 안내
  bar: string; // 막대 배경색 (완전한 리터럴 — Tailwind 정적 스캔)
  text: string; // 텍스트/아이콘 색
  soft: string; // 은은한 틴트 배경
  // 위험 가중치: 주식 1.0(최고) ~ 현금 0.05(최저). 위험점수 = Σ(비중% × riskWeight).
  riskWeight: number;
};

export const ASSET_CLASS_META: Record<AssetClass, AssetClassMeta> = {
  STOCK: {
    label: '주식',
    hint: '개별 주식·주식형 ETF',
    bar: 'bg-sky-500',
    text: 'text-sky-500',
    soft: 'bg-sky-500/10',
    riskWeight: 1.0,
  },
  BOND: {
    label: '채권',
    hint: '국채·회사채·채권형 ETF',
    bar: 'bg-emerald-500',
    text: 'text-emerald-500',
    soft: 'bg-emerald-500/10',
    riskWeight: 0.3,
  },
  REAL_ESTATE: {
    label: '부동산',
    hint: 'REITs·부동산 펀드',
    bar: 'bg-amber-500',
    text: 'text-amber-500',
    soft: 'bg-amber-500/10',
    riskWeight: 0.65,
  },
  CASH: {
    label: '현금성',
    hint: '예금·MMF·파킹통장',
    bar: 'bg-slate-400',
    text: 'text-slate-500',
    soft: 'bg-slate-400/10',
    riskWeight: 0.05,
  },
  ETC: {
    label: '기타',
    hint: '금·원자재 등 (크립토 제외)',
    bar: 'bg-violet-500',
    text: 'text-violet-500',
    soft: 'bg-violet-500/10',
    riskWeight: 0.6,
  },
};
