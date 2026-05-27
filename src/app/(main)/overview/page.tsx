'use client';

import { MacroCard } from '@/components/common/macro-card';
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
    <main className="flex flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <header className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-xl tracking-tight">{greeting}</h1>
      </header>
      <section className="flex-1 flex flex-col gap-6">
        <ReleaseTimeline />
        <OverviewAiInsight />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {macroIndicators?.map((indicator) => (
            <MacroCard key={indicator.indicatorId} indicator={indicator} />
          ))}
        </div>
      </section>
    </main>
  );
}
