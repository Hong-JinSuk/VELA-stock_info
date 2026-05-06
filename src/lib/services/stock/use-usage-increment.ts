import { api } from '@/lib/api/axios';
import { useMutation } from '@tanstack/react-query';

export function useUsageIncrementMutation() {
  return useMutation({
    mutationKey: ['usage-increment'],
    mutationFn: async () => {
      const { data } = await api.post('/usage/increment');
      return data;
    },
  });
}
