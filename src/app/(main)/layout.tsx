import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { AppSidebar } from './components/app-sidebar';
import { MainHeader } from './components/main-header';

// 로그인 뒤 화면 전체. 크롤러에겐 빈 화면으로 보이고 색인될 이유도 없으므로 noindex.
// (공개 콘텐츠로 열게 되는 라우트가 생기면 해당 layout에서 robots를 덮어쓸 것.)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
      className="h-svh overflow-hidden dark:bg-[#171717]"
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col flex-1 overflow-hidden">
        {/* sideber inset css */}
        {/* TEMP DEBUG: blur-[120px] 거대 블러가 스크롤/리렌더마다 재페인트되어 멈춤을
            유발하는지 확인하려고 잠깐 제거. 확인되면 싼 방식(radial-gradient 등)으로 복원. */}
        {/* <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute top-[40%] left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2" /> */}
        <MainHeader />
        <div className="flex flex-1 flex-col overflow-y-auto lg:overflow-hidden min-h-0">
          <div className="@container/main flex flex-1 flex-col gap-2 min-h-0">
            <div className="flex flex-col flex-1 gap-4 p-4 md:p-6 min-h-0 h-full">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
