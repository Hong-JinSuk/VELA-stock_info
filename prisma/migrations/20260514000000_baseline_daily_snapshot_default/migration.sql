-- Baseline migration: DailySnapshot.id default가 Supabase에서 수동으로 추가되어
-- migration history와 실제 DB가 불일치한 상태를 정렬한다.
-- 실제 DB에는 이미 default가 적용되어 있으므로 `migrate resolve --applied`로 표시만 한다.

ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
