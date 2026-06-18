'use client';

import {
  TICKER_KR,
  krNameOf,
  searchKrTickers,
} from '@/constants/stock-korean-names';
import type { StockSearchItem } from '@/types/stock';
import { useStockSearch } from './use-stock-search';

const HANGUL_RE = /[가-힣]/;
const DEFAULT_LIMIT = 8;

export type StockSuggestion = StockSearchItem & { kr?: string };

// 종목 검색 자동완성 공용 훅 — 한국어/영문 모두 지원.
// ⚠️ 종목 검색은 한국어로도 되어야 한다. 한글 입력이면 Finnhub를 부르지 않고
// 정적 한국어명 맵(searchKrTickers/TICKER_KR)으로 매칭하고, 영문/티커면 서버(/stock/search) 결과를 쓴다.
// 새 검색 UI(섹터 관리 등)는 useStockSearch를 직접 쓰지 말고 이 훅을 사용할 것.
export function useStockSuggestions(query: string, limit = DEFAULT_LIMIT) {
  const q = query.trim();
  const isHangul = HANGUL_RE.test(q);

  // 한글이면 API 호출 생략(레이트리밋 절약).
  const { data, isFetching } = useStockSearch(isHangul ? '' : q);

  const suggestions: StockSuggestion[] = isHangul
    ? searchKrTickers(q)
        .slice(0, limit)
        .map((ticker) => ({
          symbol: ticker,
          displaySymbol: ticker,
          description: '',
          type: 'Common Stock',
          kr: TICKER_KR[ticker],
          inDirectory: true, // 한국어명 큐레이션 = 디렉터리 내 대형주
        }))
    : (data ?? []).slice(0, limit).map((it) => ({
        ...it,
        kr: krNameOf(it.symbol),
      }));

  const isLoading = !isHangul && isFetching && q.length >= 1 && !data;

  return { suggestions, isLoading, isHangul };
}
