#!/bin/bash

# HRシステム開発環境セットアップスクリプト

echo "🚀 HRシステム開発環境をセットアップします..."

# 1. 依存関係のインストール
echo "📦 依存関係をインストール中..."
if command -v pnpm &> /dev/null; then
    echo "pnpmを使用します"
    pnpm install
else
    echo "npmを使用します"
    npm install
fi

# 2. 環境変数ファイルの作成
echo "⚙️ 環境変数ファイルを作成中..."
if [ ! -f .env.local ]; then
    cat > .env.local << EOF
# データベース設定
DATABASE_URL="file:./dev.db"

# 認証設定
NEXTAUTH_SECRET="dev-secret-key-$(date +%s)"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3設定（本番環境用）
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="ap-northeast-1"
AWS_S3_BUCKET_NAME=""

# Heroku設定（本番環境用）
HEROKU_APP_NAME=""
EOF
    echo "✅ .env.localファイルを作成しました"
else
    echo "⚠️ .env.localファイルは既に存在します"
fi

# 3. Prismaクライアントの生成
echo "🗄️ Prismaクライアントを生成中..."
npx prisma generate

# 4. データベースの初期化
echo "📊 データベースを初期化中..."
npx prisma db push

# 5. シードデータの投入（オプション）
echo "🌱 シードデータを投入中..."
if [ -f "prisma/seed.ts" ]; then
    npx prisma db seed
else
    echo "⚠️ シードファイルが見つかりません"
fi

echo "✅ セットアップが完了しました！"
echo ""
echo "次のコマンドで開発サーバーを起動できます："
echo "npm run dev"
echo ""
echo "Prisma Studioでデータベースを確認できます："
echo "npx prisma studio"
