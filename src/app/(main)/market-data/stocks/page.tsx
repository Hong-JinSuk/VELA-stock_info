import StockPreviewTeaser from './components/stock-preview-teaser';

// 빈 랜딩 상태 — 헤더/검색바는 layout이 제공.
// 검색 전에는 대표 티커의 실제 상세 카드를 반투명 티저로 보여준다.
export default function StocksPage() {
  return <StockPreviewTeaser />;
}
