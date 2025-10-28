# 本番環境でのS3自動バックアップ設定ガイド

## 🎯 本番環境での動作確認

この機能は本番環境でも動作しますが、いくつかの設定が必要です。

## ⚙️ Herokuでの設定

### 1. 環境変数の設定

HerokuのダッシュボードまたはCLIで以下の環境変数を設定してください：

```bash
# Heroku CLIを使用する場合
heroku config:set AUTO_S3_BACKUP=true -a your-app-name
heroku config:set BACKUP_INTERVAL_HOURS=24 -a your-app-name
heroku config:set NEXT_PUBLIC_BASE_URL=https://your-app-name.herokuapp.com -a your-app-name

# AWS S3設定（既に設定済みの場合は不要）
heroku config:set AWS_ACCESS_KEY_ID=your_key -a your-app-name
heroku config:set AWS_SECRET_ACCESS_KEY=your_secret -a your-app-name
heroku config:set AWS_REGION=ap-northeast-1 -a your-app-name
heroku config:set AWS_S3_BUCKET_NAME=your-bucket -a your-app-name
```

### 2. Heroku Schedulerの設定（推奨方法）

Heroku Schedulerアドオンを使用して定期バックアップを実行する方法：

#### a) Heroku Schedulerアドオンのインストール

```bash
heroku addons:create scheduler:standard -a your-app-name
```

#### b) スケジューラーの設定

Herokuダッシュボードから：
1. 「Resources」タブを開く
2. 「Heroku Scheduler」をクリック
3. 「Create job」をクリック
4. 以下の設定を入力：

```
Run Command: curl -X POST https://your-app-name.herokuapp.com/api/backup -H "Content-Type: application/json" -d '{"reason":"scheduled"}'
Frequency: 毎日 (Daily)
```

または、より詳細なコマンドで：

```bash
# 毎日午前3時（JST）に実行する場合（UTCで18:00）
curl -X POST https://your-app-name.herokuapp.com/api/backup \
  -H "Content-Type: application/json" \
  -d '{"reason":"scheduled"}'
```

### 3. アプリケーション内スケジューラーの使用（代替方法）

アプリケーション内のスケジューラーを使用する場合：

```bash
# スケジューラーを手動で開始
curl -X POST https://your-app-name.herokuapp.com/api/backup/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'
```

**注意**: Herokuの無料プランでは、アプリケーションが30分間非アクティブになるとスリープします。そのため、Heroku Schedulerアドオンの使用を強く推奨します。

## 🔧 本番環境での動作の特徴

### 自動URL検出

本番環境では、以下の順序でURLを自動検出します：

1. `NEXT_PUBLIC_BASE_URL` 環境変数
2. Heroku環境: `https://${HEROKU_APP_NAME}.herokuapp.com`
3. Vercel環境: `https://${VERCEL_URL}`
4. その他: `NEXTAUTH_URL` 環境変数

### PostgreSQLデータベースのバックアップ

本番環境ではPostgreSQLを使用している場合、以下のスクリプトでバックアップを実行します：

```bash
# PostgreSQLのダンプを作成してS3にアップロード
pg_dump $DATABASE_URL | gzip > backup.sql.gz
# その後、S3にアップロード
```

## 🧪 動作確認手順

### 1. 手動バックアップのテスト

本番環境で手動バックアップを実行して動作確認：

```bash
curl -X POST https://your-app-name.herokuapp.com/api/backup \
  -H "Content-Type: application/json" \
  -d '{"reason":"manual-test"}'
```

### 2. S3へのアップロード確認

```bash
# S3のバケットを確認
aws s3 ls s3://your-bucket/backups/

# 最新のバックアップを確認
aws s3 ls s3://your-bucket/backups/ | tail -5
```

### 3. スケジューラーの状態確認

```bash
curl https://your-app-name.herokuapp.com/api/backup/scheduler
```

## ⚠️ 重要な注意事項

### Herokuの制限事項

1. **スリープ**: 無料プランでは30分間非アクティブでスリープします
   - → **解決策**: Heroku Schedulerアドオンを使用

2. **メモリ制限**: バックアップ処理には十分なメモリが必要
   - → **解決策**: データベースサイズに応じてプランを選択

3. **タイムアウト**: HerokuのHTTPリクエストには30秒のタイムアウトがある
   - → **解決策**: バックアップ処理は非同期で実行

### セキュリティ

1. **環境変数**: AWS認証情報は必ず環境変数で管理
2. **S3バケット**: プライベートアクセスを設定
3. **IAM権限**: 最小限の権限（PutObject, GetObject）のみ付与

## 🔄 バックアップの復元

### S3からバックアップを取得

```bash
# 最新のバックアップをダウンロード
aws s3 cp s3://your-bucket/backups/latest-backup.json.gz ./

# 解凍
gunzip latest-backup.json.gz
```

### データベースの復元

```bash
# HerokuのPostgreSQLに復元
heroku pg:backups:restore <backup-url> DATABASE_URL -a your-app-name
```

## 📊 モニタリング

### ログの確認

```bash
# バックアップ関連のログを確認
heroku logs --tail -a your-app-name | grep -i backup

# スケジューラーのログを確認
heroku logs --tail -a your-app-name | grep -i scheduler
```

### バックアップ履歴の確認

```bash
curl https://your-app-name.herokuapp.com/api/backup/status
```

## 🐛 トラブルシューティング

### バックアップが実行されない場合

1. 環境変数の確認
   ```bash
   heroku config -a your-app-name
   ```

2. S3への接続確認
   ```bash
   heroku run node -e "console.log(process.env.AWS_S3_BUCKET_NAME)" -a your-app-name
   ```

3. ログの確認
   ```bash
   heroku logs --tail -a your-app-name
   ```

### S3アップロードが失敗する場合

1. IAM権限の確認
2. S3バケットの存在確認
3. ネットワーク接続の確認

## 📚 関連ドキュメント

- [S3_AUTO_BACKUP_GUIDE.md](./S3_AUTO_BACKUP_GUIDE.md)
- [ENV_TEMPLATE.md](./ENV_TEMPLATE.md)
- [AUTO_BACKUP_SETUP_GUIDE_v1.9.3.md](./AUTO_BACKUP_SETUP_GUIDE_v1.9.3.md)

