#!/bin/bash

# HR System v1.9.3 定期バックアップ設定スクリプト
# 
# 使用方法:
# chmod +x scripts/setup-cron-backup.sh
# ./scripts/setup-cron-backup.sh

echo "🔄 HR System v1.9.3 定期バックアップ設定を開始します..."

# プロジェクトのルートディレクトリを取得
PROJECT_ROOT=$(pwd)
BACKUP_SCRIPT="$PROJECT_ROOT/scripts/auto-backup.js"

# バックアップスクリプトが存在するか確認
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ バックアップスクリプトが見つかりません: $BACKUP_SCRIPT"
    exit 1
fi

# バックアップスクリプトを実行可能にする
chmod +x "$BACKUP_SCRIPT"

echo "📋 定期バックアップの設定オプション:"
echo "1. 毎日午前2時にバックアップ"
echo "2. 毎日午前2時と午後2時にバックアップ"
echo "3. 毎時バックアップ（開発用）"
echo "4. カスタム設定"
echo "5. 既存のcronジョブを削除"

read -p "選択してください (1-5): " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="毎日午前2時"
        ;;
    2)
        CRON_SCHEDULE="0 2,14 * * *"
        DESCRIPTION="毎日午前2時と午後2時"
        ;;
    3)
        CRON_SCHEDULE="0 * * * *"
        DESCRIPTION="毎時"
        ;;
    4)
        echo "cronスケジュールを入力してください（例: 0 2 * * *）:"
        read -p "スケジュール: " CRON_SCHEDULE
        DESCRIPTION="カスタム設定"
        ;;
    5)
        echo "🗑️  既存のHR Systemバックアップcronジョブを削除します..."
        (crontab -l 2>/dev/null | grep -v "HR System backup" | grep -v "$BACKUP_SCRIPT") | crontab -
        echo "✅ 既存のcronジョブを削除しました"
        exit 0
        ;;
    *)
        echo "❌ 無効な選択です"
        exit 1
        ;;
esac

# 新しいcronジョブを追加
echo "📝 新しいcronジョブを追加します..."
echo "スケジュール: $CRON_SCHEDULE ($DESCRIPTION)"
echo "スクリプト: $BACKUP_SCRIPT"

# 既存のcronジョブを取得
(crontab -l 2>/dev/null | grep -v "HR System backup" | grep -v "$BACKUP_SCRIPT"; echo "$CRON_SCHEDULE cd $PROJECT_ROOT && node $BACKUP_SCRIPT >> logs/backup.log 2>&1 # HR System backup") | crontab -

# ログディレクトリを作成
mkdir -p "$PROJECT_ROOT/logs"

echo "✅ cronジョブを設定しました！"
echo ""
echo "📋 設定内容:"
echo "  - スケジュール: $CRON_SCHEDULE"
echo "  - 説明: $DESCRIPTION"
echo "  - スクリプト: $BACKUP_SCRIPT"
echo "  - ログファイル: $PROJECT_ROOT/logs/backup.log"
echo ""
echo "🔍 現在のcronジョブを確認:"
crontab -l | grep "HR System"
echo ""
echo "📝 ログを確認するには:"
echo "  tail -f $PROJECT_ROOT/logs/backup.log"
echo ""
echo "🗑️  cronジョブを削除するには:"
echo "  ./scripts/setup-cron-backup.sh"
echo "  選択肢5を選択"

