'use client';

import { motion } from 'motion/react';

const CANDLES = [
  { x: 11, delay: 0 },
  { x: 18, delay: 0.25 },
  { x: 25, delay: 0.5 },
  { x: 32, delay: 0.75 },
  { x: 39, delay: 1.0 },
];

// 아직 예측을 시작하지 않았을 때 노출되는 안내 카드. layoutId로 로딩 상태와 차트 프레임이 연결된다.
export default function PredictEmptyState() {
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
            {CANDLES.map(({ x, delay }) => (
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
      <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-wide">
        AI 분석 대기 중
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">
        왼쪽에 종목명과 시장 데이터를 입력하면 AI가 예측을 시작합니다.
      </p>
    </motion.div>
  );
}
