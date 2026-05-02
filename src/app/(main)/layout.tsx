import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ReactNode } from 'react';
import { AppSidebar } from './components/app-sidebar';
import { MainHeader } from './components/main-header';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
      className="dark:bg-[#171717]"
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col h-svh overflow-hidden">
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
