#!/bin/bash

# 開発サーバー起動スクリプト
# 環境変数を設定してNext.js開発サーバーを起動

export DATABASE_URL="file:./prisma/dev.db"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="dev-secret-key-for-local-development"

echo "🚀 開発サーバーを起動しています..."
echo "📊 データベース: $DATABASE_URL"
echo "🌐 URL: $NEXTAUTH_URL"

npm run dev
