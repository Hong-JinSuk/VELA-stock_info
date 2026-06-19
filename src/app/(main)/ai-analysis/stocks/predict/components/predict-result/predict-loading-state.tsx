'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

const LOADING_PHASES = [
  '시장 데이터 수집 중...',
  'AI 분석 모델 실행 중...',
  '예측 결과 생성 중...',
];
const LOADING_PHASE_INTERVAL_MS = 3000;

const CANDLES = [
  { x: 9, delay: 0 },
  { x: 16, delay: 0.15 },
  { x: 23, delay: 0.3 },
  { x: 30, delay: 0.45 },
  { x: 37, delay: 0.6 },
];

const ORBIT_ANGLES = [0, 120, 240];

interface PredictLoadingStateProps {
  stockName?: string;
}

// 예측 분석 진행 중에 표시되는 로딩 상태. 회전 링/캔들 차트 애니메이션과 3단계 진행 문구를 순환 노출한다.
export default function PredictLoadingState({
  stockName,
}: PredictLoadingStateProps) {
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIdx((i) => (i + 1) % LOADING_PHASES.length);
    }, LOADING_PHASE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

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
        <motion.div
          className="absolute inset-0 border-2 border-dashed border-primary/40 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 border border-primary/30 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-3 rounded-full bg-primary/10"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {ORBIT_ANGLES.map((angle) => (
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
            {CANDLES.map(({ x, delay }) => (
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
