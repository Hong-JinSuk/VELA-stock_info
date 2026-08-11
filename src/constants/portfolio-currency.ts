// 포트폴리오 진단 입력 통화(표시용). 진단은 자산군 간 상대 비중으로만 계산되므로
// 통화 자체는 결과에 영향이 없고, "1이 얼마인지" 모호함을 없애기 위해 기호만 붙인다.
// 전제: 모든 자산을 한 통화로 환산해 같은 단위로 입력한다.
export type PortfolioCurrency = 'KRW' | 'USD';

export const PORTFOLIO_CURRENCIES: {
  id: PortfolioCurrency;
  symbol: string;
  label: string;
}[] = [
  { id: 'KRW', symbol: '₩', label: '원' },
  { id: 'USD', symbol: '$', label: '달러' },
];

export const CURRENCY_SYMBOL: Record<PortfolioCurrency, string> = {
  KRW: '₩',
  USD: '$',
};
