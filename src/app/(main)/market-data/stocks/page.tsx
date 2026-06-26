import TopStocksList from './components/top-stocks-list';

// 빈 랜딩 상태 — 헤더/검색바는 layout이 제공.
// 검색 전에는 인기 대형주 TOP20 리스트(배치 스냅샷)를 보여준다.
export default function StocksPage() {
  return <TopStocksList />;
}
