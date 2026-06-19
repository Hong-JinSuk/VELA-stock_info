-- 메뉴 경로 명확화 리네임: /overview→/dashboard, /market→/market-data, /analysis→/data-analysis, /ai/stocks→/ai-analysis/stocks
-- (페이지 라우트 폴더 rename에 맞춤. 메뉴 key는 그대로라 라우트 가드/권한 영향 없음. /my 는 유지.)
UPDATE "Menu" SET "path" = '/dashboard'                 WHERE "key" = 'dashboard';

UPDATE "Menu" SET "path" = '/market-data'               WHERE "key" = 'group-market';
UPDATE "Menu" SET "path" = '/market-data/indicators'    WHERE "key" = 'market-indicators';
UPDATE "Menu" SET "path" = '/market-data/sectors'       WHERE "key" = 'market-sectors';
UPDATE "Menu" SET "path" = '/market-data/13f'           WHERE "key" = 'market-13f';
UPDATE "Menu" SET "path" = '/market-data/stocks'        WHERE "key" = 'market-stocks';

UPDATE "Menu" SET "path" = '/data-analysis'             WHERE "key" = 'group-analysis';
UPDATE "Menu" SET "path" = '/data-analysis/sectors'     WHERE "key" = 'analysis-sectors';

UPDATE "Menu" SET "path" = '/ai-analysis/stocks'           WHERE "key" = 'group-ai';
UPDATE "Menu" SET "path" = '/ai-analysis/stocks/predict'   WHERE "key" = 'ai-predict';
UPDATE "Menu" SET "path" = '/ai-analysis/stocks/valuation' WHERE "key" = 'ai-valuation';
UPDATE "Menu" SET "path" = '/ai-analysis/stocks/compare'   WHERE "key" = 'ai-compare';
