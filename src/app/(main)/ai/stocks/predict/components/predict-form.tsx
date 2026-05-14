'use client';

import { usePredictMutation } from '@/lib/services/stock/use-predict-mutation';
import { cn } from '@/lib/utils';
import { agentStatusAtom, aiPredictFormAtom } from '@/store/ai-atom';
import { useAtom, useAtomValue } from 'jotai';
import {
  AlertCircle,
  BarChart3,
  Loader2,
  Target,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useSession } from 'next-auth/react';
import { useRef } from 'react';
import PredictSystemNotice from './predict-form/predict-system-notice';

// 종목명/추가 컨텍스트 입력을 받아 AI 예측 mutation을 트리거한다. 진행 중에는 취소 버튼으로 전환되며, 사용 만료/미로그인 시 입력을 차단한다.
export default function PredictionForm() {
  const [aiForm, setAiForm] = useAtom(aiPredictFormAtom);
  const { stockName, stockData } = aiForm;
  const { data: user } = useSession();
  const agentStatus = useAtomValue(agentStatusAtom);
  const { predictMutation } = usePredictMutation();
  const abortControllerRef = useRef<AbortController | null>(null);

  const loading = predictMutation.isPending;
  const isExpired = agentStatus === '사용 만료';
  const isSubmitDisabled = !stockName.trim() || !user || isExpired;

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
    <div className="flex flex-col gap-4 h-full min-h-[600px] overflow-hidden">
      <div className="bg-card rounded-3xl border border-border p-6 flex flex-col flex-1 min-h-0 shrink-0">
        <div className="flex items-center gap-2 mb-6 shrink-0">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            주요 예측 설정
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
              대상 종목
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

          {/* Textarea가 남는 공간(flex-1)을 차지하도록 min-h-0 유지 */}
          <div className="flex-1 flex flex-col min-h-40">
            <div className="flex justify-between items-end mb-2 shrink-0">
              <label
                htmlFor="stockData"
                className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                추가 사용자 데이터
              </label>
            </div>
            <textarea
              id="stockData"
              value={stockData}
              onChange={(e) =>
                setAiForm((prev) => ({ ...prev, stockData: e.target.value }))
              }
              placeholder="개인적으로 추가하실 분석, 최신 뉴스 요약 등 참고할 데이터를 입력해주세요..."
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
                분석 취소
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all',
                  isSubmitDisabled
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(52,211,153,0.4)]',
                )}
              >
                <Target className="w-4 h-4" />
                분석 요청하기
              </button>
            )}
          </div>
        </form>
      </div>

      <PredictSystemNotice />
    </div>
  );
}
