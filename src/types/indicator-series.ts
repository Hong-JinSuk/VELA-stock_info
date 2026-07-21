// 섹터 지표에 붙일 수 있는 "차트형 시계열" 데이터 타입.
// 현재는 AI 토큰 처리량(OpenRouter) 하나. 값 피드가 있는 지표는 seriesKey로 이 데이터를 붙인다.

export type TokenThroughputPoint = {
  date: string; // "YYYY-MM-DD"
  tokens: number; // 그날 총 토큰 처리량(top50 + other 합)
};

export type TokenThroughputSeries = {
  points: TokenThroughputPoint[];
  asOf: string | null; // OpenRouter meta.as_of
  unavailable?: boolean; // OPENROUTER_API_KEY 미설정 등으로 데이터 없음
};
