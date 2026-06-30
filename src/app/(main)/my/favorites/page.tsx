'use client';

import { MacroCard } from '@/components/common/macro-card';
import { useFavorites } from '@/lib/services/favorites/use-favorites';
import { useSectorPerformance } from '@/lib/services/market/use-sector-performance';
import { useMacroIndicators } from '@/lib/services/stock/use-macro-indicators';
import {
  Building2,
  CandlestickChart,
  LayoutGrid,
  type LucideIcon,
  Star,
  TrendingUp,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import FavoriteThirteenFTable from './components/favorite-13f-table';
import FavoriteSectorTable from './components/favorite-sector-table';
import FavoriteStockTable from './components/favorite-stock-table';

type SectionKey = 'INDICATOR' | 'SECTOR' | 'THIRTEENF_FILER' | 'STOCK';

// 섹션별 테마(아이콘 배지 + 컬러)로 즐겨찾기 종류를 한눈에 구분.
type SectionTheme = {
  icon: LucideIcon;
  badge: string; // 아이콘 배지 배경/글자 컬러
  activeChip: string; // 탭 활성(scrollspy) 시 컬러
};

const SECTION_THEME: Record<SectionKey, SectionTheme> = {
  INDICATOR: {
    icon: TrendingUp,
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    activeChip: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/30',
  },
  SECTOR: {
    icon: LayoutGrid,
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    activeChip:
      'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/30',
  },
  THIRTEENF_FILER: {
    icon: Building2,
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    activeChip:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/30',
  },
  STOCK: {
    icon: CandlestickChart,
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    activeChip:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30',
  },
};

const SECTION_TITLE: Record<SectionKey, string> = {
  INDICATOR: '경제 지표',
  SECTOR: '섹터 지표',
  THIRTEENF_FILER: '13F 기관',
  STOCK: '종목',
};

export default function Page() {
  const { data: favorites, isLoading, isError, error } = useFavorites();
  const { data: indicators } = useMacroIndicators();
  const { data: sectors } = useSectorPerformance();

  const scrollRef = useRef<HTMLElement>(null);
  const sectionRefs = useRef<Map<SectionKey, HTMLElement>>(new Map());
  const [active, setActive] = useState<SectionKey | null>(null);

  const favs = favorites ?? [];

  // 종류별로 따로 추려둔다. (각 섹션을 독립적으로 렌더하기 위함)
  const indKeys = new Set(
    favs.filter((f) => f.type === 'INDICATOR').map((f) => f.itemKey),
  );
  const secKeys = new Set(
    favs.filter((f) => f.type === 'SECTOR').map((f) => f.itemKey),
  );
  const favIndicators = (indicators ?? []).filter((i) =>
    indKeys.has(i.indicatorId),
  );
  const favSectors = (sectors ?? []).filter((s) => secKeys.has(s.ticker));
  const filerFavs = favs.filter((f) => f.type === 'THIRTEENF_FILER');
  const stockFavs = favs.filter((f) => f.type === 'STOCK');

  const isEmpty = !isLoading && favs.length === 0;

  // 화면에 존재하는 섹션만 (순서 고정).
  const sections: { key: SectionKey; count: number; content: ReactNode }[] = [];
  if (favIndicators.length > 0)
    sections.push({
      key: 'INDICATOR',
      count: favIndicators.length,
      content: (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 lg:gap-6">
          {favIndicators.map((indicator) => (
            <MacroCard
              key={indicator.indicatorId}
              indicator={indicator}
              showFavorite
            />
          ))}
        </div>
      ),
    });
  if (favSectors.length > 0)
    sections.push({
      key: 'SECTOR',
      count: favSectors.length,
      content: <FavoriteSectorTable sectors={favSectors} />,
    });
  if (filerFavs.length > 0)
    sections.push({
      key: 'THIRTEENF_FILER',
      count: filerFavs.length,
      content: <FavoriteThirteenFTable ciks={filerFavs.map((f) => f.itemKey)} />,
    });
  if (stockFavs.length > 0)
    sections.push({
      key: 'STOCK',
      count: stockFavs.length,
      content: <FavoriteStockTable items={stockFavs} />,
    });

  const sectionKeys = sections.map((s) => s.key).join(',');

  // 스크롤 위치에 따라 현재 보고 있는 섹션을 탭에 하이라이트(scrollspy).
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || sectionKeys.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const key = visible[0]?.target.getAttribute('data-key');
        if (key) setActive(key as SectionKey);
      },
      // 상단 sticky 탭(약 64px) 아래로 들어온 섹션을 활성으로.
      { root, rootMargin: '-72px 0px -65% 0px', threshold: 0 },
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionKeys]);

  function registerRef(key: SectionKey, el: HTMLElement | null) {
    if (el) sectionRefs.current.set(key, el);
    else sectionRefs.current.delete(key);
  }

  function scrollTo(key: SectionKey) {
    sectionRefs.current
      .get(key)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(key);
  }

  return (
    <main
      ref={scrollRef}
      className="flex flex-1 min-h-0 flex-col overflow-y-auto no-scrollbar"
    >
      <div className="flex flex-col gap-8 p-6">
        <header>
          <h1 className="font-serif text-xl tracking-tight">즐겨찾기</h1>
          <p className="mt-1 text-sm text-muted-foreground break-keep">
            관심 지표·섹터·종목·기관을 한곳에서 모아 봅니다.
          </p>
        </header>

        {isError ? (
          <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : '즐겨찾기를 불러올 수 없습니다.'}
          </div>
        ) : isLoading ? (
          <div className="text-sm text-muted-foreground">불러오는 중...</div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Star className="mx-auto mb-3 size-6 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              아직 즐겨찾기가 없어요.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70 break-keep">
              지표·섹터·종목·13F 화면에서 별표를 눌러 추가하세요.
            </p>
          </div>
        ) : (
          <>
            {/* 상단 고정 탭 — 클릭 시 해당 섹션으로 이동 + scrollspy 하이라이트 */}
            <nav className="sticky top-0 z-20 -mx-6 -my-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-border bg-background/90 px-6 py-3 backdrop-blur">
              {sections.map(({ key, count }) => (
                <NavTab
                  key={key}
                  sectionKey={key}
                  count={count}
                  isActive={active === key}
                  onSelect={scrollTo}
                />
              ))}
            </nav>

            {sections.map(({ key, count, content }) => (
              <Section
                key={key}
                sectionKey={key}
                count={count}
                registerRef={registerRef}
              >
                {content}
              </Section>
            ))}
          </>
        )}
      </div>
    </main>
  );
}

