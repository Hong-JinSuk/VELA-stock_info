'use client';

import { FadeInView } from '@/motion/fade-in-view';
import { ArrowRight } from 'lucide-react';
import type { Session } from 'next-auth';
import { useRouter } from 'next/navigation';

// 페이지 하단 마무리 CTA.
export default function CtaSection({ session }: { session?: Session | null }) {
  const router = useRouter();
  const onStart = () => router.push(session ? '/overview' : '/login');

  return (
    <section className="border-t border-border px-6 py-24">
      <FadeInView className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
          지금, 시장을 한눈에 담으세요.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-slate-600 dark:text-slate-400 break-keep">
          가입하면 거시 대시보드와 13F·종목 분석을 바로 사용할 수 있습니다.
        </p>
        <button
          onClick={onStart}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
        >
          무료로 시작하기
          <ArrowRight className="size-4" />
        </button>
      </FadeInView>
    </section>
  );
}
