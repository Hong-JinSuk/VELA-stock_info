-- Supabase Studio에서 AiLog 조회 시 userId 옆에 name/nickname을 함께 보기 위한 view.
-- Prisma client에는 노출되지 않음 (Studio 운영용).
CREATE OR REPLACE VIEW "AiLogWithUser" AS
SELECT
  l.id,
  l."userId",
  u.name        AS "userName",
  u.nickname    AS "userNickname",
  l."actionType",
  l.ticker,
  l."createdAt",
  l."queryData",
  l."refineData",
  l."resultData"
FROM "AiLog" l
LEFT JOIN "User" u ON u.id = l."userId";
