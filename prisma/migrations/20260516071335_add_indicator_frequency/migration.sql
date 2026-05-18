-- 외래로 빠져 들어온 default 동기화 (prisma가 자동 추가)
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- (1) frequency 컬럼을 nullable로 먼저 추가
ALTER TABLE "IndicatorSnapshot" ADD COLUMN "frequency" TEXT;

-- (2) catalog 기반 backfill
-- realtime (Yahoo)
UPDATE "IndicatorSnapshot" SET "frequency" = 'realtime'
WHERE "indicatorId" IN ('vix', 'ust_10y', 'usd_cny', 'wti', 'brent', 'gold', 'copper');

-- daily (FRED daily)
UPDATE "IndicatorSnapshot" SET "frequency" = 'daily'
WHERE "indicatorId" IN (
  'fed_funds', 'ust_2y', 'spread_10y_2y', 'real_yield_10y',
  'breakeven_5y', 'fwd_5y5y', 'reverse_repo',
  'hy_spread', 'ig_spread', 'dollar_index'
);

-- weekly
UPDATE "IndicatorSnapshot" SET "frequency" = 'weekly'
WHERE "indicatorId" IN (
  'initial_claims', 'continuing_claims', 'fed_balance_sheet',
  'nfci', 'mortgage_30y'
);

-- monthly
UPDATE "IndicatorSnapshot" SET "frequency" = 'monthly'
WHERE "indicatorId" IN (
  'cpi_headline', 'cpi_core', 'pce', 'pce_core', 'ppi', 'avg_hourly_wage',
  'nfp', 'unemployment', 'labor_participation', 'jolts',
  'consumer_spending', 'm2', 'cfnai',
  'umich_sentiment', 'retail_sales', 'consumer_credit', 'savings_rate',
  'housing_starts', 'building_permits', 'existing_home_sales', 'case_shiller'
);

-- quarterly
UPDATE "IndicatorSnapshot" SET "frequency" = 'quarterly'
WHERE "indicatorId" IN ('gdp');

-- 혹시 catalog에 없는 indicatorId가 들어 있던 경우의 안전망 (의도된 값 채움)
UPDATE "IndicatorSnapshot" SET "frequency" = 'daily' WHERE "frequency" IS NULL;

-- (3) NOT NULL 전환
ALTER TABLE "IndicatorSnapshot" ALTER COLUMN "frequency" SET NOT NULL;
