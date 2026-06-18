// 종목 보고서(적정주가) 1행 DTO. API(/api/stocks-report) 응답 + 클라 공용.
// gemini-server StockValuation 스냅샷을 즐겨찾기와 join한 결과.
// OK = 계산됨, NO_DATA = 추정 불가(적자·데이터 없음), PENDING = 아직 스냅샷 전.
// 고정 바닥값은 두지 않음 — 계산 가능하면 항상 종목 실제값으로 산출.
export type StockReportStatus = 'OK' | 'NO_DATA' | 'PENDING';

// ⚠️ 산정방식(forward P/E·성장률 등 계산 입력)은 비공개 — 클라엔 결과만 노출한다.
//    입력값은 gemini-server 배치/StockValuation(서버)에만 둔다.
export type StockReportItem = {
  symbol: string;
  name: string; // 한글명 우선(TICKER_KR) → label → 영문명 → symbol
  status: StockReportStatus; // PENDING = 아직 스냅샷 전, NO_DATA = 시세 조회 실패
  price: number | null; // 스냅샷 시점 현재가
  roaTtm: number | null; // 수익성 품질 배지용
  fairValue: number | null; // 적정주가 (결과)
  upsidePct: number | null; // 상승여력(%) (결과)
  snapshotAt: string | null; // ISO (KST 벽시계 기준일)
};
