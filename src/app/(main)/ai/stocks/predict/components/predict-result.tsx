'use client';

import { useExportPdf } from '@/hooks/use-export-pdf';
import { cn } from '@/lib/utils';
import { aiPredictResultAtom } from '@/store/ai-atom';
import { useIsMutating, useMutationState } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { Download, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const PREDICT_MUTATION_KEY = ['predict-target-price'];
const LOADING_PHASES = [
  '시장 데이터 수집 중...',
  'AI 분석 모델 실행 중...',
  '예측 결과 생성 중...',
];
const LOADING_PHASE_INTERVAL_MS = 3000;

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function PredictionResult() {
  const result = useAtomValue(aiPredictResultAtom);
  const isPredicting = useIsMutating({ mutationKey: PREDICT_MUTATION_KEY }) > 0;
  const pendingVariables = useMutationState({
    filters: { mutationKey: ['predict-target-price'], status: 'pending' },
    select: (m) =>
      m.state.variables as { stockName: string; stockData: string } | undefined,
  });

  const stockName = pendingVariables[0]?.stockName;
  const { exportPdf, isExporting } = useExportPdf();

  return (
    <div className="flex flex-col h-full min-h-0 max-h-[75svh] md:max-h-none overflow-y-auto pr-3 rounded-3xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
      <AnimatePresence mode="popLayout">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col h-full gap-4 pb-4"
          >
            <div
              id="prediction-result"
              className="grid grid-cols-1 md:grid-cols-8 gap-4 bg-transparent"
            >
              {/* 1. Top Primary Card (헤더 영역) */}
              <div className="md:col-span-8 bg-card rounded-3xl border border-border p-8 flex flex-col justify-between relative overflow-hidden group">
                <div className="z-10 relative">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-primary text-xs font-serif font-bold uppercase tracking-widest">
                          Primary Prediction
                        </p>
                        <ExportButton
                          onClick={() =>
                            exportPdf(
                              'prediction-result',
                              `${stockName}_analysis.pdf`,
                            )
                          }
                          isExporting={isExporting}
                        />
                      </div>
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground uppercase tracking-tight flex items-center">
                        {stockName}
                        {getRecommendationBadge(result.recommendation)}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1">
                        Current Price
                      </p>
                      <p className="text-lg md:text-xl lg:text-2xl font-mono text-foreground">
                        {result?.currentPrice}
                      </p>
                    </div>
                  </div>

                  {/* 2. 분리된 예측 그리드 영역 */}
                  <PredictionGrid predictions={result.predictions} />
                </div>

                {/* Abstract Chart background */}
                <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-20 pointer-events-none flex items-end justify-end p-8">
                  <svg
                    viewBox="0 0 200 200"
                    className="w-48 h-48 text-primary mb-[-2rem] mr-[-2rem]"
                    fill="none"
                  >
                    <g stroke="currentColor" strokeWidth="0.5" opacity="0.3">
                      <line x1="0" y1="50" x2="200" y2="50" />
                      <line x1="0" y1="100" x2="200" y2="100" />
                      <line x1="0" y1="150" x2="200" y2="150" />
                      <line x1="50" y1="0" x2="50" y2="200" />
                      <line x1="100" y1="0" x2="100" y2="200" />
                      <line x1="150" y1="0" x2="150" y2="200" />
                    </g>
                    <motion.path
                      d="M 0 160 L 30 140 L 60 150 L 90 110 L 120 100 L 150 70 L 180 50 L 200 30 L 200 200 L 0 200 Z"
                      fill="currentColor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.18 }}
                      transition={{ duration: 1.2, delay: 1 }}
                    />
                    <motion.path
                      d="M 0 160 L 30 140 L 60 150 L 90 110 L 120 100 L 150 70 L 180 50 L 200 30"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.8, ease: 'easeOut' }}
                    />
                    {(
                      [
                        [30, 140],
                        [60, 150],
                        [90, 110],
                        [120, 100],
                        [150, 70],
                        [180, 50],
                      ] as const
                    ).map(([x, y], i) => (
                      <motion.circle
                        key={`${x}-${y}`}
                        cx={x}
                        cy={y}
                        r="2.5"
                        fill="currentColor"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.2, duration: 0.3 }}
                      />
                    ))}
                  </svg>
                </div>
              </div>

              {/* 3. 분리된 시나리오 영역 (공통 컴포넌트 재사용) */}
              <ScenarioCard
                type="bull"
                title="Strong Bull Case"
                icon={<TrendingUp className="w-4 h-4" />}
                content={result?.bullCase}
              />
              <ScenarioCard
                type="bear"
                title="Hard Bear Case"
                icon={<TrendingDown className="w-4 h-4" />}
                content={result?.bearCase}
              />

              {/* 4. 분리된 Logic Insights 영역 */}
              <LogicInsights
                summary={result?.oneLineSummary}
                rationale={result?.rationale}
              />
            </div>
          </motion.div>
        ) : isPredicting ? (
          /* 5-a. 예측 진행 중 상태 */
          <LoadingState stockName={stockName} />
        ) : (
          /* 5-b. 분리된 빈 상태(Empty) 렌더링 */
          <EmptyState />
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// Sub Components (UI 전용 컴포넌트들)
// ----------------------------------------------------------------------

function ExportButton({
  onClick,
  isExporting,
}: {
  onClick: () => void;
  isExporting: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isExporting}
      data-export-ignore="true"
      className={cn(
        'hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1 rounded-full outline-none',
        isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-3 h-3" />
          Export PDF
        </>
      )}
    </button>
  );
}

