// 종목 화면 공통 포맷 헬퍼.

export function fmtNum(v: number | null | undefined, decimals = 2): string {
  if (v == null || !Number.isFinite(v)) return '–';
  return v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtPct(v: number | null | undefined, decimals = 2): string {
  if (v == null || !Number.isFinite(v)) return '–';
  return `${v.toFixed(decimals)}%`;
}

export function fmtUsd(v: number | null | undefined, decimals = 2): string {
  if (v == null || !Number.isFinite(v)) return '–';
  return `$${fmtNum(v, decimals)}`;
}

export function fmtShares(v: number): string {
  return Math.round(v).toLocaleString('en-US');
}

// Finnhub marketCapitalization은 백만(USD) 단위.
export function fmtMarketCap(millions: number | null | undefined): string {
  if (millions == null || !Number.isFinite(millions)) return '–';
  const billions = millions / 1000;
  if (billions >= 1000) {
    return `$${(billions / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })}T`;
  }
  return `$${billions.toLocaleString('en-US', { maximumFractionDigits: 2 })}B`;
}

// Finnhub의 장황한 exchange 문자열(예: "NEW YORK STOCK EXCHANGE, INC.")을 간결한 코드로.
const EXCHANGE_LABELS: Array<[RegExp, string]> = [
  [/nasdaq/i, 'NASDAQ'],
  [/nyse arca|arca/i, 'NYSE Arca'],
  [/nyse american|american stock exchange|amex/i, 'NYSE American'],
  [/new york stock exchange|nyse/i, 'NYSE'],
  [/cboe|bats/i, 'CBOE'],
  [/otc|pink/i, 'OTC'],
];

export function shortExchange(exchange: string): string {
  for (const [re, label] of EXCHANGE_LABELS) {
    if (re.test(exchange)) return label;
  }
  // 매핑 없으면 첫 토큰(콤마/공백 전)으로 fallback.
  return exchange.split(/[\s,/]/)[0] || exchange;
}

// "YYYY-MM-DD" → "M/D"
export function toMonthDay(date: string): string {
  const [, m, d] = date.split('-');
  if (!m || !d) return date;
  return `${Number(m)}/${Number(d)}`;
}
