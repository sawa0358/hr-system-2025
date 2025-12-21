# 組織図S3保存機能用 環境変数設定例

組織図のS3保存・復元機能を使用するには、以下の環境変数を `.env.local` またはデプロイ環境に設定してください。

---

## 必須設定

### AWS認証情報
```dotenv
# AWS認証情報
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=ap-northeast-1
```

### S3バケット設定
```dotenv
# S3バケット名（組織図の保存先）
S3_BUCKET_NAME=your-hr-system-bucket
```

---

## オプション設定

### 組織図保存設定
```dotenv
# 組織図の自動保存設定
ORG_CHART_AUTO_SAVE=true
ORG_CHART_SAVE_INTERVAL_HOURS=24
ORG_CHART_MAX_BACKUPS=30
```

### 保存形式設定
```dotenv
# 組織図の保存形式（json, compressed）
ORG_CHART_SAVE_FORMAT=json
ORG_CHART_COMPRESS_BACKUPS=true
```

---

## `.env.local` ファイルの完全な例

```dotenv
# データベース設定
DATABASE_URL="file:./prisma/dev.db"

# AWS認証情報
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-northeast-1

# S3バケット設定
S3_BUCKET_NAME=hr-system-org-charts

# 組織図保存設定
ORG_CHART_AUTO_SAVE=true
ORG_CHART_SAVE_INTERVAL_HOURS=24
ORG_CHART_MAX_BACKUPS=30
ORG_CHART_SAVE_FORMAT=json
ORG_CHART_COMPRESS_BACKUPS=true

# その他の設定
NEXT_PUBLIC_APP_VERSION=1.9.3
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

---

## S3バケットの設定

### 1. バケットの作成
```bash
# AWS CLIを使用してバケットを作成
aws s3 mb s3://your-hr-system-bucket --region ap-northeast-1
```

### 2. バケットポリシーの設定
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowHRSystemAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-hr-system-bucket",
        "arn:aws:s3:::your-hr-system-bucket/*"
      ]
    }
  ]
}
```

### 3. フォルダ構造
```
your-hr-system-bucket/
├── organization-charts/
│   ├── org-chart-2025-10-25T12-30-00-000Z.json
│   ├── org-chart-2025-10-25T13-30-00-000Z.json
│   └── backup-before-restore-2025-10-25T14-00-00-000Z.json
└── other-files/
```

---

## 権限設定

### IAMユーザーの最小権限
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-hr-system-bucket/organization-charts/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-hr-system-bucket",
      "Condition": {
        "StringLike": {
          "s3:prefix": "organization-charts/*"
        }
      }
    }
  ]
}
```

---

## トラブルシューティング

### よくあるエラー

1. **S3_BUCKET_NAME環境変数が設定されていません**
   - `.env.local`に`S3_BUCKET_NAME`を設定してください

2. **AWS認証情報が無効です**
   - `AWS_ACCESS_KEY_ID`と`AWS_SECRET_ACCESS_KEY`を確認してください

3. **バケットにアクセスできません**
   - IAMユーザーの権限を確認してください
   - バケットポリシーを確認してください

4. **組織図の保存に失敗しました**
   - ネットワーク接続を確認してください
   - S3バケットの存在を確認してください

### デバッグ方法

1. **ログの確認**
   ```bash
   # 開発サーバーのログを確認
   npm run dev
   ```

2. **S3バケットの確認**
   ```bash
   # AWS CLIでバケットの内容を確認
   aws s3 ls s3://your-hr-system-bucket/organization-charts/
   ```

3. **環境変数の確認**
   ```bash
   # 環境変数が正しく設定されているか確認
   echo $S3_BUCKET_NAME
   echo $AWS_ACCESS_KEY_ID
   ```















