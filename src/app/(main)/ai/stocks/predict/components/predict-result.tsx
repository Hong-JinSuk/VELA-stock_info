'use client';

import { useExportPdf } from '@/hooks/use-export-pdf';
import { aiPredictResultAtom } from '@/store/ai-atom';
import { useIsMutating, useMutationState } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import PredictChartSvg from './predict-result/predict-chart-svg';
import PredictEmptyState from './predict-result/predict-empty-state';
import PredictExportButton from './predict-result/predict-export-button';
import PredictGrid from './predict-result/predict-grid';
import PredictLoadingState from './predict-result/predict-loading-state';
import PredictLogicInsights from './predict-result/predict-logic-insights';
import PredictRecommendationBadge from './predict-result/predict-recommendation-badge';
import PredictScenarioCard from './predict-result/predict-scenario-card';

const PREDICT_MUTATION_KEY = ['predict-target-price'];

interface PendingPredictVariables {
  stockName: string;
  stockData: string;
}

// 예측 결과를 표시하는 메인 컨테이너. 결과 유무와 mutation 상태에 따라 결과/로딩/빈 상태를 전환한다.
export default function PredictionResult() {
  const result = useAtomValue(aiPredictResultAtom);
  const isPredicting = useIsMutating({ mutationKey: PREDICT_MUTATION_KEY }) > 0;
  const pendingVariables = useMutationState({
    filters: { mutationKey: PREDICT_MUTATION_KEY, status: 'pending' },
    select: (m) => m.state.variables as PendingPredictVariables | undefined,
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
              <div className="md:col-span-8 bg-card rounded-3xl border border-border p-8 flex flex-col justify-between relative overflow-hidden group">
                <div className="z-10 relative">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-primary text-xs font-serif font-bold uppercase tracking-widest">
                          Primary Prediction
                        </p>
                        <PredictExportButton
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
                        <PredictRecommendationBadge
                          recommendation={result.recommendation}
                        />
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1">
                        Current Price
                      </p>
                      <p className="text-lg md:text-xl lg:text-2xl font-mono text-foreground">
                        {result.currentPrice}
                      </p>
                    </div>
                  </div>

                  <PredictGrid predictions={result.predictions} />
                </div>

                <PredictChartSvg />
              </div>

              <PredictScenarioCard
                type="bull"
                title="Strong Bull Case"
                icon={<TrendingUp className="w-4 h-4" />}
                content={result.bullCase}
              />
              <PredictScenarioCard
                type="bear"
                title="Hard Bear Case"
                icon={<TrendingDown className="w-4 h-4" />}
                content={result.bearCase}
              />

              <PredictLogicInsights
                summary={result.oneLineSummary}
                rationale={result.rationale}
              />
            </div>
          </motion.div>
        ) : isPredicting ? (
          <PredictLoadingState stockName={stockName} />
        ) : (
          <PredictEmptyState />
        )}
      </AnimatePresence>
    </div>
  );
}
