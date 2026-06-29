import { api } from '@/lib/api/axios';
import type { UpdateBoardSettingsInput } from '@/schemas/community-schema';
import type { BoardSettings } from '@/types/community';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const BOARD_KEY = ['community', 'board'];

// 사용 후기 보드 설정(공개). 후기 페이지가 별점 입력 노출 판단에 사용.
export function useBoardSettings() {
  return useQuery({
    queryKey: BOARD_KEY,
    queryFn: async (): Promise<BoardSettings> => {
      const { data } = await api.get<BoardSettings>('/community/board');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 보드 설정 변경(ADMIN).
export function useUpdateBoardSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: UpdateBoardSettingsInput,
    ): Promise<BoardSettings> => {
      const { data } = await api.patch<BoardSettings>('/community/board', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BOARD_KEY }),
  });
}
