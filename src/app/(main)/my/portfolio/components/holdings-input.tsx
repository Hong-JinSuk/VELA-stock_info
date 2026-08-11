'use client';

import { StockPicker } from '@/components/common/stock-picker';
import { Input } from '@/components/ui/input';
import {
  ASSET_CLASSES,
  ASSET_CLASS_META,
  NON_STOCK_CLASSES,
  type AssetClass,
  type NonStockAssetClass,
} from '@/constants/asset-classes';
import {
  CURRENCY_SYMBOL,
  PORTFOLIO_CURRENCIES,
} from '@/constants/portfolio-currency';
import { customTargetSum } from '@/lib/portfolio/diagnose';
import { cn } from '@/lib/utils';
import { portfolioCurrencyAtom } from '@/store/portfolio-atom';
import type { Holdings, StockHolding } from '@/types/portfolio';
import { useAtom } from 'jotai';
import { X } from 'lucide-react';

// 보유 자산 입력 — 주식(종목별) + 나머지 자산군(금액). CUSTOM 템플릿이면 목표 비중도 여기서 입력.
// 목표 배분(target)에 없는(0%) 자산군은 입력란을 숨긴다(예: 주식 100% → 주식만).
export default function HoldingsInput({
  holdings,
  setHoldings,
  isCustom,
  customTarget,
  setCustomTarget,
  target,
}: {
  holdings: Holdings;
  setHoldings: (updater: (prev: Holdings) => Holdings) => void;
  isCustom: boolean;
  customTarget: Record<AssetClass, number>;
  setCustomTarget: (updater: (prev: Record<AssetClass, number>) => Record<AssetClass, number>) => void;
  target: Record<AssetClass, number>;
}) {
  // 목표 비중 > 0 인 자산군만 입력받는다. CUSTOM은 위 에디터에서 정한 비중을 따른다.
  // 단, 목표가 0%라도 이미 입력된 금액이 있으면 계속 보여준다 — diagnose()는 목표와 무관하게
  // 모든 금액을 합산하므로, 숨기면 "과다배분"으로 잡히는데 지울 수단이 없어진다.
  // (진단 결과 행 필터 targetPct > 0 || actualAmount > 0 과 같은 규칙.)
  const showStock =
    (target.STOCK ?? 0) > 0 || holdings.stocks.length > 0;
  const visibleNonStock = NON_STOCK_CLASSES.filter(
    (c) => (target[c] ?? 0) > 0 || holdings.amounts[c] > 0,
  );

  // 입력 단위(통화) — 진단 값엔 영향 없고 "1이 얼마인지" 명확히 하려는 것.
  const [currency, setCurrency] = useAtom(portfolioCurrencyAtom);
  const currencySymbol = CURRENCY_SYMBOL[currency];
  const addStock = (symbol: string, name?: string) => {
    setHoldings((prev) => {
      if (prev.stocks.some((s) => s.symbol === symbol)) return prev; // 중복 방지
      const row: StockHolding = {
        id: crypto.randomUUID(),
        symbol,
        name,
        amount: 0,
      };
      return { ...prev, stocks: [...prev.stocks, row] };
    });
  };

  const setStockAmount = (id: string, amount: number) => {
    setHoldings((prev) => ({
      ...prev,
      stocks: prev.stocks.map((s) => (s.id === id ? { ...s, amount } : s)),
    }));
  };

  const removeStock = (id: string) => {
    setHoldings((prev) => ({
      ...prev,
      stocks: prev.stocks.filter((s) => s.id !== id),
    }));
  };

  const setAmount = (cls: NonStockAssetClass, amount: number) => {
    setHoldings((prev) => ({
      ...prev,
      amounts: { ...prev.amounts, [cls]: amount },
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 입력 단위 선택 (₩/$). 모든 칸을 같은 통화로 입력. */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">입력 단위</span>
        <div className="inline-flex rounded-lg border border-border bg-card/40 p-0.5">
          {PORTFOLIO_CURRENCIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCurrency(c.id)}
              aria-pressed={currency === c.id}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                currency === c.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {c.symbol} {c.label}
            </button>
          ))}
        </div>
      </div>

      {isCustom && (
        <CustomTargetEditor target={customTarget} setTarget={setCustomTarget} />
      )}

      {/* 주식 — 목표에 주식이 있을 때만 */}
      {showStock && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${ASSET_CLASS_META.STOCK.bar}`} />
            <h3 className="text-sm font-semibold text-foreground">주식</h3>
            <span className="text-xs text-muted-foreground">종목별 평가금액</span>
          </div>

          <StockPicker onPick={(s) => addStock(s.symbol, s.name)} />

          {holdings.stocks.length > 0 && (
            <ul className="flex flex-col gap-2">
              {holdings.stocks.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                    <span className="font-mono text-sm font-medium">
                      {s.symbol}
                    </span>
                    {s.name && (
                      <span className="truncate text-xs text-muted-foreground">
                        {s.name}
                      </span>
                    )}
                  </div>
                  <AmountInput
                    value={s.amount}
                    onChange={(v) => setStockAmount(s.id, v)}
                    placeholder="평가금액"
                    symbol={currencySymbol}
                  />
                  <button
                    type="button"
                    onClick={() => removeStock(s.id)}
                    aria-label={`${s.symbol} 제거`}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 나머지 자산군 — 목표에 있는 것만 */}
      {visibleNonStock.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">그 외 자산</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleNonStock.map((c) => (
              <div key={c} className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className={`size-2.5 shrink-0 rounded-full ${ASSET_CLASS_META[c].bar}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      {ASSET_CLASS_META[c].label}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground/60">
                      {ASSET_CLASS_META[c].hint}
                    </p>
                  </div>
                </div>
                <AmountInput
                  value={holdings.amounts[c]}
                  onChange={(v) => setAmount(c, v)}
                  placeholder="보유 금액"
                  symbol={currencySymbol}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CUSTOM인데 아직 목표 비중을 안 정한 경우 안내 */}
      {isCustom && !showStock && visibleNonStock.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground break-keep">
          위에서 목표 비중을 정하면 해당 자산의 입력란이 나타나요.
        </p>
      )}

      {(showStock || visibleNonStock.length > 0) && (
        <p className="text-[11px] text-muted-foreground/60 break-keep">
          모든 자산을 같은 단위({currencySymbol})로 입력하세요. 진단은 절대금액이 아니라
          자산군 간 상대 비중으로 계산되므로, 통화를 섞지만 않으면 됩니다.
        </p>
      )}
    </div>
  );
}

