# タスク管理S3保存機能 環境変数設定例

このファイルは、タスク管理のS3保存機能に必要な環境変数の設定例を示します。
`.env.local` ファイルに以下の変数を設定してください。

---

## 必須設定

### AWS認証情報

S3バケットへのアクセスに必要なAWS認証情報です。
IAMユーザーを作成し、S3への読み書き権限を持つポリシーをアタッチしてください。

- `AWS_ACCESS_KEY_ID`: AWSアクセスキーID
- `AWS_SECRET_ACCESS_KEY`: AWSシークレットアクセスキー
- `AWS_REGION`: S3バケットが配置されているAWSリージョン (例: `ap-northeast-1` for Tokyo)

```dotenv
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-northeast-1
```

### S3バケット名

タスク管理のバックアップファイルを保存するS3バケットの名前です。
事前にS3でバケットを作成しておく必要があります。

- `S3_BUCKET_NAME`: S3バケット名 (例: `your-hr-system-task-backups`)

```dotenv
S3_BUCKET_NAME=your-hr-system-task-backups
```

---

## 設定手順

1. AWSマネジメントコンソールでS3バケットを作成します。
2. S3バケットへのアクセス権限を持つIAMユーザーを作成し、アクセスキーとシークレットアクセスキーを生成します。
3. `.env.local` ファイルに上記環境変数を設定します。
4. アプリケーションを再起動して、新しい環境変数を適用します。

**注意:**
- `AWS_ACCESS_KEY_ID` と `AWS_SECRET_ACCESS_KEY` は機密情報です。公開リポジトリにコミットしないように注意してください。
- 最小限の権限を持つIAMユーザーを使用することを強く推奨します。

---

## 機能概要

### ワークスペース保存
- 現在選択中のワークスペース全体（ボード、リスト、カード、メンバー）をS3に保存
- ファイル名: `workspaces/workspace-{workspaceId}-{timestamp}.json`

### タスク管理全体バックアップ
- 全ワークスペース、全ボード、全カード、全タスクをS3にバックアップ
- ファイル名: `task-management/full-backup-{timestamp}.json`

### 復元機能
- S3に保存されたバックアップからタスク管理データを復元
- 復元前に現在のデータを自動バックアップ
- 復元モード: `replace`（既存データを削除して復元）

---

## 使用例

### ワークスペース保存
```javascript
// 現在のワークスペースをS3に保存
const response = await fetch('/api/workspaces/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ workspaceId: 'workspace-id' })
});
```

### タスク管理全体バックアップ
```javascript
// タスク管理全体をS3にバックアップ
const response = await fetch('/api/task-management/backup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
```

### 復元
```javascript
// バックアップ一覧を取得
const backups = await fetch('/api/task-management/restore');

// 選択したバックアップから復元
const response = await fetch('/api/task-management/restore', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    s3Key: 'task-management/full-backup-2025-01-24T10-30-00.json',
    restoreMode: 'replace'
  })
});
```


