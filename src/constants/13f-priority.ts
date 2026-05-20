/**
 * 13F 리스트 첫 페이지 상단에 항상 노출할 우선 filer들.
 *
 *  - cik: SEC EDGAR CIK (padded 10자리, 앞에 0 채움).
 *         찾는 법: https://www.sec.gov/cgi-bin/browse-edgar 에서 매니저 이름으로 검색.
 *  - order: 정렬 우선순위. 작을수록 위. 같은 order면 배열에 먼저 등장한 항목이 먼저 노출.
 *
 * 검색어가 입력되거나 page > 1 일 때는 적용되지 않는다.
 * 동일 CIK가 SEC 일반 검색 결과에도 들어 있으면 priority 쪽이 우선되고 일반 결과에선 제외.
 */
export type PriorityFiling = {
  cik: string;
  order: number;
};

export const PRIORITY_FILLINGS: PriorityFiling[] = [
  { cik: '0001067983', order: 1 }, // BERKSHIRE HATHAWAY INC (버크셔)
  { cik: '0001608046', order: 2 }, // National Pension Service (국민연금)
  { cik: '0000019617', order: 3 }, // JPMORGAN CHASE & CO (JP모건)
];