function PredictionGrid({ predictions }: { predictions: any }) {
  if (!predictions) return null;

  return (
    <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2 sm:gap-3">
      {Object.entries(predictions).map(([period, data]: [string, any]) => (
        <div
          key={period}
          className="bg-secondary/50 border border-border p-4 rounded-2xl flex flex-col justify-center min-w-0"
        >
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2 truncate">
            {period.replace('m', ' Months')}
          </p>
          <p className="text-base md:text-lg lg:text-xl font-bold text-foreground tracking-tighter mb-1 break-words">
            {data.targetPrice}
          </p>
          <p
            className={cn(
              'text-xs font-bold tracking-wider truncate',
              data.upsidePotential?.includes('-')
                ? 'text-rose-400'
                : 'text-primary',
            )}
          >
            {data.upsidePotential}
          </p>
        </div>
      ))}
    </div>
  );
}

function ScenarioCard({
  type,
  title,
  icon,
  content,
}: {
  type: 'bull' | 'bear';
  title: string;
  icon: React.ReactNode;
  content?: string;
}) {
  const isBull = type === 'bull';

  return (
    <div className="md:col-span-4 bg-card rounded-3xl border border-border p-6 flex flex-col relative overflow-hidden group">
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full',
          isBull ? 'bg-primary' : 'bg-rose-500',
        )}
      />
      <h3
        className={cn(
          'text-[10px] font-black mb-3 uppercase tracking-widest flex items-center gap-2',
          isBull ? 'text-primary' : 'text-rose-400',
        )}
      >
        {icon} {title}
      </h3>
      <div
        className={cn(
          'prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-headings:font-bold prose-p:text-foreground prose-p:leading-relaxed prose-ul:text-foreground',
          isBull
            ? 'prose-strong:text-primary prose-li:marker:text-primary'
            : 'prose-strong:text-rose-400 prose-li:marker:text-rose-400',
        )}
      >
        <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>
          {content?.replace(/\\n/g, '\n')}
        </Markdown>
      </div>
    </div>
  );
}

function LogicInsights({
  summary,
  rationale,
}: {
  summary?: string;
  rationale?: string;
}) {
  return (
    <div className="md:col-span-8 bg-card rounded-3xl border border-border p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
          <span className="w-1.5 h-4 bg-primary rounded-sm" />
          Prediction Logic Insights
        </h3>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {summary}
        </h2>
      </div>
      <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-headings:font-bold prose-headings:border-b prose-headings:border-border prose-headings:pb-2 prose-a:text-primary prose-p:text-foreground prose-p:leading-relaxed prose-strong:text-primary prose-ul:text-foreground prose-li:marker:text-primary">
        <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>
          {rationale?.replace(/\\n/g, '\n')}
        </Markdown>
      </div>
    </div>
  );
}

