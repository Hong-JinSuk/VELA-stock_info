// 섹터 지표(AnalysisSectorIndicator)에 붙일 수 있는 차트형 시계열 레지스트리.
// seriesKey가 여기 있으면 상세 페이지가 텍스트 대신 그래프를 렌더한다.
// 새 시계열을 추가하려면: ① 여기 등록 ② 데이터 fetch/route/hook ③ 차트 컴포넌트 분기.

export const INDICATOR_SERIES = {
  TOKEN_THROUGHPUT: {
    label: 'AI 토큰 처리량 (OpenRouter)',
    // 표시할 때 함께 노출하는 캐비엇 — 전 산업이 아닌 프록시임을 분명히.
    caption:
      'OpenRouter를 통과한 일별 토큰 처리량. 전 산업 전체가 아니라 개발자·API 트래픽 프록시라 절대 규모가 아닌 추세 참고용입니다.',
  },
} as const;

export type IndicatorSeriesKey = keyof typeof INDICATOR_SERIES;

export function isIndicatorSeriesKey(
  key: string | null | undefined,
): key is IndicatorSeriesKey {
  return !!key && key in INDICATOR_SERIES;
}

// admin 셀렉트용 옵션 목록.
export const INDICATOR_SERIES_OPTIONS = (
  Object.entries(INDICATOR_SERIES) as [
    IndicatorSeriesKey,
    (typeof INDICATOR_SERIES)[IndicatorSeriesKey],
  ][]
).map(([value, v]) => ({ value, label: v.label }));
