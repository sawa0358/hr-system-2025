#!/bin/bash

# Herokuバックアップから本番環境のデータベースを復元するスクリプト
# ⚠️ このスクリプトは慎重に使用してください

set -e

echo "⚠️  本番環境データベース復元スクリプト（Herokuバックアップ使用）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Herokuアプリ名
HEROKU_APP="hr-system-2025"

# 引数があればそれを使用、なければHeroku上の最新バックアップを使用
if [ "$#" -eq 1 ]; then
    BACKUP_FILE="$1"
    USE_LOCAL_FILE=true
    
    # バックアップファイルの存在確認
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ バックアップファイルが見つかりません: $BACKUP_FILE"
        exit 1
    fi
    
    echo "📋 復元情報:"
    echo "   バックアップファイル: $BACKUP_FILE"
    echo "   ファイルサイズ: $(du -h "$BACKUP_FILE" | cut -f1)"
    echo "   作成日時: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$BACKUP_FILE" 2>/dev/null || stat -c "%y" "$BACKUP_FILE" 2>/dev/null)"
else
    USE_LOCAL_FILE=false
    echo "📋 復元情報:"
    echo "   Heroku上の最新バックアップから復元します"
    echo ""
    echo "📚 利用可能なHerokuバックアップ:"
    heroku pg:backups --app "$HEROKU_APP"
fi

echo ""
echo "📱 Herokuアプリ: $HEROKU_APP"
echo ""

# 確認プロンプト
echo "⚠️  警告: この操作は本番環境のデータベースを上書きします！"
echo ""
read -p "本当に復元しますか？ (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "キャンセルしました"
    exit 0
fi

echo ""
read -p "もう一度確認します。本番データベースを復元しますか？ (YES を入力): " CONFIRM2

if [ "$CONFIRM2" != "YES" ]; then
    echo "キャンセルしました"
    exit 0
fi

# 復元前のバックアップを作成
echo ""
echo "🔒 復元前に現在のデータベースをバックアップ中..."
heroku pg:backups:capture --app "$HEROKU_APP"
echo "✅ 復元前バックアップ完了"
echo ""

# データベースの復元
echo "🔄 データベースを復元中..."
echo "   これには数分かかる場合があります..."
echo ""

if [ "$USE_LOCAL_FILE" = true ]; then
    # ローカルファイルから復元
    echo "📁 ローカルファイルから復元します..."
    
    # ファイルをHerokuにアップロードして復元
    # 注意: この方法は大きなファイルには向いていない
    DB_URL=$(heroku config:get DATABASE_URL --app "$HEROKU_APP")
    
    if [ -z "$DB_URL" ]; then
        echo "❌ データベースURLの取得に失敗しました"
        exit 1
    fi
    
    # pg_restoreを使用して復元
    pg_restore --verbose --clean --no-acl --no-owner -d "$DB_URL" "$BACKUP_FILE"
    RESTORE_STATUS=$?
else
    # Heroku上の最新バックアップから復元
    echo "☁️  Heroku上の最新バックアップから復元します..."
    heroku pg:backups:restore --app "$HEROKU_APP" --confirm "$HEROKU_APP"
    RESTORE_STATUS=$?
fi

if [ $RESTORE_STATUS -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ データベースの復元が完了しました！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 復元情報:"
    if [ "$USE_LOCAL_FILE" = true ]; then
        echo "   復元元ファイル: $BACKUP_FILE"
    else
        echo "   復元元: Heroku上の最新バックアップ"
    fi
    echo "   復元日時: $(date '+%Y年%m月%d日 %H時%M分%S秒')"
    echo ""
    echo "⚠️  次のステップ:"
    echo "1. アプリケーションを再起動します..."
    
    heroku restart --app "$HEROKU_APP"
    echo "   ✅ アプリケーションを再起動しました"
    echo ""
    echo "2. アプリケーションの動作確認を行ってください"
    echo "   URL: https://$HEROKU_APP.herokuapp.com"
    echo ""
    echo "3. Herokuバックアップ一覧を確認:"
    echo "   heroku pg:backups --app $HEROKU_APP"
    echo ""
else
    echo ""
    echo "❌ データベースの復元に失敗しました"
    echo ""
    echo "💡 復元をロールバックするには:"
    echo "   heroku pg:backups --app $HEROKU_APP"
    echo "   上記のコマンドで直前のバックアップを確認し、"
    echo "   heroku pg:backups:restore <backup-id> DATABASE_URL --app $HEROKU_APP"
    echo ""
    exit 1
fi








