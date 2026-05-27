/**
 * 발표 예정 타임라인 카드의 시나리오 메시지.
 *
 * 정적 metadata — DB / batch와 무관. 다음 발표 사이클에도 그대로 재사용.
 * indicator id 기준으로 lookup. 정의 안 된 id는 시나리오 미표시.
 */

export type IndicatorScenario = {
  riseMeaning: string;
  fallMeaning: string;
};

export const INDICATOR_SCENARIOS: Record<string, IndicatorScenario> = {
  // ---------- 인플레이션 ----------
  cpi_core: {
    riseMeaning: '인플레 끈끈 → Fed 인하 지연 확률 ↑, 장기금리·달러 상승 압력',
    fallMeaning: '인플레 둔화 → Fed 인하 앞당김 확률 ↑, 위험자산 강세 환경',
  },
  pce_core: {
    riseMeaning: 'FOMC 점도표 상향 확률 ↑, 채권 약세·달러 강세',
    fallMeaning: '점도표 하향 확률 ↑, 주식·채권 동반 강세',
  },
  ppi: {
    riseMeaning: '1~3개월 뒤 CPI 상승 확률 ↑, 인플레 재가속 우려',
    fallMeaning: 'CPI 하방 압력 선행, 인플레 안정 기대 ↑',
  },
  avg_hourly_wage: {
    riseMeaning: '서비스 인플레 끈끈 → Fed 긴축 유지 확률 ↑',
    fallMeaning: '인플레 압력 완화 → 인하 기대 ↑',
  },

  // ---------- 고용 ----------
  nfp: {
    riseMeaning: '고용 견조 → 인하 기대 약화 확률 ↑, 채권 약세',
    fallMeaning: '노동시장 둔화 → 침체 우려 또는 인하 기대 강화',
  },
  unemployment: {
    riseMeaning: '노동시장 둔화 → 샴 법칙 발동 시 침체 공포 ↑',
    fallMeaning: '고용 회복 → 연착륙 시나리오 우호',
  },
  labor_participation: {
    riseMeaning: '노동력 풀 회복 → 임금 인플레 압력 완화 확률 ↑',
    fallMeaning: '구조적 노동력 부족 → 임금 상방 압력 지속',
  },
  initial_claims: {
    riseMeaning: '해고 증가 → 노동시장 둔화 조기 시그널',
    fallMeaning: '고용 견조 → 채권 약세, 위험자산 우호',
  },
  continuing_claims: {
    riseMeaning: '재취업 난조 → 침체 진입 신호 확률 ↑',
    fallMeaning: '노동시장 유연성 회복 → 고용 정상화',
  },
  jolts: {
    riseMeaning: '노동 수요 견조 → 임금 인플레 지속 확률 ↑',
    fallMeaning: '구인 둔화 → 노동시장 균형 회복, 임금 압력 완화',
  },

  // ---------- 성장 ----------
  gdp: {
    riseMeaning: '성장 견조 → 채권 약세·달러 강세 확률 ↑',
    fallMeaning: '성장 둔화 → 침체 우려 ↑, 위험자산 약세 압력',
  },
  consumer_spending: {
    riseMeaning: '내수 견조 → 침체 우려 완화, GDP 엔진 살아있음',
    fallMeaning: '소비 둔화 → GDP 하방 압력, 경기 모멘텀 약화',
  },

  // ---------- Fed ----------
  fed_balance_sheet: {
    riseMeaning: 'QE/유동성 공급 → 위험자산 강세 확률 ↑',
    fallMeaning: 'QT/유동성 흡수 → 위험자산 부담 확률 ↑',
  },
  nfci: {
    riseMeaning: '금융여건 긴축 → 시장 스트레스 누적, 리스크 자산 부담',
    fallMeaning: '여건 완화 → 리스크 자산 강세 환경 조성',
  },
  m2: {
    riseMeaning: '통화량 확대 → 자산가격 상방 압력 확률 ↑',
    fallMeaning: '통화량 축소 → 유동성 위축, 자산가격 하방 압력',
  },

  // ---------- 경기 ----------
  cfnai: {
    riseMeaning: '추세 이상 성장 → 경기 확장 시그널',
    fallMeaning: '성장 둔화 → -0.7 하향 시 침체 진입 확률 ↑',
  },

  // ---------- 소비자 ----------
  umich_sentiment: {
    riseMeaning: '소비심리 회복 → 지출 확대 기대 ↑',
    fallMeaning: '심리 위축 → 소비 감속 우려 ↑',
  },
  retail_sales: {
    riseMeaning: '내수 견조 → 침체 우려 완화, 소비주 강세',
    fallMeaning: '소비 둔화 → GDP 70% 엔진 약화 우려',
  },
  consumer_credit: {
    riseMeaning: '가계 빚 의존 소비 → 연체율·소비 감속 선행 신호',
    fallMeaning: '신용 균형 회복 → 소비 지속 가능성 ↑',
  },
  savings_rate: {
    riseMeaning: '가계 여력 회복 → 소비 지속력 확보',
    fallMeaning: '여력 부족 → 향후 소비 감속 예고',
  },

  // ---------- 주택 ----------
  housing_starts: {
    riseMeaning: '건설 모멘텀 ↑ → 건자재·내구재 섹터 우호',
    fallMeaning: '건설 둔화 → 경기 둔화 시그널',
  },
  building_permits: {
    riseMeaning: '1~3개월 뒤 착공 증가 예고 → 주택 모멘텀 ↑',
    fallMeaning: '주택 사이클 둔화 선행 신호',
  },
  existing_home_sales: {
    riseMeaning: '주택시장 유동성 회복 → 모기지 부담 완화',
    fallMeaning: '주택시장 빙결 → 모기지 부담 지속',
  },
  case_shiller: {
    riseMeaning: '가계 자산효과 확대 → 소비 우호',
    fallMeaning: '주택가격 조정 → 가계 자산 위축, 소비 부담',
  },
  mortgage_30y: {
    riseMeaning: '주택 거래 빙결 → 부동산·건설 섹터 부담',
    fallMeaning: '주택 수요 회복 → 부동산·내구재 섹터 우호',
  },
};

export function getIndicatorScenario(
  indicatorId: string,
): IndicatorScenario | undefined {
  return INDICATOR_SCENARIOS[indicatorId];
}
