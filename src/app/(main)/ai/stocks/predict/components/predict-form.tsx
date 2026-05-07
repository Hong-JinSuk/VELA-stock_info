'use client';

import { usePredictMutation } from '@/lib/services/stock/use-predict-mutation';
import { cn } from '@/lib/utils';
import { agentStatusAtom, aiPredictFormAtom } from '@/store/ai-atom';
import { motion } from 'framer-motion';
import { useAtom, useAtomValue } from 'jotai';
import {
  AlertCircle,
  BarChart3,
  Loader2,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRef } from 'react';

export default function PredictionForm() {
  const [aiForm, setAiForm] = useAtom(aiPredictFormAtom);
  const { stockName, stockData } = aiForm;
  const { data: user } = useSession();
  const agentStatus = useAtomValue(agentStatusAtom);
  const { predictMutation } = usePredictMutation();
  const abortControllerRef = useRef<AbortController | null>(null);

  const loading = predictMutation.isPending;
  const isExpired = agentStatus === '사용 만료';
  const error = isExpired
    ? '이번 달 사용 횟수를 모두 소진했습니다.'
    : predictMutation.error
      ? (predictMutation.error as Error).message
      : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    abortControllerRef.current = new AbortController();
    predictMutation.mutate({
      stockName: aiForm.stockName,
      stockData: aiForm.stockData,
      signal: abortControllerRef.current.signal,
    });
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };

  return (
    <div className="lg:col-span-4 flex flex-col gap-4 lg:h-full min-h-[400px] lg:overflow-hidden">
      <div className="bg-card rounded-3xl border border-border p-6 flex flex-col flex-1 min-h-0 shrink-0">
        <div className="flex items-center gap-2 mb-6 shrink-0">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Primary Prediction Settings
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 flex-1 flex flex-col min-h-0"
        >
          <div className="shrink-0">
            <label
              htmlFor="stockName"
              className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2"
            >
              Target Instrument
            </label>
            <input
              id="stockName"
              type="text"
              value={stockName}
              onChange={(e) =>
                setAiForm((prev) => ({ ...prev, stockName: e.target.value }))
              }
              placeholder="e.g. NVDA, APPLE, 삼성전자"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-foreground font-mono placeholder:text-muted-foreground outline-none"
              disabled={loading}
            />
          </div>

          {/* ✨ Textarea 영역이 남는 공간(flex-1)을 정확히 차지하도록 min-h-0 속성 추가 */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-end mb-2 shrink-0">
              <label
                htmlFor="stockData"
                className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                Additional Context Data (Optional)
              </label>
              <span className="text-[10px] text-muted-foreground font-medium uppercase">
                Raw Input
              </span>
            </div>
            <textarea
              id="stockData"
              value={stockData}
              onChange={(e) =>
                setAiForm((prev) => ({ ...prev, stockData: e.target.value }))
              }
              placeholder="추가 분석, 최신 뉴스 요약 등 참고할 데이터를 입력해주세요..."
              // ✨ h-full 추가 및 min-h 값을 약간 낮춰 창 크기가 작아져도 깨지지 않게 유연하게 조정
              className="w-full h-full min-h-[140px] px-4 py-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground overflow-y-auto resize-none outline-none leading-relaxed"
              disabled={loading}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 shrink-0 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300 font-medium">{error}</p>
            </motion.div>
          )}

          <div className="shrink-0 pt-2">
            {loading ? (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                CANCEL PREDICTION
              </button>
            ) : (
              <button
                type="submit"
                disabled={!stockName.trim() || !user || isExpired}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all',
                  !stockName.trim() || !user || isExpired
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(52,211,153,0.4)]',
                )}
              >
                <Target className="w-4 h-4" />
                Initialize Prediction
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6 flex flex-col justify-center gap-2 shrink-0">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          System Notice
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Prediction model outputs rely on unstructured user inputs via Gemini
          framework. Results are speculative and not intended as financial
          advice.
        </p>
      </div>
    </div>
  );
}
