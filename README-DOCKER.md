# HRシステム Docker環境

## 🚀 簡単起動

```bash
# 自動起動スクリプトを使用（推奨）
npm run docker:up
```

または

```bash
# 手動で起動
./start-local.sh
```

## 📋 利用可能なコマンド

```bash
# システム起動
npm run docker:up

# システム停止
npm run docker:down

# ログ表示
npm run docker:logs

# アプリケーションのみ再起動
npm run docker:restart
```

## 🔧 手動操作

### データベース操作
```bash
# データベースに接続
docker-compose exec postgres psql -U postgres -d hr_dev

# マイグレーション実行
docker-compose run --rm app npx prisma migrate deploy

# シードデータ投入
docker-compose run --rm app npm run db:seed

# Prisma Studio起動
docker-compose run --rm app npx prisma studio
```

### ログ確認
```bash
# 全サービスログ
docker-compose logs -f

# アプリケーションのみ
docker-compose logs -f app

# データベースのみ
docker-compose logs -f postgres
```

## 🗄️ データベース情報

- **ホスト**: localhost:5432
- **データベース名**: hr_dev
- **ユーザー**: postgres
- **パスワード**: password

## 🌐 アクセス情報

- **アプリケーション**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (起動時)

## 🔄 データリセット

```bash
# 全データをリセット（注意：全データが削除されます）
docker-compose down -v
docker-compose up -d postgres
docker-compose run --rm app npx prisma migrate deploy
docker-compose run --rm app npm run db:seed
docker-compose up -d app
```

## 🛠️ トラブルシューティング

### ポートが使用中の場合
```bash
# 使用中のポートを確認
lsof -i :3001
lsof -i :5432

# プロセスを終了
kill -9 <PID>
```

### データベース接続エラー
```bash
# データベースコンテナの状態確認
docker-compose ps

# データベースコンテナを再起動
docker-compose restart postgres
```

### アプリケーションエラー
```bash
# アプリケーションコンテナを再起動
docker-compose restart app

# ログを確認
docker-compose logs app
```
