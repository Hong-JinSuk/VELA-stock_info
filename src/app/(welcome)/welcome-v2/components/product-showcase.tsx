import { FadeInView } from '@/motion/fade-in-view';
import { PRODUCT_DEMOS } from '../demos';
import BrowserFrame from './browser-frame';

// 실사용 화면 쇼케이스 — 데모 레지스트리를 순회하며 캡션 + 브라우저 프레임으로 표시.
// 데스크톱에서는 텍스트/화면을 좌우 교차 배치, 모바일에서는 세로 스택.
export default function ProductShowcase() {
  return (
    <section
      id="showcase"
      className="border-t border-border bg-[#F8FAFC]/80 py-20 dark:bg-[#0c0e12] sm:py-28"
    >
      <div className="mx-auto max-w-[1200px] px-6 sm:px-8">
        <FadeInView className="mb-16 max-w-2xl">
          <p className="mb-3 text-sm font-medium tracking-wide text-blue-500">
            PRODUCT
          </p>
          <h2 className="mb-4 font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            말로 설명하지 않습니다.
            <br />
            실제 화면을 보여드립니다.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            VELA가 실제로 어떻게 동작하는지, 핵심 화면 그대로 미리 만나보세요.
          </p>
        </FadeInView>

        <div className="flex flex-col gap-20 sm:gap-28">
          {PRODUCT_DEMOS.map(({ id, eyebrow, title, description, path, Component, width }, idx) => {
            const reversed = idx % 2 === 1;
            return (
              <FadeInView key={id}>
                <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
                  {/* 캡션 */}
                  <div
                    className={`lg:col-span-4 ${
                      reversed ? 'lg:order-2 lg:col-start-9' : 'lg:order-1'
                    }`}
                  >
                    <p className="mb-2 text-xs font-semibold tracking-wider text-blue-500">
                      {eyebrow}
                    </p>
                    <h3 className="mb-3 font-serif text-2xl font-normal tracking-tight sm:text-3xl">
                      {title}
                    </h3>
                    <p className="leading-relaxed text-slate-600 dark:text-slate-400 break-keep">
                      {description}
                    </p>
                  </div>

                  {/* 화면 */}
                  <div
                    className={`lg:col-span-8 ${
                      reversed ? 'lg:order-1 lg:col-start-1' : 'lg:order-2'
                    }`}
                  >
                    <BrowserFrame path={path}>
                      <div className={width === 'wide' ? 'overflow-x-auto' : ''}>
                        <Component />
                      </div>
                    </BrowserFrame>
                  </div>
                </div>
              </FadeInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}
