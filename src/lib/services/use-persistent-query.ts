import {
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useLayoutEffect } from 'react';

// 종목 상세처럼 "재진입 시 마지막 화면을 즉시 띄우고 싶은" 쿼리를 localStorage에 스냅샷한다.
// - 마운트 시 paint 직전(layout effect)에 저장된 데이터를 시드 → 스켈레톤 깜빡임 없이 즉시 표시.
// - updatedAt을 과거로 박아 stale 처리 → 백그라운드 refetch로 최신화(과거 데이터 노출 허용).
// - 새 데이터가 오면 다시 저장. 용량 보호를 위해 최근 N개만 LRU 유지.

const STORE_KEY = 'vela:query-snapshot:v1';
const MAX_ENTRIES = 40; // 종목×쿼리종류×기간. 각 수 KB라 총합 수백 KB 수준.

type Entry = { data: unknown; at: number };
type Store = Record<string, Entry>;

function loadStore(): Store {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as Store;
  } catch {
    return {};
  }
}

function readEntry(key: string): Entry | null {
  return loadStore()[key] ?? null;
}

function writeEntry(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    const store = loadStore();
    store[key] = { data, at: Date.now() };
    const keys = Object.keys(store);
    if (keys.length > MAX_ENTRIES) {
      keys
        .sort((a, b) => store[b].at - store[a].at)
        .slice(MAX_ENTRIES)
        .forEach((k) => delete store[k]);
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // quota 초과/직렬화 실패는 무시 (스냅샷은 best-effort).
  }
}

// SSR에서 useLayoutEffect 경고를 피하기 위한 isomorphic 버전.
const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function usePersistentQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, QueryKey>,
): UseQueryResult<TData, TError> {
  const queryClient = useQueryClient();
  const storageKey = JSON.stringify(options.queryKey);

  // paint 직전 시드: 메모리 캐시에 이미 데이터가 있으면 건너뛴다.
  useIsoLayoutEffect(() => {
    if (queryClient.getQueryData(options.queryKey) !== undefined) return;
    const entry = readEntry(storageKey);
    if (entry) {
      queryClient.setQueryData(
        options.queryKey,
        entry.data as TQueryFnData,
        { updatedAt: entry.at }, // 과거 시각 → stale → 자동 백그라운드 refetch
      );
    }
    // queryKey는 storageKey로 안정 식별되므로 deps는 storageKey만 둔다.
  }, [storageKey]);

  const query = useQuery(options);

  // 네트워크로 받은 신선한 데이터를 저장 (placeholder/seed 재저장은 무해).
  useEffect(() => {
    if (query.isSuccess && query.data !== undefined) {
      writeEntry(storageKey, query.data);
    }
  }, [query.isSuccess, query.data, storageKey]);

  return query;
}
