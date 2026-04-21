import { Card, CardContent } from '@/components/ui/card';
import { FadeInView } from '@/motion/FadeInView';
import { philosophyData } from '../data/philosophy-data';

export function Philosophy() {
  return (
    <section
      id="philosophy"
      className="py-32 border-t border-border bg-[#F8FAFC]/80 dark:bg-[#0c0e12]"
    >
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeInView>
            <div className="max-w-xl">
              <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight mb-6">
                투자의 본질을
                <br />
                꿰뚫는 VELA의 시선.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                우리는 수많은 정보 속에서 길을 잃지 않습니다. VELA는 오로지
                본질에 집중하며, 투자자가 가장 올바른 결정을 내릴 수 있도록 돕는
                나침반 역할을 합니다. 감정이나 군중 심리에 휩쓸리지 않는 단단한
                철학이 우리의 기반입니다.
              </p>

              <div className="w-20 h-px bg-slate-300 dark:bg-slate-700 mb-8"></div>

              <p className="font-['Sora'] font-light tracking-[0.2em] text-sm text-slate-800 dark:text-slate-200">
                MARKET INTELLIGENCE REDEFINED
              </p>
            </div>
          </FadeInView>

          <div className="space-y-4">
            {/* 철학 데이터를 반복문으로 렌더링 */}
            {philosophyData.map((item, idx) => (
              <FadeInView key={idx} delay={idx * 0.15}>
                <Card
                  variant="artistic"
                  className="hover:border-blue-500/30 transition-colors shadow-none"
                >
                  <CardContent className="p-6 sm:px-8 sm:py-6 flex gap-6 items-start">
                    <div className="w-10 h-10 shrink-0 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F1115]">
                      <div className="text-blue-500">{item.icon}</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
