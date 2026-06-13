// 13F 보고 중단 filer 제외 기준.
// 13F는 분기 종료 후 45일 내 의무 보고라, 1년 넘게 보고가 없으면
// 등록 해지·운용자산 기준($100M) 미달·합병 등으로 사실상 활동 중단으로 간주한다.
export const THIRTEENF_STALE_DAYS = 365;

/** 오늘 기준 stale 컷오프 (YYYY-MM-DD). lastFiledDate가 이보다 과거면 목록·검색에서 제외. */
export function thirteenFStaleCutoff(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - THIRTEENF_STALE_DAYS);
  return d.toISOString().slice(0, 10);
}