// 상단 탭 하나. 클릭 시 해당 섹션으로 부드럽게 스크롤하고, scrollspy 활성 컬러를 입는다.
function NavTab({
  sectionKey,
  count,
  isActive,
  onSelect,
}: {
  sectionKey: SectionKey;
  count: number;
  isActive: boolean;
  onSelect: (key: SectionKey) => void;
}) {
  const theme = SECTION_THEME[sectionKey];
  const Icon = theme.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(sectionKey)}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        isActive
          ? `ring-1 ${theme.activeChip}`
          : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      <Icon className="size-3.5 shrink-0" />
      {SECTION_TITLE[sectionKey]}
      <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}

// 섹션 한 칸(헤더 + 내용). data-key/ref로 scrollspy IntersectionObserver가 관찰한다.
function Section({
  sectionKey,
  count,
  registerRef,
  children,
}: {
  sectionKey: SectionKey;
  count: number;
  registerRef: (key: SectionKey, el: HTMLElement | null) => void;
  children: ReactNode;
}) {
  const theme = SECTION_THEME[sectionKey];
  const Icon = theme.icon;
  return (
    <section
      data-key={sectionKey}
      ref={(el) => registerRef(sectionKey, el)}
      className="scroll-mt-20"
    >
      <header className="mb-3 flex items-center gap-2">
        <span
          className={`flex size-6 items-center justify-center rounded-md ${theme.badge}`}
        >
          <Icon className="size-3.5" />
        </span>
        <h2 className="text-base font-semibold text-foreground">
          {SECTION_TITLE[sectionKey]}
        </h2>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground/80">
          {count}
        </span>
      </header>
      {children}
    </section>
  );
}