function LoadingState({ stockName }: { stockName?: string }) {
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIdx((i) => (i + 1) % LOADING_PHASES.length);
    }, LOADING_PHASE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const candles = [
    { x: 9, delay: 0 },
    { x: 16, delay: 0.15 },
    { x: 23, delay: 0.3 },
    { x: 30, delay: 0.45 },
    { x: 37, delay: 0.6 },
  ];

  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 bg-transparent rounded-3xl border border-border flex flex-col items-center justify-center p-8 text-center min-h-[400px] relative overflow-hidden"
    >
      <motion.div
        layoutId="predict-chart-frame"
        className="relative w-32 h-32 mb-6"
        transition={{
          layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        {/* 바깥 회전 링 */}
        <motion.div
          className="absolute inset-0 border-2 border-dashed border-primary/40 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        {/* 안쪽 역회전 링 */}
        <motion.div
          className="absolute inset-2 border border-primary/30 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        {/* 펄스 글로우 */}
        <motion.div
          className="absolute inset-3 rounded-full bg-primary/10"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* 궤도 도트 */}
        {[0, 120, 240].map((angle) => (
          <motion.div
            key={angle}
            className="absolute inset-0"
            initial={{ rotate: angle }}
            animate={{ rotate: angle + 360 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <div className="absolute top-1 left-1/2 -ml-[3px] w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          </motion.div>
        ))}
        {/* 중앙 차트 */}
        <div className="absolute inset-5 rounded-full bg-background flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 48 48" className="w-14 h-14" fill="none">
            <g
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-border"
              opacity="0.4"
            >
              <line x1="4" y1="16" x2="44" y2="16" />
              <line x1="4" y1="24" x2="44" y2="24" />
              <line x1="4" y1="32" x2="44" y2="32" />
            </g>
            {candles.map(({ x, delay }) => (
              <motion.rect
                key={x}
                x={x - 1.5}
                width="3"
                rx="0.5"
                fill="currentColor"
                className="text-primary"
                animate={{
                  y: [22, 10, 26, 14, 22],
                  height: [4, 22, 4, 18, 4],
                }}
                transition={{
                  duration: 1.6,
                  delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
            <motion.line
              y1="6"
              y2="42"
              stroke="currentColor"
              strokeWidth="0.6"
              className="text-primary"
              opacity="0.6"
              animate={{ x1: [2, 46, 2], x2: [2, 46, 2] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </svg>
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
        className="relative text-lg font-bold text-foreground mb-2 uppercase tracking-wide"
      >
        {`VELA가 "${stockName}" 종목을 분석하고 있어요`}
      </motion.h3>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
        className="relative h-5 mb-4 flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={phaseIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-muted-foreground font-medium"
          >
            {LOADING_PHASES[phaseIdx]}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* indeterminate 진행 바 */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
        className="relative w-48 h-0.5 bg-border/60 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full w-1/3 bg-primary rounded-full"
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.45, ease: 'easeOut' }}
        className="relative mt-4 text-xs text-muted-foreground/70 max-w-xs"
      >
        분석에는 최대 1~2분 정도 소요될 수 있습니다.
      </motion.p>
    </motion.div>
  );
}

function EmptyState() {
  const candles = [
    { x: 11, delay: 0 },
    { x: 18, delay: 0.25 },
    { x: 25, delay: 0.5 },
    { x: 32, delay: 0.75 },
    { x: 39, delay: 1.0 },
  ];

  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 bg-card rounded-3xl border border-border flex flex-col items-center justify-center p-8 text-center min-h-[400px]"
    >
      <motion.div
        layoutId="predict-chart-frame"
        className="relative w-24 h-24 mb-6"
        transition={{
          layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        <div className="absolute inset-0 border-2 border-dashed border-border rounded-full animate-[spin_6s_linear_infinite]" />
        <motion.div
          className="absolute inset-1 border border-primary/40 rounded-full"
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-2 border-2 border-border rounded-full flex items-center justify-center bg-background overflow-hidden">
          <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
            <g
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-border"
              opacity="0.4"
            >
              <line x1="6" y1="14" x2="42" y2="14" />
              <line x1="6" y1="24" x2="42" y2="24" />
              <line x1="6" y1="34" x2="42" y2="34" />
            </g>
            {candles.map(({ x, delay }) => (
              <motion.rect
                key={x}
                x={x - 1.5}
                width="3"
                rx="0.5"
                fill="currentColor"
                className="text-primary"
                animate={{
                  y: [22, 12, 24, 16, 22],
                  height: [4, 18, 4, 14, 4],
                }}
                transition={{
                  duration: 2.4,
                  delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
            <motion.line
              y1="8"
              y2="40"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary"
              opacity="0.5"
              animate={{
                x1: [4, 44, 4],
                x2: [4, 44, 4],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </svg>
        </div>
      </motion.div>
      {/* Awaiting Data Vectors */}
      <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-wide">
        AI 분석 대기 중
      </h3>
      {/* Configure the primary prediction target and provide raw market context
          on the left to initialize the AI analysis sequence. */}
      <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">
        왼쪽에 종목명과 시장 데이터를 입력하면 AI가 예측을 시작합니다.
      </p>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------

const getRecommendationBadge = (rec?: string) => {
  if (!rec) return null;
  let bgColor = 'bg-primary/20',
    textColor = 'text-primary',
    borderColor = 'border-primary/30';

  if (rec.includes('강력 매수')) {
    bgColor = 'bg-primary/30';
    textColor = 'text-primary';
    borderColor = 'border-primary/50';
  } else if (rec.includes('매도')) {
    bgColor = 'bg-rose-500/20';
    textColor = 'text-rose-400';
    borderColor = 'border-rose-500/30';
    if (rec.includes('강력')) {
      bgColor = 'bg-rose-500/30';
      borderColor = 'border-rose-500/50';
    }
  } else if (rec.includes('보류')) {
    bgColor = 'bg-amber-500/20';
    textColor = 'text-amber-500';
    borderColor = 'border-amber-500/30';
  }

  return (
    <span
      className={cn(
        'px-3 py-1 rounded-full text-xs font-bold border ml-3 align-middle',
        bgColor,
        textColor,
        borderColor,
      )}
    >
      {rec}
    </span>
  );
};
