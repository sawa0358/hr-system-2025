#!/bin/bash

# 本番環境のPostgreSQLスキーマをpg_dumpでバックアップ

set -e

echo "📊 本番環境のPostgreSQLスキーマをバックアップします..."

# バックアップディレクトリ
BACKUP_DIR="./prisma/schema-backups"
mkdir -p "$BACKUP_DIR"

# タイムスタンプ
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/schema.production.${TIMESTAMP}.sql"

# HerokuからデータベースURLを取得
echo "🔄 HerokuからデータベースURLを取得中..."
DB_URL=$(heroku config:get DATABASE_URL --app hr-system-2025)

if [ -z "$DB_URL" ]; then
    echo "❌ データベースURLの取得に失敗しました"
    exit 1
fi

echo "📥 スキーマのみをダンプ中..."
# スキーマのみをダンプ（データは含めない）
pg_dump "$DB_URL" --schema-only --no-owner --no-acl > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ バックアップが完了しました！"
    echo "📁 保存先: $BACKUP_FILE"
    
    # ファイルサイズを表示
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📊 ファイルサイズ: $FILE_SIZE"
else
    echo "❌ バックアップに失敗しました"
    exit 1
fi

