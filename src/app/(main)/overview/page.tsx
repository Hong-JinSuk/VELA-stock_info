'use client';

import { MacroCard } from '@/components/common/macro-card';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react'; // Hydration 방지용
import OverviewAiInsight from './components/overview-ai-insight';
import { MACRO_INDICATORS } from './data/data';

const guest = process.env.NEXT_PUBLIC_GUEST;

export default function Page() {
  const { data: session } = useSession();
  const user = session?.user;

  // 클라이언트 사이드에서만 시간을 계산하도록 state 사용 (Hydration Error 방지)
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const getGreeting = (): string => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        return '좋은 아침이에요 아침 시황을 확인해볼까요? 🌤️,';
      } else if (hour >= 12 && hour < 18) {
        return '커피한잔하기 좋은 오후네요 ☕,';
      } else if (hour >= 18 && hour < 22) {
        return '주식을 분석하기 좋은 밤이에요 🌙,';
      } else {
        return '좋은 새벽이에요. 어서 시장을 확인하고 잘준비도 해야겠죠? ✨,';
      }
    };
    setGreeting(getGreeting());
  }, []);

  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <header className="flex items-center justify-between mb-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-xl tracking-tight">
            {greeting} {user?.nickname ?? guest}
          </h1>
          <p className="font-serif text-sm text-gray-400">
            {!!user
              ? `${user.nickname}님을 위한 데이터가 준비되어 있습니다! 확인해보시겠어요?`
              : `안녕하세요 게스트님! 저희는 아래 데이터 이외에도 많은 데이터를 제공하고 있습니다! 더 많은 데이터를 투자를 위해서 검토해보시길 바랄게요!`}
          </p>
        </div>
      </header>
      <section className="flex-1 flex flex-col gap-6">
        <OverviewAiInsight />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {MACRO_INDICATORS.map((indicator) => (
            <MacroCard key={indicator.id} indicator={indicator} />
          ))}
        </div>
      </section>
    </main>
  );
}
