#!/bin/bash

# Herokuデプロイ後の自動実行スクリプト
echo "🚀 Herokuデプロイ後の自動セットアップを開始します..."

# PostgreSQL環境用にスキーマを変換
echo "🔄 PostgreSQL用にスキーマを変換中..."
node scripts/switch-schema.js prod

# Prismaクライアントの生成
echo "📦 Prismaクライアントを生成中..."
npx prisma generate

# データベースマイグレーション（スキーマ変更がある場合のみ有効化）
# ⚠️ prisma db push はデータ消失の原因となるため、スキーマ変更がない限り実行しない
# スキーマ変更が必要な場合は、手動で heroku run npx prisma db push を実行すること
set -e
echo "ℹ️ スキーマ変更なし - db push をスキップします。"

# 「見えないTOP」社員の自動作成
echo "👤 「見えないTOP」社員を自動作成中..."
node scripts/auto-create-invisible-top.js

# パスワードハッシュ化マイグレーション
echo "🔒 パスワードハッシュ化マイグレーションを実行中..."
node scripts/migrate-passwords.js

echo "✅ デプロイ後の自動セットアップが完了しました！"
