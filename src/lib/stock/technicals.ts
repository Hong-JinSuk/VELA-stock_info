// 기술적 지표 계산(순수 함수). Yahoo 일봉 종가로 클라/서버 어디서나 계산 — 외부 지표 API 불필요.
// 종목 상세 차트 표시에 쓰고, 추후 골든/데드크로스 알림·즐겨찾기 배지도 이 모듈을 재사용한다.
import type { StockCandlePoint } from '@/types/stock';

const CROSS_LOOKBACK = 20; // 크로스 탐지 범위(거래일). ~1개월.

// 단순이동평균(SMA). 데이터 부족 구간은 null.
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

// 지수이동평균(EMA). 첫 period개의 SMA로 시드.
export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = 0;
  for (let i = 0; i < period; i++) prev += values[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

// RSI (Wilder 평활). 0~100.
export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = values[i] - values[i - 1];
    if (ch >= 0) gain += ch;
    else loss -= ch;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < values.length; i++) {
    const ch = values[i] - values[i - 1];
    const g = ch > 0 ? ch : 0;
    const l = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

// MACD (12,26,9): macd선 = EMA12 − EMA26, signal = macd의 EMA9, hist = macd − signal.
export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): {
  macdLine: (number | null)[];
  signal: (number | null)[];
  hist: (number | null)[];
} {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = values.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null
      ? (emaFast[i] as number) - (emaSlow[i] as number)
      : null,
  );
  const signal: (number | null)[] = new Array(values.length).fill(null);
  const firstIdx = macdLine.findIndex((v) => v != null);
  if (firstIdx >= 0) {
    const seq = macdLine.slice(firstIdx).map((v) => v as number);
    const sigSeq = ema(seq, signalPeriod);
    for (let i = 0; i < sigSeq.length; i++) signal[firstIdx + i] = sigSeq[i];
  }
  const hist = values.map((_, i) =>
    macdLine[i] != null && signal[i] != null
      ? (macdLine[i] as number) - (signal[i] as number)
      : null,
  );
  return { macdLine, signal, hist };
}

export type TechTrend = 'up' | 'down' | 'mixed';
export type RsiZone = 'overbought' | 'oversold' | 'neutral';
export type CrossType = 'golden' | 'death';

export type TechnicalRow = {
  date: string;
  close: number;
  ma20: number | null;
  ma60: number | null;
  ma120: number | null;
  rsi: number | null;
  macd: number | null;
  signal: number | null;
  hist: number | null;
};

export type TechnicalSummary = {
  hasData: boolean;
  lastClose: number | null;
  ma20: number | null;
  ma60: number | null;
  ma120: number | null;
  trend: TechTrend | null; // 정배열(up)/역배열(down)/혼조(mixed)
  cross: { type: CrossType; daysAgo: number } | null; // 단기 MA(20×60) 최근 크로스
  rsi: number | null;
  rsiZone: RsiZone | null;
};

export type TechnicalResult = {
  summary: TechnicalSummary;
  rows: TechnicalRow[];
};

const EMPTY_SUMMARY: TechnicalSummary = {
  hasData: false,
  lastClose: null,
  ma20: null,
  ma60: null,
  ma120: null,
  trend: null,
  cross: null,
  rsi: null,
  rsiZone: null,
};

function lastNonNull(arr: (number | null)[]): number | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] != null) return arr[i];
  }
  return null;
}

// 일봉 → 지표 시리즈 + 현재 요약(추세·크로스·RSI). 데이터가 적으면 hasData=false.
export function analyzeTechnicals(candles: StockCandlePoint[]): TechnicalResult {
  const closes = candles.map((c) => c.close);
  if (closes.length < 30) return { summary: EMPTY_SUMMARY, rows: [] };

  const ma20 = sma(closes, 20);
  const ma60 = sma(closes, 60);
  const ma120 = sma(closes, 120);
  const rsiArr = rsi(closes, 14);
  const { macdLine, signal, hist } = macd(closes);

  const rows: TechnicalRow[] = candles.map((c, i) => ({
    date: c.date,
    close: c.close,
    ma20: ma20[i],
    ma60: ma60[i],
    ma120: ma120[i],
    rsi: rsiArr[i],
    macd: macdLine[i],
    signal: signal[i],
    hist: hist[i],
  }));

  const last = closes.length - 1;
  const a = ma20[last];
  const b = ma60[last];
  const c = ma120[last];
  let trend: TechTrend | null = null;
  if (a != null && b != null && c != null) {
    trend = a > b && b > c ? 'up' : a < b && b < c ? 'down' : 'mixed';
  }

  // 단기 골든/데드크로스: ma20이 ma60을 상향/하향 돌파한 가장 최근 지점(최근 LOOKBACK 거래일 내).
  let cross: { type: CrossType; daysAgo: number } | null = null;
  for (let i = last; i >= 1 && last - i <= CROSS_LOOKBACK; i--) {
    const cur20 = ma20[i];
    const cur60 = ma60[i];
    const p20 = ma20[i - 1];
    const p60 = ma60[i - 1];
    if (cur20 == null || cur60 == null || p20 == null || p60 == null) continue;
    const dCur = cur20 - cur60;
    const dPrev = p20 - p60;
    if (dPrev <= 0 && dCur > 0) {
      cross = { type: 'golden', daysAgo: last - i };
      break;
    }
    if (dPrev >= 0 && dCur < 0) {
      cross = { type: 'death', daysAgo: last - i };
      break;
    }
  }

  const rsiVal = lastNonNull(rsiArr);
  const rsiZone: RsiZone | null =
    rsiVal == null
      ? null
      : rsiVal >= 70
        ? 'overbought'
        : rsiVal <= 30
          ? 'oversold'
          : 'neutral';

  return {
    summary: {
      hasData: true,
      lastClose: closes[last],
      ma20: a,
      ma60: b,
      ma120: c,
      trend,
      cross,
      rsi: rsiVal,
      rsiZone,
    },
    rows,
  };
}
