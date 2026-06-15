'use client';

import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { Session } from 'next-auth';
import { useRouter } from 'next/navigation';

// welcome-v2 히어로 — 간결한 카피 + CTA로 바로 아래 실사용 쇼케이스로 유도.
export default function HeroV2({ session }: { session?: Session | null }) {
  const router = useRouter();
  const onStart = () => router.push(session ? '/overview' : '/login');
  const onSeeMore = () => {
    document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-6 pt-20 text-center"
    >
      {/* 은은한 배경 그라데이션 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.10)_0%,transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-3xl"
      >
        <span className="mb-6 inline-block rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          개인화된 주가 예측 · 시장 인텔리전스
        </span>
        <h1 className="font-serif text-4xl font-normal leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          복잡한 시장,
          <br />
          <span className="text-blue-500">정제된 화면 하나로.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 break-keep">
          거시 지표부터 큰손들의 포트폴리오, 개별 종목 분석까지 — VELA가 실제로
          보여주는 화면을 아래에서 바로 확인하세요.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={onStart}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
          >
            무료로 시작하기
            <ArrowRight className="size-4" />
          </button>
          <button
            onClick={onSeeMore}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card/60 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            실사용 화면 보기
          </button>
        </div>
      </motion.div>
    </section>
  );
}
