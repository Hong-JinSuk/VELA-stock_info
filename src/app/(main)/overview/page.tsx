'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react'; // Hydration 방지용

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
        return 'Good morning 🌤️,';
      } else if (hour >= 12 && hour < 18) {
        return 'Good afternoon ☕,';
      } else if (hour >= 18 && hour < 22) {
        return 'Good evening 🌙,';
      } else {
        return 'Good night ✨,';
      }
    };
    setGreeting(getGreeting());
  }, []);

  return (
    <main className="flex flex-col flex-1">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-xl tracking-tight">
            {greeting} {user?.nickname ?? guest}
          </h1>
          <p className="font-serif text-sm text-gray-400">
            {!!user
              ? `We’ve picked the most important market updates for you.`
              : `Nice to meet you. Let's see what's happening in the market.`}
          </p>
        </div>
      </header>
      <section className="flex-1 flex flex-col">
        <div className="flex items-center"></div>
        <div className="flex-1"></div>
      </section>
    </main>
  );
}
