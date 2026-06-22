import { api } from '@/lib/api/axios';
import type { PaginatedResponse } from '@/lib/api/pagination';
import type { NotificationItem } from '@/types/notification';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const LIST_KEY = ['notifications'];
const UNREAD_KEY = ['notifications', 'unread-count'];
const UNREAD_POLL_MS = 60_000; // 안 읽음 수 폴링 주기

// 안 읽음 알림 수 — 벨 배지용. 주기적으로 폴링.
export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: async (): Promise<number> => {
      const { data } = await api.get<{ count: number }>(
        '/notifications/unread-count',
      );
      return data.count;
    },
    refetchInterval: UNREAD_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

// 알림 목록(최신순). size로 드롭다운(작게)/페이지(크게) 모두 사용.
export function useNotifications(size = 10) {
  return useQuery({
    queryKey: [...LIST_KEY, size],
    queryFn: async (): Promise<PaginatedResponse<NotificationItem>> => {
      const { data } = await api.get<PaginatedResponse<NotificationItem>>(
        '/notifications',
        { params: { page: 1, size } },
      );
      return data;
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: LIST_KEY });
    qc.invalidateQueries({ queryKey: UNREAD_KEY });
  };
}

// 단건 읽음 처리.
export function useMarkRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: invalidate,
    meta: { ignoreGlobalError: true },
  });
}

// 전부 읽음 처리.
export function useMarkAllRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/notifications/read-all');
      return data;
    },
    onSuccess: invalidate,
    meta: { ignoreGlobalError: true },
  });
}
