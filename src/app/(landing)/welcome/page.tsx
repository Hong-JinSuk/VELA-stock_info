'use client';
import {
  Activity,
  ArrowUpDown,
  BarChart3,
  BookOpen,
  DollarSign,
  Globe,
  Moon,
  PieChart,
  Search,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  bondETFs,
  macroIndicators,
  marketIndices,
  sectorETFs,
} from '../welcome/components/data';

type TabType = 'indices' | 'sectors' | 'bonds' | 'macro';
type SortKey = 'sector' | 'ticker';
type SortDirection = 'asc' | 'desc';

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('indices');
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = (event: React.MouseEvent) => {
    // 1. 브라우저가 View Transitions를 지원하지 않으면 그냥 바꿈
    if (!document.startViewTransition) {
      setIsDarkMode(!isDarkMode);
      return;
    }

    // 2. 애니메이션 실행
    document.startViewTransition(() => {
      // 이 콜백 안에서 테마 상태를 바꿔야
      // 브라우저가 이전 화면과 새 화면을 비교해서 애니메이션을 만듭니다.
      setIsDarkMode(!isDarkMode);
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const sortedSectorETFs = [...sectorETFs].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans transition-colors duration-200">
      {/* Header */}
      <header className="bg-theme-bg border-b border-theme-border sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-theme-hover p-2 rounded-lg border border-theme-border transition-colors duration-200">
                <TrendingUp className="w-5 h-5 text-theme-green drop-shadow-[0_0_8px_var(--accent-green)]" />
              </div>
              <h1 className="text-[20px] font-bold tracking-[-0.02em] uppercase text-theme-text transition-colors duration-200">
                US Market Explorer
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-dim" />
                <input
                  type="text"
                  placeholder="티커 검색..."
                  className="pl-9 pr-4 py-2 bg-theme-card border border-theme-border rounded-full text-[13px] focus:bg-theme-hover focus:border-theme-blue focus:ring-1 focus:ring-theme-blue transition-all outline-none w-64 text-theme-text placeholder-theme-dim"
                />
              </div>
              <button
                onClick={(e) => toggleTheme(e)}
                className="p-2 rounded-full bg-theme-hover border border-theme-border text-theme-text hover:bg-theme-active transition-colors duration-200"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-[24px] font-bold tracking-[-0.02em] uppercase text-theme-text mb-2 transition-colors duration-200">
            미국 주식 시장 가이드
          </h2>
          <p className="text-theme-dim text-[13px] max-w-3xl transition-colors duration-200">
            성공적인 투자를 위한 핵심 지표와 ETF 정보를 한눈에 확인하세요. 시장
            대표 지수부터 섹터, 채권, 거시경제 지표까지 필수 데이터를
            정리했습니다.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto pb-2 mb-6 hide-scrollbar">
          <div className="flex space-x-2 bg-theme-card p-1 rounded-xl border border-theme-border shadow-sm transition-colors duration-200">
            <TabButton
              active={activeTab === 'indices'}
              onClick={() => setActiveTab('indices')}
              icon={<Globe className="w-4 h-4" />}
              label="대표 지수 ETF"
            />
            <TabButton
              active={activeTab === 'sectors'}
              onClick={() => setActiveTab('sectors')}
              icon={<PieChart className="w-4 h-4" />}
              label="11대 섹터 ETF"
            />
            <TabButton
              active={activeTab === 'bonds'}
              onClick={() => setActiveTab('bonds')}
              icon={<DollarSign className="w-4 h-4" />}
              label="주요 채권 ETF"
            />
            <TabButton
              active={activeTab === 'macro'}
              onClick={() => setActiveTab('macro')}
              icon={<Activity className="w-4 h-4" />}
              label="거시 지표"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'indices' && (
              <motion.div
                key="indices"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {marketIndices.map((item, idx) => (
                  <IndexCard key={idx} item={item} />
                ))}
              </motion.div>
            )}

            {activeTab === 'sectors' && (
              <motion.div
                key="sectors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-theme-card rounded-xl border border-theme-border overflow-hidden transition-colors duration-200"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-theme-bg border-b border-theme-border transition-colors duration-200">
                        <th
                          className="py-3 px-5 text-[12px] font-semibold text-theme-dim uppercase cursor-pointer hover:text-theme-text transition-colors select-none"
                          onClick={() => handleSort('sector')}
                        >
                          <div className="flex items-center gap-1">
                            섹터
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th
                          className="py-3 px-5 text-[12px] font-semibold text-theme-dim uppercase cursor-pointer hover:text-theme-text transition-colors select-none"
                          onClick={() => handleSort('ticker')}
                        >
                          <div className="flex items-center gap-1">
                            티커
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="py-3 px-5 text-[12px] font-semibold text-theme-dim uppercase">
                          특징
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {sortedSectorETFs.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-theme-hover transition-colors duration-200"
                        >
                          <td className="py-3 px-5 text-[13px] font-medium text-theme-text">
                            {item.sector}
                          </td>
                          <td className="py-3 px-5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-theme-hover text-theme-blue border border-theme-border transition-colors duration-200">
                              {item.ticker}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-[13px] text-theme-dim">
                            {item.features}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'bonds' && (
              <motion.div
                key="bonds"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {bondETFs.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-theme-card p-5 rounded-xl border border-theme-border flex flex-col h-full hover:border-theme-green transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[15px] font-bold text-theme-text">
                        {item.type}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-theme-hover text-theme-green border border-theme-border transition-colors duration-200">
                        {item.ticker}
                      </span>
                    </div>
                    <div className="mt-auto flex items-start gap-3 bg-theme-bg p-3 rounded-lg border border-theme-border transition-colors duration-200">
                      <BookOpen className="w-4 h-4 text-theme-dim shrink-0 mt-0.5" />
                      <p className="text-theme-dim text-[12px] leading-relaxed">
                        {item.purpose}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'macro' && (
              <motion.div
                key="macro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Group by category */}
                {[
                  '거시 경제 (Macro)',
                  '시장 심리 (Sentiment)',
                  '기업 및 기타',
                ].map((category) => (
                  <div
                    key={category}
                    className="bg-theme-card rounded-xl border border-theme-border overflow-hidden flex flex-col transition-colors duration-200"
                  >
                    <div className="bg-theme-bg px-5 py-3 border-b border-theme-border transition-colors duration-200">
                      <h3 className="text-[13px] font-semibold text-theme-dim uppercase flex items-center gap-2">
                        {category === '거시 경제 (Macro)' && (
                          <Globe className="w-4 h-4 text-theme-blue" />
                        )}
                        {category === '시장 심리 (Sentiment)' && (
                          <Activity className="w-4 h-4 text-theme-red" />
                        )}
                        {category === '기업 및 기타' && (
                          <BarChart3 className="w-4 h-4 text-theme-gold" />
                        )}
                        {category}
                      </h3>
                    </div>
                    <div className="p-5 flex-1 flex flex-col gap-5">
                      {macroIndicators
                        .filter((i) => i.category === category)
                        .map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-theme-blue" />
                              <h4 className="text-[14px] font-bold text-theme-text">
                                {item.item}
                              </h4>
                            </div>
                            <div className="pl-3 border-l border-theme-border ml-0.5 flex flex-col gap-2 transition-colors duration-200">
                              <p className="text-[12px] text-theme-dim">
                                <span className="font-medium text-theme-text">
                                  체크포인트:
                                </span>{' '}
                                {item.checkpoint}
                              </p>
                              <p className="text-[12px] text-theme-text bg-theme-hover border border-theme-border p-2.5 rounded-lg transition-colors duration-200">
                                <span className="font-medium text-theme-blue">
                                  인사이트:
                                </span>{' '}
                                {item.insight}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
        active
          ? 'bg-theme-active text-theme-text shadow-sm'
          : 'text-theme-dim hover:text-theme-text hover:bg-theme-hover'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function IndexCard({ item }: { item: any }) {
  return (
    <div className="bg-theme-card p-4 rounded-xl border border-theme-border flex flex-col h-full hover:border-theme-blue transition-all duration-200">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-semibold tracking-wider text-theme-dim uppercase">
          {item.category}
        </span>
        <span className="text-[10px] font-medium bg-theme-hover text-theme-text px-2 py-0.5 rounded border border-theme-border transition-colors duration-200">
          수수료: {item.fee}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-[16px] font-bold text-theme-text">{item.ticker}</h3>
        <span className="text-[12px] font-medium text-theme-dim">
          {item.name}
        </span>
      </div>

      <div className="mt-auto">
        <p className="text-[12px] text-theme-dim leading-relaxed">
          {item.desc}
        </p>
      </div>
    </div>
  );
}