// CUSTOM 템플릿: 자산군별 목표 비중(%) 직접 입력 + 합계 검증.
function CustomTargetEditor({
  target,
  setTarget,
}: {
  target: Record<AssetClass, number>;
  setTarget: (updater: (prev: Record<AssetClass, number>) => Record<AssetClass, number>) => void;
}) {
  const sum = customTargetSum(target);
  const valid = sum === 100;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          목표 비중 직접 입력
        </h3>
        <span
          className={`text-xs tabular-nums ${valid ? 'text-emerald-500' : 'text-amber-500'}`}
        >
          합계 {sum}% {valid ? '✓' : '(100% 필요)'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ASSET_CLASSES.map((c) => (
          <div key={c} className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-2 rounded-full ${ASSET_CLASS_META[c].bar}`} />
              {ASSET_CLASS_META[c].label}
            </label>
            <div className="relative">
              <Input
                inputMode="numeric"
                value={target[c] ? String(target[c]) : ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '');
                  const n = digits ? Math.min(100, Number(digits)) : 0;
                  setTarget((prev) => ({ ...prev, [c]: n }));
                }}
                placeholder="예: 60"
                className="h-9 pr-6 text-right text-sm tabular-nums"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// 금액 입력 (천단위 콤마 표시, 숫자만 파싱). 통화 기호를 앞에 붙여 단위를 명확히.
function AmountInput({
  value,
  onChange,
  placeholder = '금액',
  symbol,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  symbol: string;
}) {
  return (
    <div className="relative w-32 shrink-0">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        {symbol}
      </span>
      <Input
        inputMode="numeric"
        value={value ? value.toLocaleString() : ''}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, '');
          onChange(digits ? Number(digits) : 0);
        }}
        placeholder={placeholder}
        className="h-9 w-full pl-6 text-right text-sm tabular-nums"
      />
    </div>
  );
}
