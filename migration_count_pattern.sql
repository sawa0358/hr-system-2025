-- WorkClockWorkerテーブルに回数パターンフィールドを追加
ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countPatternLabelA" TEXT DEFAULT '回数Aパターン';
ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countPatternLabelB" TEXT DEFAULT '回数Bパターン';
ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countPatternLabelC" TEXT DEFAULT '回数Cパターン';
ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countRateA" DOUBLE PRECISION;
ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countRateB" DOUBLE PRECISION;
ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countRateC" DOUBLE PRECISION;

-- WorkClockTimeEntryテーブルに回数情報フィールドを追加
ALTER TABLE workclock_time_entries ADD COLUMN IF NOT EXISTS "countPattern" TEXT;
ALTER TABLE workclock_time_entries ADD COLUMN IF NOT EXISTS "count" INTEGER;

-- wagePatternをNULL許可に変更（既存データはそのまま）
ALTER TABLE workclock_time_entries ALTER COLUMN "wagePattern" DROP NOT NULL;
