import { api } from '@/lib/api/axios';
import type { MacroIndicator } from '@/types/macro-indicator';
import { useQuery } from '@tanstack/react-query';

async function fetchMacroIndicators(): Promise<MacroIndicator[]> {
  const { data } = await api.get<MacroIndicator[]>('/overview/macro-indicators');
  return data;
}

export function useMacroIndicators() {
  return useQuery({
    queryKey: ['macro-indicators'],
    queryFn: fetchMacroIndicators,
    // realtime 지표는 15분 단위로 갱신되므로 그보다 짧게 캐시
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
