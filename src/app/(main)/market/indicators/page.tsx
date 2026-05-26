'use client';

import { MacroCard } from '@/components/common/macro-card';
import { useMacroIndicators } from '@/lib/services/stock/use-macro-indicators';

export default function Page() {
  const { data: macroIndicators } = useMacroIndicators();
  return (
    <main className="size-full overflow-y-auto no-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {macroIndicators?.map((indicator) => (
          <MacroCard key={indicator.indicatorId} indicator={indicator} />
        ))}
      </div>
    </main>
  );
}
