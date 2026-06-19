-- 적정주가 수동 조정 성장률(시트 "평균성장률 조정"). NULL이면 자동성장률 사용.
ALTER TABLE "StockValuation" ADD COLUMN "growthOverride" DOUBLE PRECISION;
