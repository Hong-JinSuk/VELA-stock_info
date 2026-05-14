'use client';

import { motion } from 'motion/react';

const CHART_DOTS = [
  [30, 140],
  [60, 150],
  [90, 110],
  [120, 100],
  [150, 70],
  [180, 50],
] as const;

// 메인 결과 카드 우측에 깔리는 장식용 추상 차트 SVG. 상승 라인과 데이터 포인트가 순차적으로 그려진다.
export default function PredictChartSvg() {
  return (
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
        {CHART_DOTS.map(([x, y], i) => (
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
  );
}
