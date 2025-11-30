# 組織図S3保存機能 実装ガイド

## 概要

組織図の階層構造をS3に保存・復元する機能を実装しました。これにより、組織図の変更履歴を管理し、必要に応じて過去の状態に復元できるようになります。

---

## 実装内容

### 1. APIエンドポイント

#### `/api/organization-chart/save` (POST)
- **機能**: 現在の組織図の階層構造をS3に保存
- **保存データ**:
  - 社員の階層関係（parentEmployeeId）
  - 社員の基本情報（名前、部署、役職など）
  - 保存日時とメタデータ
- **レスポンス**:
  ```json
  {
    "success": true,
    "message": "組織図をS3に保存しました",
    "data": {
      "s3Key": "organization-charts/org-chart-2025-10-25T12-30-00-000Z.json",
      "totalEmployees": 15,
      "timestamp": "2025-10-25T12:30:00.000Z"
    }
  }
  ```

#### `/api/organization-chart/restore` (GET)
- **機能**: 利用可能なバックアップ一覧を取得
- **レスポンス**:
  ```json
  {
    "success": true,
    "backups": [
      {
        "key": "organization-charts/org-chart-2025-10-25T12-30-00-000Z.json",
        "lastModified": "2025-10-25T12:30:00.000Z",
        "size": 2048,
        "displayName": "2025-10-25T12-30-00-000Z"
      }
    ]
  }
  ```

#### `/api/organization-chart/restore` (POST)
- **機能**: 指定されたバックアップから組織図を復元
- **リクエスト**:
  ```json
  {
    "s3Key": "organization-charts/org-chart-2025-10-25T12-30-00-000Z.json"
  }
  ```
- **レスポンス**:
  ```json
  {
    "success": true,
    "message": "組織図を復元しました",
    "data": {
      "s3Key": "organization-charts/org-chart-2025-10-25T12-30-00-000Z.json",
      "backupKey": "organization-charts/backup-before-restore-2025-10-25T14-00-00-000Z.json",
      "updatedCount": 15,
      "originalTimestamp": "2025-10-25T12:30:00.000Z",
      "restoreTimestamp": "2025-10-25T14:00:00.000Z"
    }
  }
  ```

### 2. フロントエンド機能

#### 組織図コンポーネントの拡張
- **S3保存ボタン**: 現在の組織図をS3に保存
- **復元ボタン**: 過去のバックアップから復元
- **復元ダイアログ**: バックアップ一覧から選択して復元

#### 権限管理
- 編集権限（`canEdit`）を持つユーザーのみが保存・復元可能
- 管理者権限の確認

### 3. データ構造

#### 保存される組織図データ
```json
{
  "version": "1.0",
  "timestamp": "2025-10-25T12:30:00.000Z",
  "totalEmployees": 15,
  "hierarchy": [
    {
      "id": "emp_001",
      "name": "大澤仁志",
      "position": "代表取締役",
      "department": "経営企画部",
      "employeeNumber": "001",
      "organization": "株式会社オオサワ創研",
      "parentEmployeeId": null,
      "children": [
        {
          "id": "emp_002",
          "name": "田中太郎",
          "position": "部長",
          "department": "営業部",
          "employeeNumber": "002",
          "organization": "株式会社オオサワ創研",
          "parentEmployeeId": "emp_001",
          "children": []
        }
      ],
      "metadata": {
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-10-25T12:30:00.000Z",
        "status": "active"
      }
    }
  ],
  "metadata": {
    "savedBy": "system",
    "saveReason": "organization_chart_backup",
    "environment": "development"
  }
}
```

---

## 使用方法

### 1. 環境設定

#### 必要な環境変数
```dotenv
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=your-hr-system-bucket
```

#### S3バケットの準備
```bash
# バケットを作成
aws s3 mb s3://your-hr-system-bucket --region ap-northeast-1

# フォルダ構造を作成
aws s3api put-object --bucket your-hr-system-bucket --key organization-charts/
```

### 2. 組織図の保存

1. 組織図画面にアクセス
2. 「S3に保存」ボタンをクリック
3. 保存完了の通知を確認

### 3. 組織図の復元

1. 組織図画面にアクセス
2. 「復元」ボタンをクリック
3. 復元したいバックアップを選択
4. 「復元」ボタンをクリック
5. 復元完了の通知を確認

---

## セキュリティ考慮事項

### 1. 権限管理
- 編集権限を持つユーザーのみが保存・復元可能
- 管理者権限の確認

### 2. データ保護
- 復元前に現在の状態を自動バックアップ
- 復元履歴をアクティビティログに記録

### 3. S3アクセス制御
- IAMユーザーの最小権限設定
- バケットポリシーによるアクセス制限

---

## トラブルシューティング

### よくある問題

1. **保存に失敗する**
   - 環境変数の設定を確認
   - S3バケットの存在を確認
   - IAMユーザーの権限を確認

2. **復元に失敗する**
   - バックアップファイルの存在を確認
   - データベースの接続を確認
   - 復元対象の社員データの整合性を確認

3. **権限エラー**
   - ユーザーの編集権限を確認
   - 管理者権限の設定を確認

### デバッグ方法

1. **ログの確認**
   ```bash
   # 開発サーバーのログを確認
   npm run dev
   ```

2. **S3バケットの確認**
   ```bash
   # バックアップファイルの一覧を確認
   aws s3 ls s3://your-hr-system-bucket/organization-charts/
   ```

3. **データベースの確認**
   ```bash
   # 社員データの階層関係を確認
   npx prisma studio
   ```

---

## 今後の拡張予定

### 1. 自動保存機能
- 定期的な自動バックアップ
- 組織図変更時の自動保存

### 2. バージョン管理
- バックアップの差分表示
- 特定の変更点の復元

### 3. 通知機能
- 保存・復元の通知
- エラー発生時のアラート

### 4. バックアップ管理
- 古いバックアップの自動削除
- バックアップの圧縮

---

## 関連ファイル

- `app/api/organization-chart/save/route.ts` - 保存API
- `app/api/organization-chart/restore/route.ts` - 復元API
- `components/organization-chart.tsx` - 組織図コンポーネント
- `ENV_S3_ORG_CHART_EXAMPLE.md` - 環境変数設定例




