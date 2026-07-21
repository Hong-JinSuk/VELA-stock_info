import { api } from '@/lib/api/axios';
import type { AdminSector } from '@/types/analysis';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const KEY = ['admin-sectors'];

export function useAdminSectors() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<AdminSector[]> => {
      const { data } = await api.get<AdminSector[]>('/admin/analysis/sectors');
      return data;
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ['analysis-sectors'] });
  };
}

export function useCreateSector() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      slug: string;
      name: string;
      description?: string;
    }) => {
      const { data } = await api.post('/admin/analysis/sectors', input);
      return data;
    },
    onSuccess: () => {
      toast.success('섹터가 생성되었습니다.');
      invalidate();
    },
    meta: { ignoreGlobalError: true },
    onError: (e: Error) => toast.error(e.message || '생성 실패'),
  });
}

export function useDeleteSector() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/analysis/sectors/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('섹터가 삭제되었습니다.');
      invalidate();
    },
    meta: { ignoreGlobalError: true },
    onError: (e: Error) => toast.error(e.message || '삭제 실패'),
  });
}

export function useAddSectorItem() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { id: string; symbol: string; note?: string }) => {
      const { id, ...body } = input;
      const { data } = await api.post(
        `/admin/analysis/sectors/${id}/items`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      toast.success('종목이 추가되었습니다.');
      invalidate();
    },
    meta: { ignoreGlobalError: true },
    onError: (e: Error) => toast.error(e.message || '추가 실패'),
  });
}

export function useUpdateSectorItem() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      symbol: string;
      note: string | null;
    }) => {
      const { id, ...body } = input;
      const { data } = await api.patch(
        `/admin/analysis/sectors/${id}/items`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      toast.success('설명이 저장되었습니다.');
      invalidate();
    },
    meta: { ignoreGlobalError: true },
    onError: (e: Error) => toast.error(e.message || '저장 실패'),
  });
}

export function useRemoveSectorItem() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { id: string; symbol: string }) => {
      const { data } = await api.delete(
        `/admin/analysis/sectors/${input.id}/items`,
        { params: { symbol: input.symbol } },
      );
      return data;
    },
    onSuccess: () => invalidate(),
    meta: { ignoreGlobalError: true },
    onError: (e: Error) => toast.error(e.message || '삭제 실패'),
  });
}

// ── 섹터 중요 지표 (id = 섹터 id) ──────────────────────────────
export function useAddSectorIndicator() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      description: string;
      link?: string;
      seriesKey?: string;
    }) => {
      const { id, ...body } = input;
      const { data } = await api.post(
        `/admin/analysis/sectors/${id}/indicators`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      toast.success('지표가 추가되었습니다.');
      invalidate();
    },
    meta: { ignoreGlobalError: true },
    onError: (e: Error) => toast.error(e.message || '추가 실패'),
  });
}

export function useUpdateSectorIndicator() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      id: string; // 섹터 id
      indicatorId: string;
      name?: string;
      description?: string;
      link?: string | null;
      seriesKey?: string | null;
    }) => {
      const { id, indicatorId, ...rest } = input;
      const { data } = await api.patch(
        `/admin/analysis/sectors/${id}/indicators`,
        { id: indicatorId, ...rest },
      );
      return data;
    },
    onSuccess: () => {
      toast.success('지표가 저장되었습니다.');
      invalidate();
    },
    meta: { ignoreGlobalError: true },
    onError: (e: Error) => toast.error(e.message || '저장 실패'),
  });
}

export function useRemoveSectorIndicator() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { id: string; indicatorId: string }) => {
      const { data } = await api.delete(
        `/admin/analysis/sectors/${input.id}/indicators`,
        { params: { indicatorId: input.indicatorId } },
      );
      return data;
    },
    onSuccess: () => invalidate(),
    meta: { ignoreGlobalError: true },
    onError: (e: Error) => toast.error(e.message || '삭제 실패'),
  });
}
