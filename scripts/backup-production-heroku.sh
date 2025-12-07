#!/bin/bash

# Herokuの公式バックアップ機能を使用した本番環境フルバックアップ
# PostgreSQLバージョン不一致の問題を回避

set -e

echo "🔒 本番環境のフルバックアップを開始します（Heroku公式バックアップ機能使用）..."
echo "⚠️  このスクリプトはHerokuの公式バックアップ機能を使用します"
echo ""

# バックアップディレクトリ
BACKUP_DIR="./production_data_backup"
mkdir -p "$BACKUP_DIR"

# タイムスタンプ
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Herokuアプリ名
HEROKU_APP="hr-system-2025"

echo "📱 Herokuアプリ: $HEROKU_APP"
echo ""

# 1. Herokuの公式バックアップを作成
echo "🎯 Heroku Postgresの公式バックアップを作成中..."
heroku pg:backups:capture --app "$HEROKU_APP"

if [ $? -ne 0 ]; then
    echo "❌ Heroku公式バックアップの作成に失敗しました"
    exit 1
fi

echo "✅ Heroku公式バックアップ作成完了"
echo ""

# 2. バックアップの情報を表示
echo "📋 最新のバックアップ情報:"
heroku pg:backups:info --app "$HEROKU_APP"
echo ""

# 3. バックアップをダウンロード
BACKUP_FILE="$BACKUP_DIR/production-heroku-backup-${TIMESTAMP}.dump"
echo "📥 バックアップをダウンロード中..."
echo "   保存先: $BACKUP_FILE"

# バックアップのURLを取得
BACKUP_URL=$(heroku pg:backups:url --app "$HEROKU_APP")

if [ -z "$BACKUP_URL" ]; then
    echo "❌ バックアップURLの取得に失敗しました"
    exit 1
fi

# curlでダウンロード
curl -o "$BACKUP_FILE" "$BACKUP_URL"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ バックアップのダウンロード完了（サイズ: $BACKUP_SIZE）"
else
    echo "❌ バックアップのダウンロードに失敗しました"
    exit 1
fi

# 4. バックアップ情報の記録
INFO_FILE="$BACKUP_DIR/backup-info-${TIMESTAMP}.txt"
echo ""
echo "📝 バックアップ情報を記録中..."

# Herokuバックアップの詳細情報を取得
BACKUP_INFO=$(heroku pg:backups:info --app "$HEROKU_APP" 2>&1)

cat > "$INFO_FILE" << EOF
=====================================
本番環境フルバックアップ情報
=====================================

バックアップ日時: $(date '+%Y年%m月%d日 %H時%M分%S秒')
Herokuアプリ: $HEROKU_APP
バックアップ方式: Heroku公式バックアップ（pg_dump version 17対応）

【作成されたファイル】
1. Heroku公式バックアップ（PostgreSQL dump形式）
   ファイル名: $(basename "$BACKUP_FILE")
   サイズ: $(du -h "$BACKUP_FILE" | cut -f1)
   フォーマット: PostgreSQL custom format

【Herokuバックアップ詳細】
$BACKUP_INFO

【復元方法】

方法1: Heroku公式バックアップから直接復元（推奨）
  heroku pg:backups:restore --app $HEROKU_APP

方法2: ダウンロードしたファイルから復元
  # ローカルPostgreSQLに復元（PostgreSQL 17が必要）
  pg_restore --verbose --clean --no-acl --no-owner -d \$DATABASE_URL $BACKUP_FILE
  
  # またはHerokuにアップロードして復元
  heroku pg:backups:restore '$BACKUP_FILE' DATABASE_URL --app $HEROKU_APP

方法3: 復元スクリプトを使用
  ./scripts/restore-production-from-heroku-backup.sh $BACKUP_FILE

【Heroku上のバックアップ一覧を確認】
  heroku pg:backups --app $HEROKU_APP

【注意事項】
- このバックアップはPostgreSQL custom format形式です
- 復元にはpg_restoreコマンドを使用します（pg_dumpではありません）
- ローカルで復元する場合はPostgreSQL 17が必要です
- Heroku上では直接復元できます（バージョン不一致の心配なし）
- Herokuは最新の10個のバックアップを自動保持します

【エラーが発生した場合】
このファイルと以下の情報を提供してください：
- タイムスタンプ: ${TIMESTAMP}
- バックアップファイル: $(basename "$BACKUP_FILE")
- エラー内容とスクリーンショット

=====================================
EOF

echo "✅ バックアップ情報を記録しました: $INFO_FILE"

# 5. バックアップファイルの検証
echo ""
echo "🔍 バックアップファイルの検証中..."
if [ -s "$BACKUP_FILE" ]; then
    FILE_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
    if [ "$FILE_SIZE" -gt 1000 ]; then
        echo "✅ バックアップファイルは正常です（サイズ: $(du -h "$BACKUP_FILE" | cut -f1)）"
    else
        echo "⚠️  バックアップファイルが小さすぎる可能性があります（サイズ: $FILE_SIZE バイト）"
    fi
else
    echo "❌ バックアップファイルが空です！"
    exit 1
fi

# 6. Heroku上のバックアップ一覧を表示
echo ""
echo "📚 Heroku上のバックアップ一覧:"
heroku pg:backups --app "$HEROKU_APP"

# 7. 完了メッセージ
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ すべてのバックアップが完了しました！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 ローカルバックアップファイル:"
ls -lh "$BACKUP_FILE" | awk '{print "   " $9 " (" $5 ")"}'
echo ""
echo "☁️  Heroku上のバックアップ:"
echo "   Herokuは自動的に最新のバックアップを保持しています"
echo "   確認: heroku pg:backups --app $HEROKU_APP"
echo ""
echo "📋 詳細情報: $INFO_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  次のステップ:"
echo "1. マイグレーションを実行する前に、このバックアップを安全な場所に保管してください"
echo "2. エラーが発生した場合は、以下の情報を伝えてください:"
echo "   - タイムスタンプ: ${TIMESTAMP}"
echo "   - バックアップファイル: $(basename "$BACKUP_FILE")"
echo "   - 詳細情報ファイル: $(basename "$INFO_FILE")"
echo ""
echo "3. 復元が必要な場合は、以下のコマンドを実行:"
echo "   heroku pg:backups:restore --app $HEROKU_APP"
echo ""
echo "🎉 バックアップが正常に完了しました！"











