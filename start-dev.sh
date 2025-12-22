#!/bin/bash

# 開発サーバー起動スクリプト
# 環境変数を設定してNext.js開発サーバーを起動

# スクリプトが配置されているディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 絶対パスでデータベースを指定
export DATABASE_URL="file:${SCRIPT_DIR}/prisma/dev.db"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="dev-secret-key-for-local-development"

echo "🚀 開発サーバーを起動しています..."
echo "📊 データベース: $DATABASE_URL"
echo "🌐 URL: $NEXTAUTH_URL"

npm run dev
