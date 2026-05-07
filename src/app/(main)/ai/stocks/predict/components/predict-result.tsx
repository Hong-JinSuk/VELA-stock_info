'use client';

import { useExportPdf } from '@/hooks/use-export-pdf';
import { cn } from '@/lib/utils';
import { aiPredictResultAtom } from '@/store/ai-atom';
import { useAtomValue } from 'jotai';
import {
  BarChart3,
  Download,
  Loader2,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function PredictionResult() {
  const result = useAtomValue(aiPredictResultAtom);
  const stockName = result?.targetStockName || '';
  const { exportPdf, isExporting } = useExportPdf();

  return (
    <div className="lg:col-span-8 flex flex-col h-full min-h-0 lg:overflow-y-auto lg:pr-3 rounded-3xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
      <AnimatePresence mode="wait">
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

                {/* Abstract Grid background */}
                <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-20 pointer-events-none flex items-end justify-end p-8">
                  <Target
                    className="w-48 h-48 text-primary mb-[-2rem] mr-[-2rem]"
                    strokeWidth={1}
                  />
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
        ) : (
          /* 5. 분리된 빈 상태(Empty) 렌더링 */
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

function EmptyState() {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 bg-card rounded-3xl border border-border flex flex-col items-center justify-center p-8 text-center min-h-[400px]"
    >
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-2 border-dashed border-border rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-2 border-2 border-border rounded-full flex items-center justify-center bg-background">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-wide">
        Awaiting Data Vectors
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">
        Configure the primary prediction target and provide raw market context
        on the left to initialize the AI analysis sequence.
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
