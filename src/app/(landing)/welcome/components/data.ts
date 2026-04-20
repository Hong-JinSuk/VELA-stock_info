export const marketIndices = [
  {
    category: 'S&P 500',
    ticker: 'VOO',
    name: 'S&P 500',
    desc: '미국을 대표하는 대형 기업 500개를 모은 지수로, 미국 주식 시장의 전체적인 건강 상태를 보여주는 가장 표준적인 지표입니다.',
    fee: '0.03%',
  },
  {
    category: 'Nasdaq 100',
    ticker: 'QQQM',
    name: 'NASDAQ 100',
    desc: '애플, 마이크로소프트 등 IT·기술주와 혁신 성장주 100개를 모은 지수입니다. 주가 변동폭은 크지만 성장성이 높습니다.',
    fee: '0.15%',
  },
  {
    category: '다우 존스',
    ticker: 'DIA',
    name: 'Dow Jones Industrial',
    desc: '미국 경제를 상징하는 30개의 초우량 기업(블루칩)으로 구성된 지수입니다. 가장 역사가 깊으며 안정적인 기업들이 주를 이룹니다.',
    fee: '0.16%',
  },
  {
    category: '전체 시장',
    ticker: 'VTI',
    name: 'Total Stock Market',
    desc: "대형주뿐만 아니라 중소형주까지 포함하여 미국 상장 기업 전체에 투자합니다. '미국 국운'에 투자한다는 개념과 같습니다.",
    fee: '0.03%',
  },
  {
    category: '중소형주',
    ticker: 'VTWO',
    name: 'Russell 2000',
    desc: '미국의 중소형 기업 2000개를 모은 지수입니다. 경기 회복기에 가장 민감하게 반응하며 활기를 띠는 특징이 있습니다.',
    fee: '0.10%',
  },
  {
    category: '배당 성장',
    ticker: 'SCHD',
    name: 'DJ Dividend 100',
    desc: '단순히 배당금이 높은 것이 아니라, 10년 이상 배당을 늘려온 튼튼한 기업들에 투자하여 안정적인 현금 흐름을 추구합니다.',
    fee: '0.06%',
  },
  {
    category: '반도체',
    ticker: 'SMH',
    name: 'Semiconductor',
    desc: '엔비디아, TSMC 등 인공지능(AI)과 IT 산업의 핵심인 반도체 기업들을 모은 지수입니다. 업황에 따라 변동성이 매우 큽니다.',
    fee: '0.35%',
  },
  {
    category: '전 세계',
    ticker: 'VT',
    name: 'Global All Cap',
    desc: "미국을 포함해 유럽, 아시아 등 전 세계 모든 국가의 주식 시장을 하나로 묶어 투자하는 '지구촌 전체' 지수입니다.",
    fee: '0.07%',
  },
];

export const sectorETFs = [
  {
    sector: '정보기술 (Tech)',
    ticker: 'XLK',
    features: '애플, 마이크로소프트 등 기술주 중심',
  },
  {
    sector: '금융 (Financials)',
    ticker: 'XLF',
    features: '은행, 보험사 (금리 인상 수혜주)',
  },
  {
    sector: '에너지 (Energy)',
    ticker: 'XLE',
    features: '석유, 가스 (유가 및 지정학적 리스크 반영)',
  },
  {
    sector: '헬스케어 (Health Care)',
    ticker: 'XLV',
    features: '제약, 바이오 (경기 방어적 성격)',
  },
  {
    sector: '경기소비재 (Discretionary)',
    ticker: 'XLY',
    features: '아마존, 테슬라 등 소비 관련주',
  },
  {
    sector: '필수소비재 (Staples)',
    ticker: 'XLP',
    features: '코카콜라, 월마트 등 생필품 (안전 자산 성격)',
  },
  {
    sector: '산업재 (Industrials)',
    ticker: 'XLI',
    features: '제조, 항공, 물류 (경기 회복의 신호탄)',
  },
  {
    sector: '소재 (Materials)',
    ticker: 'XLB',
    features: '화학, 금속, 건설 자재 (원자재 가격 영향)',
  },
  {
    sector: '유틸리티 (Utilities)',
    ticker: 'XLU',
    features: '전기, 가스, 수도 (고배당, 저변동성)',
  },
  {
    sector: '부동산 (Real Estate)',
    ticker: 'XLRE',
    features: '리츠(REITs) 중심 (금리에 매우 민감)',
  },
  {
    sector: '커뮤니케이션 (Communication)',
    ticker: 'XLC',
    features: '구글, 메타 등 미디어 및 서비스',
  },
];

export const bondETFs = [
  {
    type: '20년 이상 장기채',
    ticker: 'TLT',
    purpose: '금리 하락 시 가장 큰 수익 (경기 침체 우려 시 상승)',
  },
  {
    type: '7-10년 중기채',
    ticker: 'IEF',
    purpose: '시장의 표준적인 채권 수익률 지표',
  },
  {
    type: '1-3년 단기채',
    ticker: 'SHY',
    purpose: '현금성 자산으로 분류, 변동성이 낮음',
  },
  {
    type: '종합 채권 시장',
    ticker: 'BND / AGG',
    purpose: '미국 채권 시장 전체에 투자',
  },
  {
    type: '회사채 (투자등급)',
    ticker: 'LQD',
    purpose: '우량 기업들의 채권 상태 확인',
  },
];

export const macroIndicators = [
  {
    category: '거시 경제 (Macro)',
    item: '금리 (Fed Rate)',
    checkpoint: '미 연준(Fed) 기준금리 및 점도표',
    insight: '금리 상승 시 기업 비용 증가 및 기술주 하락 압력',
  },
  {
    category: '거시 경제 (Macro)',
    item: '달러 인덱스 (DXY / UUP)',
    checkpoint: '주요 6개국 통화 대비 달러 가치',
    insight: '달러 강세 시 수출 기업 실적 악화 및 신흥국 자금 이탈',
  },
  {
    category: '거시 경제 (Macro)',
    item: '금 (GLD / IAU)',
    checkpoint: '온스당 가격 (안전 자산의 대명사)',
    insight: '지정학적 위기나 고인플레이션 시 헤지 수단으로 상승',
  },
  {
    category: '시장 심리 (Sentiment)',
    item: 'VIX (변동성 지수)',
    checkpoint: 'S&P 500 옵션 기반 기대 변동성',
    insight: "'공포 지수'로 불리며, 급등 시 주가 급락 신호로 해석",
  },
  {
    category: '시장 심리 (Sentiment)',
    item: '공포 & 탐욕 지수',
    checkpoint: 'CNN Business 제공 (0~100)',
    insight: '0~25(극도의 공포)는 매수, 75~100(극도의 탐욕)은 경계',
  },
  {
    category: '시장 심리 (Sentiment)',
    item: '풋/콜 비율 (Put/Call)',
    checkpoint: '하락 베팅 vs 상승 베팅 계약 비율',
    insight: '비율이 1.0을 크게 상회하면 시장의 과도한 비관론 시사',
  },
  {
    category: '기업 및 기타',
    item: '실적 발표 (Earnings)',
    checkpoint: '주요 기업(Big Tech 등) 분기 실적',
    insight: '가이던스(전망치)에 따라 섹터 전반의 방향성 결정',
  },
  {
    category: '기업 및 기타',
    item: '원유 (WTI - 티커: USO)',
    checkpoint: '서부 텍사스산 중질유 가격',
    insight: '에너지 섹터(XLE) 수익성과 직결 및 인플레이션 지표',
  },
];
