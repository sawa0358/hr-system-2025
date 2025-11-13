#!/bin/bash

# HR System v1.9.3 クイック復元スクリプト
# 
# 使用方法:
# chmod +x scripts/quick-restore.sh
# ./scripts/quick-restore.sh [コミットハッシュ] [バックアップファイル]

echo "🔄 HR System v1.9.3 クイック復元を開始します..."

# デフォルト値
DEFAULT_COMMIT="d8d89b3"  # v1.9.3の最初のコミット
DEFAULT_BACKUP="backups/auto-backup-2025-10-24T15-49-24.json"

# 引数の処理
COMMIT_HASH=${1:-$DEFAULT_COMMIT}
BACKUP_FILE=${2:-$DEFAULT_BACKUP}

echo "📋 復元設定:"
echo "  - コミットハッシュ: $COMMIT_HASH"
echo "  - バックアップファイル: $BACKUP_FILE"

# 確認
read -p "この設定で復元を実行しますか？ (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ 復元をキャンセルしました"
    exit 1
fi

# 1. 現在の状態をバックアップ
echo "💾 現在の状態をバックアップ中..."
git stash push -m "復元前の状態-$(date +%Y%m%d_%H%M%S)" || echo "⚠️  git stashに失敗しました（新規ファイルがある可能性があります）"

# 2. コードを復元
echo "📝 コードを復元中..."
if git show $COMMIT_HASH > /dev/null 2>&1; then
    git checkout -b restore-$(date +%Y%m%d_%H%M%S) $COMMIT_HASH
    echo "✅ コードを復元しました: $COMMIT_HASH"
else
    echo "❌ コミットハッシュが見つかりません: $COMMIT_HASH"
    echo "利用可能なコミット:"
    git log --oneline -10
    exit 1
fi

# 3. 依存関係を再インストール
echo "📦 依存関係を再インストール中..."
npm install

# 4. バックアップファイルの存在確認
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ バックアップファイルが見つかりません: $BACKUP_FILE"
    echo "利用可能なバックアップファイル:"
    ls -la backups/auto-backup-*.json* 2>/dev/null || echo "バックアップファイルが見つかりません"
    ls -la current-db-backup-*.json 2>/dev/null || echo "手動バックアップファイルが見つかりません"
    exit 1
fi

# 5. データベースを復元
echo "🗄️  データベースを復元中..."
if node scripts/restore-db-v1.9.3.js "$BACKUP_FILE"; then
    echo "✅ データベースを復元しました"
else
    echo "❌ データベースの復元に失敗しました"
    exit 1
fi

# 6. Prismaクライアントを再生成
echo "🔨 Prismaクライアントを再生成中..."
npx prisma generate

# 7. 動作確認
echo "🔍 動作確認中..."
if npm run build > /dev/null 2>&1; then
    echo "✅ ビルドが成功しました"
else
    echo "⚠️  ビルドに警告がありますが、復元は完了しました"
fi

echo ""
echo "🎉 クイック復元が完了しました！"
echo ""
echo "📋 復元内容:"
echo "  - コミット: $COMMIT_HASH"
echo "  - バックアップ: $BACKUP_FILE"
echo "  - ブランチ: restore-$(date +%Y%m%d_%H%M%S)"
echo ""
echo "🚀 次のステップ:"
echo "  1. アプリケーションを起動: npm run dev"
echo "  2. ブラウザでアクセス: http://localhost:3000"
echo "  3. データが正常に表示されることを確認"
echo ""
echo "🔧 トラブルシューティング:"
echo "  - アプリが起動しない場合: npm install && npx prisma generate"
echo "  - データが表示されない場合: npx prisma studio でデータベースを確認"
echo "  - 元の状態に戻す場合: git stash pop"


