'use client';

import { useMacroIndicators } from '@/lib/services/stock/use-macro-indicators';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react'; // Hydration 방지용
import OverviewAiInsight from './components/overview-ai-insight';
import ReleaseTimeline from './components/release-timeline';

const guest = process.env.NEXT_PUBLIC_GUEST;

export default function Page() {
  const { data: session } = useSession();
  const user = session?.user;
  const { data: macroIndicators } = useMacroIndicators();

  // 클라이언트 사이드에서만 시간을 계산하도록 state 사용 (Hydration Error 방지)
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const getGreeting = (): string => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        return `좋은 아침이에요. 제가 밤새도록 ${session?.user.nickname ?? 'GUEST'}님을 위해 준비했어요! 🌤️`;
      } else if (hour >= 12 && hour < 18) {
        return `커피한잔 하면서 오늘의 데이터들을 확인해보죠 ${session?.user.nickname ?? 'GUEST'}님! ☕`;
      } else if (hour >= 18 && hour < 22) {
        return `주식을 분석하기 좋은 밤이에요 ${session?.user.nickname ?? 'GUEST'} 🌙`;
      } else {
        return `늦은 밤에도 준비하는 ${session?.user.nickname ?? 'GUEST'}님을 위해 준비했어요. ✨`;
      }
    };
    setGreeting(getGreeting());
  }, [session]);

  return (
    <main className="flex flex-col flex-1 overflow-y-auto no-scrollbar sm:overflow-hidden sm:min-h-0">
      <header className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-xl tracking-tight">{greeting}</h1>
      </header>
      <header className="mb-5">
        <p className="text-xs text-muted-foreground tracking-wide">
          UPCOMING · 다음 발표일이 가까운 순
        </p>
        <h2 className="text-xl tracking-tight mt-1">
          시간순 추적 — 다가오는 경제 지표
        </h2>
        <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed break-keep">
          경제 지표 발표와 네 마녀의 날·FOMC 등 주요 시장 이벤트를 다가오는
          순서로 함께 보여드려요. 시장 이벤트는 일정이 임박했을 때 나타납니다.
        </p>
      </header>

      <section className="flex flex-col gap-6 sm:flex-1 sm:flex-row sm:min-h-0">
        <ReleaseTimeline />
        <div className="max-w-[600px] w-full sm:h-full flex flex-col">
          <OverviewAiInsight />
        </div>
      </section>
    </main>
  );
}
