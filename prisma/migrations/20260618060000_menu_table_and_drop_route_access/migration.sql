-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT,
    "badge" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "minRole" TEXT NOT NULL DEFAULT 'FREE',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Menu_key_key" ON "Menu"("key");

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: 기존 하드코딩 사이드바(nav-data.ts)와 동일한 트리로 초기 데이터 삽입.
-- 대분류(parentId NULL)
INSERT INTO "Menu" ("id","key","parentId","title","path","icon","disabled","minRole","hidden","sortOrder","updatedAt") VALUES
  (gen_random_uuid()::text, 'dashboard',      NULL, '대시보드',   '/overview',  'dashboard', false, 'FREE', false, 0, now()),
  (gen_random_uuid()::text, 'group-market',   NULL, '시장 데이터', '/market',    'market',    false, 'FREE', false, 1, now()),
  (gen_random_uuid()::text, 'group-analysis', NULL, '데이터 분석', '/analysis',  'analysis',  false, 'FREE', false, 2, now()),
  (gen_random_uuid()::text, 'group-ai',       NULL, 'AI 분석',    '/ai/stocks', 'ai',        false, 'FREE', false, 3, now()),
  (gen_random_uuid()::text, 'group-my',       NULL, '마이페이지',  '/my',        'my',        false, 'FREE', false, 4, now());

-- 하위 메뉴 (부모 key로 parentId 참조)
INSERT INTO "Menu" ("id","key","parentId","title","path","disabled","minRole","hidden","sortOrder","updatedAt") VALUES
  (gen_random_uuid()::text, 'market-indicators', (SELECT id FROM "Menu" WHERE key='group-market'),   '경제 지표',   '/market/indicators', false, 'FREE', false, 0, now()),
  (gen_random_uuid()::text, 'market-sectors',    (SELECT id FROM "Menu" WHERE key='group-market'),   '섹터 지표',   '/market/sectors',    false, 'FREE', false, 1, now()),
  (gen_random_uuid()::text, 'market-13f',        (SELECT id FROM "Menu" WHERE key='group-market'),   '13F',        '/market/13f',        false, 'FREE', false, 2, now()),
  (gen_random_uuid()::text, 'market-stocks',     (SELECT id FROM "Menu" WHERE key='group-market'),   '종목찾기',    '/market/stocks',     false, 'FREE', false, 3, now()),
  (gen_random_uuid()::text, 'analysis-sectors',  (SELECT id FROM "Menu" WHERE key='group-analysis'), '섹터 분석',   '/analysis/sectors',  false, 'FREE', false, 0, now()),
  (gen_random_uuid()::text, 'ai-predict',        (SELECT id FROM "Menu" WHERE key='group-ai'),       '주가 예측',   '/ai/stocks/predict',   false, 'FREE', false, 0, now()),
  (gen_random_uuid()::text, 'ai-valuation',      (SELECT id FROM "Menu" WHERE key='group-ai'),       '적정 주가 평가', '/ai/stocks/valuation', true,  'FREE', false, 1, now()),
  (gen_random_uuid()::text, 'ai-compare',        (SELECT id FROM "Menu" WHERE key='group-ai'),       '종목 비교',   '/ai/stocks/compare',   true,  'FREE', false, 2, now()),
  (gen_random_uuid()::text, 'my-favorites',      (SELECT id FROM "Menu" WHERE key='group-my'),       '즐겨찾기',    '/my/favorites',      false, 'FREE', false, 0, now()),
  (gen_random_uuid()::text, 'my-13f-report',     (SELECT id FROM "Menu" WHERE key='group-my'),       '13F 보고서',  '/my/13f-report',     false, 'FREE', false, 1, now()),
  (gen_random_uuid()::text, 'my-stocks-report',  (SELECT id FROM "Menu" WHERE key='group-my'),       '종목 보고서', '/my/stocks-report',  false, 'FREE', false, 2, now()),
  (gen_random_uuid()::text, 'my-ai-logs',        (SELECT id FROM "Menu" WHERE key='group-my'),       'AI 분석 기록', '/my/ai-logs',       true,  'FREE', false, 3, now()),
  (gen_random_uuid()::text, 'my-setting',        (SELECT id FROM "Menu" WHERE key='group-my'),       '환경 설정',   '/my/setting',        true,  'FREE', false, 4, now());

-- 기존 RouteAccess 설정(minRole/hidden) 보존: 같은 key의 Menu에 반영.
UPDATE "Menu" m
SET "minRole" = r."minRole", "hidden" = r."hidden"
FROM "RouteAccess" r
WHERE m."key" = r."routeKey";

-- DropTable
DROP TABLE "RouteAccess";
