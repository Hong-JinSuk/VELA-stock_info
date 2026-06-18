import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserRole } from '@/types/user';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import AdminTabs from './components/admin-tabs';

// /admin/* 전체를 ADMIN 전용으로 보호. 비ADMIN은 대시보드로 리다이렉트.
// 상단 탭(AdminTabs)은 페이지 스크롤 영역 밖에 두어 콘텐츠와 겹치지 않고 항상 고정 노출.
export default async function Layout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role ?? 'FREE') as UserRole;
  if (!session?.user || role !== 'ADMIN') {
    redirect('/overview');
  }
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <AdminTabs />
      {children}
    </div>
  );
}
