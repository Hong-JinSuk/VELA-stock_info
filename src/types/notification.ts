import type { NotificationType } from '@/generated/prisma/client';

// 인앱 알림 DTO (클라 표시용). createdAt/readAt은 ISO 문자열로 직렬화.
export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath: string | null;
  data: unknown | null;
  read: boolean;
  createdAt: string;
};
