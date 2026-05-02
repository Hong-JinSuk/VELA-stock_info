'use client';

import { ThemeToggleButton } from '@/components/common/theme-button';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSession } from 'next-auth/react';

export function MainHeader() {
  const { data: session } = useSession();
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/Hong-JinSuk/VELA-stock_info"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              Stock Info
            </a>
          </Button>
          {/* <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full border border-border">
            <div className="relative flex h-2 w-2">
              {aiState.agentStatus === '분석 중' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  aiState.agentStatus === '분석 중'
                    ? 'bg-yellow-500'
                    : aiState.agentStatus === '분석 완료'
                      ? 'bg-blue-500'
                      : aiState.agentStatus === '사용 만료'
                        ? 'bg-red-500'
                        : 'bg-primary',
                )}
              ></span>
            </div>
            <span className="text-xs font-mono font-bold transition-colors overflow-hidden inline-block align-middle mt-0.5">
              <span className="text-foreground">AI AGENT: </span>
              <span
                className={cn(
                  aiState.agentStatus === '분석 중'
                    ? 'text-yellow-500 animate-dots'
                    : aiState.agentStatus === '분석 완료'
                      ? 'text-blue-500'
                      : aiState.agentStatus === '사용 만료'
                        ? 'text-red-500'
                        : 'text-primary',
                )}
              >
                {aiState.agentStatus}
              </span>
            </span>
          </div> */}
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
