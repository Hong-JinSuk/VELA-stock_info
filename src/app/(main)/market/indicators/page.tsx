'use client';

import { MacroCard } from '@/components/common/macro-card';
import { useMacroIndicators } from '@/lib/services/stock/use-macro-indicators';
import type { MacroIndicator } from '@/types/macro-indicator';
import { useEffect, useMemo, useRef, useState } from 'react';

// catalog IndicatorCategory와 같은 순서. 표시 순서 + nav 정렬에 사용.
const CATEGORY_ORDER = [
  'inflation',
  'inflation_expectations',
  'employment',
  'growth',
  'fed',
  'rates',
  'equity',
  'business_cycle',
  'consumer',
  'housing',
  'credit',
  'sentiment',
  'currency',
  'commodities',
  'policy_event',
  'other',
] as const;

const CATEGORY_LABEL: Record<string, string> = {
  inflation: '인플레이션',
  inflation_expectations: '인플레 기대',
  employment: '고용',
  growth: '성장',
  fed: 'Fed',
  rates: '금리',
  equity: '주가지수',
  business_cycle: '경기',
  consumer: '소비자',
  housing: '주택',
  credit: '신용',
  sentiment: '시장심리',
  currency: '환율',
  commodities: '원자재',
  policy_event: '정책 이벤트',
  other: '기타',
};

type Group = { category: string; items: MacroIndicator[] };

function groupByCategory(items: MacroIndicator[]): Group[] {
  const map = new Map<string, MacroIndicator[]>();
  for (const ind of items) {
    const cat = ind.category ?? 'other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(ind);
  }
  const orderedKnown = CATEGORY_ORDER.filter((c) => map.has(c)) as string[];
  const unknown = [...map.keys()].filter(
    (c) => !CATEGORY_ORDER.includes(c as (typeof CATEGORY_ORDER)[number]),
  );
  return [...orderedKnown, ...unknown].map((c) => ({
    category: c,
    items: map.get(c)!,
  }));
}

export default function Page() {
  const { data: macroIndicators } = useMacroIndicators();
  const groups = useMemo(
    () => groupByCategory(macroIndicators ?? []),
    [macroIndicators],
  );

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // 첫 카테고리 active 초기화.
  useEffect(() => {
    if (!activeCategory && groups.length > 0) {
      setActiveCategory(groups[0].category);
    }
  }, [groups, activeCategory]);

  // scroll-spy: 화면 상단 부근에 있는 섹션을 active로.
  useEffect(() => {
    if (groups.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible.length > 0) {
          setActiveCategory(visible[0].target.id);
        }
      },
      {
        root: scrollRef.current,
        rootMargin: '-15% 0px -70% 0px',
        threshold: 0,
      },
    );
    for (const el of Object.values(sectionRefs.current)) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [groups]);

  // 보조: 스크롤이 끝까지 내려가면 마지막 카테고리를 강제 active.
  // rootMargin 상단 감지 zone이 마지막 섹션의 top까지 도달 못 하는 케이스 대응.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || groups.length === 0) return;
    function onScroll() {
      if (!el) return;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      if (atBottom) {
        setActiveCategory(groups[groups.length - 1].category);
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [groups]);

  const scrollToCategory = (category: string) => {
    const el = sectionRefs.current[category];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="flex flex-1 min-h-0 overflow-hidden gap-6 p-6">
      {/* 좌측 카테고리 nav — lg 이상에서만 표시 */}
      <nav className="hidden lg:block w-40 shrink-0">
        <ul className="space-y-1 text-sm sticky top-0">
          {groups.map(({ category, items }) => (
            <li key={category}>
              <button
                type="button"
                onClick={() => scrollToCategory(category)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between gap-2 ${
                  activeCategory === category
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
              >
                <span className="truncate">
                  {CATEGORY_LABEL[category] ?? category}
                </span>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">
                  {items.length}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 메인 스크롤 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar"
      >
        <div className="space-y-10">
          {groups.map(({ category, items }) => (
            <section
              key={category}
              id={category}
              ref={(el) => {
                sectionRefs.current[category] = el;
              }}
              className="scroll-mt-4"
            >
              <header className="mb-3 flex items-baseline gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  {CATEGORY_LABEL[category] ?? category}
                </h2>
                <span className="text-xs text-muted-foreground/70 tabular-nums">
                  {items.length}
                </span>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                {items.map((indicator) => (
                  <MacroCard
                    key={indicator.indicatorId}
                    indicator={indicator}
                    showFavorite
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
