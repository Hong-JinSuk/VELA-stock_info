// 빈 랜딩 상태 — 헤더/검색바는 layout이 제공. 검색 전 안내만 표시.
export default function StocksPage() {
  return (
    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60">
      티커를 검색해 종목 정보를 확인하세요.
    </div>
  );
}
