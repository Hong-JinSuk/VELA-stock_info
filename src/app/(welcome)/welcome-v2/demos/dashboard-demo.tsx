'use client';

import { MacroCard } from '@/components/common/macro-card';
import { SAMPLE_INDICATORS } from './sample-data';

// 대시보드 데모 — 실제 MacroCard를 큐레이션 샘플 지표로 재현.
export default function DashboardDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {SAMPLE_INDICATORS.map((indicator) => (
        <MacroCard key={indicator.indicatorId} indicator={indicator} />
      ))}
    </div>
  );
}
