import { FadeInView } from '@/motion/FadeInView';
import { motion } from 'motion/react';

export function Hero() {
  return (
    <main
      id="hero"
      className="grid lg:grid-cols-2 min-h-screen pt-20 max-w-[1440px] mx-auto"
    >
      {/* Left Content */}
      <div className="p-8 lg:p-20 flex flex-col justify-center border-r border-black/10 dark:border-white/10 relative">
        <FadeInView>
          <div className="inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-500 border border-blue-500 rounded-full mb-8">
            Premium Insights
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight mb-8 leading-[1.1]">
            데이터가 아닌,
            <br />
            <span className="italic text-blue-500">기회</span>를 읽는 법.
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-md leading-relaxed">
            투자는 복잡한 데이터와 씨름하는 것이 아닙니다. VELA는 방대한 시장
            데이터를 분석하여, 당신의 의사결정에 꼭 필요한 핵심 신호만을
            직관적으로 전달합니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-blue-500 text-white px-8 py-4 rounded font-semibold transition-colors hover:bg-blue-600">
              지금 시작하기
            </button>
            <button className="bg-transparent border border-black/10 dark:border-white/10 px-8 py-4 rounded font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5">
              서비스 소개서 보기
            </button>
          </div>
        </FadeInView>
      </div>

      {/* Right Content */}
      <div className="p-8 lg:p-0 flex items-center justify-center relative bg-[radial-gradient(circle_at_70%_30%,#e2e8f0_0%,#F8FAFC_100%)] dark:bg-[radial-gradient(circle_at_70%_30%,#1E293B_0%,#0F1115_100%)] border-t lg:border-t-0 border-black/10 dark:border-white/10 overflow-hidden min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 w-full max-w-md lg:max-w-none relative flex justify-center items-center"
        >
          {/* Abstract visual */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[400px] h-[400px] rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center relative">
              <div className="w-[70%] h-[70%] rounded-full border border-blue-500/40 relative"></div>
              <div className="absolute w-[6px] h-[6px] bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] top-[20%] right-[20%]" />
              <div className="absolute w-[6px] h-[6px] bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] bottom-[30%] left-[10%]" />
              <div className="absolute w-[6px] h-[6px] bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] top-[50%] -right-[3px]" />
              <svg
                width="300"
                height="200"
                viewBox="0 0 300 200"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none !overflow-visible"
              >
                <path
                  d="M0,150 Q75,140 150,100 T300,20"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  opacity="0.6"
                />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
