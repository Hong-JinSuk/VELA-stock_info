-- 커뮤니티 탭(부모) + 사용 후기(자식) 메뉴 시드. menu-seed.ts와 동일 구조.
-- 읽기 공개라 minRole='GUEST'. 멱등(ON CONFLICT key DO NOTHING) — 재적용/중복 안전.

-- 대분류: 커뮤니티 (group-my 다음, sortOrder 5)
INSERT INTO "Menu" ("id","key","parentId","title","path","icon","type","disabled","minRole","hidden","sortOrder","updatedAt") VALUES
  (gen_random_uuid()::text, 'group-community', NULL, '커뮤니티', '/community', 'globe', 'FOLDER', false, 'GUEST', false, 5, now())
ON CONFLICT ("key") DO NOTHING;

-- 하위: 사용 후기
INSERT INTO "Menu" ("id","key","parentId","title","path","type","disabled","minRole","hidden","sortOrder","updatedAt") VALUES
  (gen_random_uuid()::text, 'community-reviews', (SELECT id FROM "Menu" WHERE key='group-community'), '사용 후기', '/community/reviews', 'LINK', false, 'GUEST', false, 0, now())
ON CONFLICT ("key") DO NOTHING;
