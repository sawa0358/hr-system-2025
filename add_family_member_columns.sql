-- 家族構成テーブルに不足しているカラムを追加するSQL
-- 本番環境（PostgreSQL）用

-- phoneカラムを追加
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS phone VARCHAR(255);

-- livingSeparatelyカラムを追加
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS livingSeparately BOOLEAN DEFAULT false;

-- addressカラムを追加
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS address TEXT;

-- myNumberカラムを追加
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS myNumber VARCHAR(255);