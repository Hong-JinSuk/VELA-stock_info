import { api } from '@/lib/api/axios';
import type {
  TokenThroughputPoint,
  TokenThroughputSeries,
} from '@/types/indicator-series';
import { unstable_cache } from 'next/cache';

// OpenRouter "daily token totals for top 50 models" 데이터셋에서 일별 총 토큰 처리량을 만든다.
// 응답: { data: [{ date, model_permaslug, total_tokens(string) }], meta:{ as_of } }
//  - 날짜별로 total_tokens(top50 각 모델 + "other" 집계행)를 모두 더하면 그날 총 처리량.
//  - 한 번 호출로 다일 시계열을 준다(start_date/end_date로 범위 지정).
// ⚠️ OPENROUTER_API_KEY(무료 계정 키) 필요. 없으면 unavailable로 반환(그래프가 안내 표시).

const ENDPOINT = 'https://openrouter.ai/api/v1/datasets/rankings-daily';
const HISTORY_DAYS = 180;

type Row = { date: string; model_permaslug: string; total_tokens: string };
type ApiResp = { data: Row[]; meta?: { as_of?: string } };

async function fetchTokenThroughput(): Promise<TokenThroughputSeries> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { points: [], asOf: null, unavailable: true };

  const startDate = new Date(Date.now() - HISTORY_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data } = await api.get<ApiResp>(
    `${ENDPOINT}?start_date=${startDate}`,
    { headers: { Authorization: `Bearer ${key}` }, timeout: 30_000 },
  );

  // 날짜별 합산.
  const byDate = new Map<string, number>();
  for (const r of data.data ?? []) {
    const t = Number(r.total_tokens);
    if (!Number.isFinite(t)) continue;
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + t);
  }
  const points: TokenThroughputPoint[] = [...byDate.entries()]
    .map(([date, tokens]) => ({ date, tokens }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { points, asOf: data.meta?.as_of ?? null };
}

// 일별 데이터라 6시간 서버 캐시(레이트리밋 500/일 보호). 클라 훅은 별도 staleTime.
export const getTokenThroughput = unstable_cache(
  fetchTokenThroughput,
  ['token-throughput-v1'],
  { revalidate: 21_600 },
);
