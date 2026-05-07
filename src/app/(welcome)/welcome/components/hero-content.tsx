'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StaggerContainer } from '@/motion/stagger-containers';
import { useRouter } from 'next/navigation';

export default function HeroContent() {
  const router = useRouter();
  return (
    <div className="p-8 lg:p-20 flex flex-col justify-center border-r border-black/10 dark:border-white/10 relative">
      <StaggerContainer delay={0.1}>
        <Badge
          variant="outline"
          className="p-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-500 border-blue-500 rounded-full mb-8 hover:bg-transparent font-serif"
        >
          Premium Insights
        </Badge>

        <h1 className="font-serif text-2xl sm:text-3xl xl:text-5xl font-normal tracking-tight mb-8 leading-[1.1]">
          <div>변화의 바람을 읽고,</div>
          <span className="italic text-blue-500">부의 흐름</span>을 따릅니다.
        </h1>

        <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-md leading-relaxed">
          투자는 복잡한 데이터와 씨름하는 것이 아닙니다. VELA는 방대한 시장
          데이터를 제공하여, 당신의 의사결정에 꼭 필요한 핵심 신호만을
          직관적으로 전달합니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 rounded h-auto text-base font-semibold transition-colors"
            onClick={() => router.push('/login')}
          >
            지금 시작하기
          </Button>
        </div>
      </StaggerContainer>
    </div>
  );
}
