#!/bin/bash

# Herokuデプロイ後の自動実行スクリプト
echo "🚀 Herokuデプロイ後の自動セットアップを開始します..."

# PostgreSQL環境用にスキーマを変換
echo "🔄 PostgreSQL用にスキーマを変換中..."
node scripts/switch-schema.js prod

# Prismaクライアントの生成
echo "📦 Prismaクライアントを生成中..."
npx prisma generate

# データベースマイグレーションの実行
echo "🗄️ データベースマイグレーションを実行中..."
set -e
if ! npx prisma migrate deploy; then
  echo "⚠️ migrate deploy に失敗しました。migration.sql の欠落などが原因の可能性があります。"
  echo "➡️ 代替として schema をDBへ直接適用します（db push）。"
  npx prisma db push --accept-data-loss
fi

# 「見えないTOP」社員の自動作成
echo "👤 「見えないTOP」社員を自動作成中..."
node scripts/auto-create-invisible-top.js

echo "✅ デプロイ後の自動セットアップが完了しました！"
