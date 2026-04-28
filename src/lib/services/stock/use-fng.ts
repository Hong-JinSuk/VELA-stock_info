import { api } from '@/lib/api/axios';
import { minutesToMs } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

type Props = {
  action?: string;
};

export function useFng({ action = 'history' }: Props = {}) {
  const params = {
    action,
  };
  const getFng = useQuery({
    queryKey: ['get-fng'],
    queryFn: async () => {
      const { data } = await api.get(`/api-fng`, { params, baseURL: '' });

      if (!data) {
        throw new Error('Feat & Greed 데이터를 가져오지 못했어요.');
      }

      return data;
    },
    staleTime: minutesToMs(15),
    meta: {
      ignoreGlobalError: true,
    },
  });

  return getFng;
}
