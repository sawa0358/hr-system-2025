# S3自動バックアップ設定ガイド

## 📋 概要

このシステムは、データベースとファイルの自動バックアップをS3に定期的にアップロードする機能を提供します。

## 🚀 機能

- ✅ **自動定期バックアップ**: 設定した間隔で自動的にデータベースをバックアップ
- ✅ **S3への自動アップロード**: バックアップファイルをS3に自動保存
- ✅ **ファイル圧縮**: バックアップファイルをgzipで圧縮してストレージを節約
- ✅ **古いバックアップの自動削除**: 保持期間を過ぎたバックアップを自動削除
- ✅ **バックアップ履歴管理**: 最大保持数と保持期間の設定

## ⚙️ 設定方法

### 1. 環境変数の設定

`.env.local`ファイルに以下を追加してください：

```bash
# S3自動バックアップを有効化
AUTO_S3_BACKUP=true

# バックアップ実行間隔（時間単位）
BACKUP_INTERVAL_HOURS=24

# アプリケーションのベースURL
NEXT_PUBLIC_BASE_URL=http://localhost:3007
```

### 2. AWS S3の設定

既存のS3設定を使用します：
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`

### 3. バックアップの開始

サーバーを起動すると自動的にバックアップスケジューラーが開始されます：

```bash
npm run dev
```

## 🔄 バックアップの動作

### 自動バックアップの実行タイミング

1. **初回実行**: サーバー起動後すぐに実行
2. **定期実行**: 設定した間隔（デフォルト: 24時間）ごとに実行

### バックアップ内容

- **データベース全体**: JSON形式でエクスポート
- **ファイル**: gzip圧縮済み

### S3の保存場所

```
s3://{AWS_S3_BUCKET_NAME}/
  └── backups/
      ├── 2025-10-26T00-00-00-auto-backup-2025-10-26T00-00-00.json.gz
      ├── 2025-10-27T00-00-00-auto-backup-2025-10-27T00-00-00.json.gz
      └── ...
```

## 📊 バックアップの管理

### 手動バックアップの実行

APIを直接呼び出して手動でバックアップを実行できます：

```bash
curl -X POST http://localhost:3007/api/backup \
  -H "Content-Type: application/json" \
  -d '{"reason": "manual"}'
```

### バックアップ状態の確認

```bash
curl http://localhost:3007/api/backup/status
```

### スケジューラーの状態確認

```bash
curl http://localhost:3007/api/backup/scheduler
```

### スケジューラーの制御

```bash
# スケジューラーを開始
curl -X POST http://localhost:3007/api/backup/scheduler \
  -H "Content-Type: application/json \
  -d '{"action": "start"}'

# スケジューラーを停止
curl -X POST http://localhost:3007/api/backup/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

## 🔧 バックアップ設定のカスタマイズ

`app/api/backup/route.ts`で以下の設定を変更できます：

```typescript
const BACKUP_CONFIG = {
  backupDir: 'backups',        // ローカルバックアップディレクトリ
  retentionDays: 30,           // 保持期間（日）
  maxBackups: 50,              // 最大保持数
  compress: true                // 圧縮の有効化
};
```

## 🔄 復元方法

### S3からバックアップを取得

```bash
# S3のバックアップファイルをリスト
aws s3 ls s3://{AWS_S3_BUCKET_NAME}/backups/

# バックアップファイルをダウンロード
aws s3 cp s3://{AWS_S3_BUCKET_NAME}/backups/2025-10-26T00-00-00-auto-backup-2025-10-26T00-00-00.json.gz ./

# 解凍
gunzip 2025-10-26T00-00-00-auto-backup-2025-10-26T00-00-00.json.gz
```

### データベースの復元

復元スクリプトを使用：

```bash
node scripts/restore-from-s3.js
```

## 🛡️ セキュリティ

- バックアップファイルはS3で**プライベート**として保存されます
- AWS IAMで適切な権限設定が必要です
- 本番環境では定期的にバックアップをテストしてください

## 📝 注意事項

1. **ストレージコスト**: S3のストレージ使用量に応じてコストが発生します
2. **ネットワーク**: バックアップファイルのサイズによってはアップロードに時間がかかります
3. **保持期間**: 古いバックアップは自動的に削除されます
4. **本番環境**: 本番環境では必ず定期的なバックアップを有効化してください

## 🐛 トラブルシューティング

### バックアップが実行されない場合

1. 環境変数`AUTO_S3_BACKUP=true`が設定されているか確認
2. AWSの認証情報が正しく設定されているか確認
3. S3バケットのアクセス権限を確認
4. サーバーログを確認

### S3アップロードが失敗する場合

1. AWSの認証情報を確認
2. S3バケットの存在を確認
3. IAMポリシーで`PutObject`権限があるか確認
4. ネットワーク接続を確認

## 📚 関連ドキュメント

- [AUTO_BACKUP_SETUP_GUIDE_v1.9.3.md](./AUTO_BACKUP_SETUP_GUIDE_v1.9.3.md)
- [ENV_TEMPLATE.md](./ENV_TEMPLATE.md)
- [完全バックアップ手順.md](./完全バックアップ手順.md)

