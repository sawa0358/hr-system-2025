#!/bin/bash

# 開発サーバー起動スクリプト
# 環境変数を設定してNext.js開発サーバーを起動

# スクリプトが配置されているディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 絶対パスでデータベースを指定
export DATABASE_URL="file:${SCRIPT_DIR}/prisma/dev.db"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="dev-secret-key-for-local-development"

# Prismaスキーマを一時的にSQLite用に切り替え
SCHEMA_PATH="${SCRIPT_DIR}/prisma/schema.prisma"
if [ -f "$SCHEMA_PATH" ]; then
  echo "🔄 Prismaスキーマをローカル開発用（SQLite）に切り替え中..."
  sed -i.bak 's/provider = "postgresql"/provider = "sqlite"/' "$SCHEMA_PATH"
  
  # Prismaクライアントを再生成
  npx prisma generate
  
  # 終了時にスキーマを元に戻すトラップを設定
  trap 'echo "🔄 Prismaスキーマを元に戻しています..."; sed -i.bak '"'"'s/provider = "sqlite"/provider = "postgresql"/'"'"' '"$SCHEMA_PATH"'; rm -f '"${SCHEMA_PATH}.bak"'; echo "✅ スキーマを復元しました"' EXIT
fi

echo "🚀 開発サーバーを起動しています..."
echo "📊 データベース: $DATABASE_URL"
echo "🌐 URL: $NEXTAUTH_URL"

npm run dev
