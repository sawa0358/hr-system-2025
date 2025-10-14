#!/bin/bash

# HRシステム自動起動スクリプト
echo "🚀 HRシステムを起動中..."

# 色付きログ関数
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

# Dockerが起動しているかチェック
if ! docker info > /dev/null 2>&1; then
    log_error "Dockerが起動していません。Docker Desktopを起動してください。"
    exit 1
fi

# 既存のコンテナを停止・削除
log_info "既存のコンテナを停止中..."
docker-compose down -v

# イメージを再ビルド（変更があった場合）
log_info "Dockerイメージをビルド中..."
docker-compose build --no-cache

# データベースとアプリケーションを起動
log_info "データベースとアプリケーションを起動中..."
docker-compose up -d postgres

# データベースの準備完了を待機
log_info "データベースの準備完了を待機中..."
until docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo ""

# Prismaマイグレーション実行
log_info "データベースマイグレーションを実行中..."
docker-compose run --rm app npx prisma migrate deploy

# シードデータの投入
log_info "シードデータを投入中..."
docker-compose run --rm app npm run db:seed

# アプリケーションを起動
log_info "アプリケーションを起動中..."
docker-compose up -d app

# 起動完了を待機
log_info "アプリケーションの起動完了を待機中..."
until curl -s http://localhost:3001 > /dev/null 2>&1; do
    echo -n "."
    sleep 3
done
echo ""

log_info "✅ HRシステムが正常に起動しました！"
log_info "🌐 アプリケーション: http://localhost:3001"
log_info "🗄️  データベース: PostgreSQL (localhost:5432)"
log_info ""
log_info "📋 利用可能なコマンド:"
log_info "  docker-compose logs -f app    # アプリケーションログを表示"
log_info "  docker-compose logs -f postgres  # データベースログを表示"
log_info "  docker-compose down           # システムを停止"
log_info "  docker-compose restart app    # アプリケーションのみ再起動"
log_info ""
log_info "💡 ヒント: 初回起動後は自動的にinvisible-topが作成されます。"
