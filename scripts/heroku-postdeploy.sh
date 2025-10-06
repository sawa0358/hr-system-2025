#!/bin/bash

# Herokuデプロイ後の自動実行スクリプト
echo "🚀 Herokuデプロイ後の自動セットアップを開始します..."

# Prismaクライアントの生成
echo "📦 Prismaクライアントを生成中..."
npx prisma generate

# データベースマイグレーションの実行
echo "🗄️ データベースマイグレーションを実行中..."
npx prisma migrate deploy

# 「見えないTOP」社員の自動作成
echo "👤 「見えないTOP」社員を自動作成中..."
node scripts/auto-create-invisible-top.js

echo "✅ デプロイ後の自動セットアップが完了しました！"
