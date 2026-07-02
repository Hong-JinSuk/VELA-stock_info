import { api } from '@/lib/api/axios';
import type { UpdateBoardSettingsInput } from '@/schemas/community-schema';
import type { BoardSettings, CommunityBoardType } from '@/types/community';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const boardKey = (type: CommunityBoardType) => ['community', 'board', type];

// 보드 설정(공개). 페이지가 별점/공감 입력 노출 판단에 사용.
export function useBoardSettings(type: CommunityBoardType) {
  return useQuery({
    queryKey: boardKey(type),
    queryFn: async (): Promise<BoardSettings> => {
      const { data } = await api.get<BoardSettings>('/community/board', {
        params: { type },
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 보드 설정 변경(ADMIN). body의 type으로 대상 보드 지정.
export function useUpdateBoardSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: UpdateBoardSettingsInput,
    ): Promise<BoardSettings> => {
      const { data } = await api.patch<BoardSettings>('/community/board', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community', 'board'] }),
  });
}
