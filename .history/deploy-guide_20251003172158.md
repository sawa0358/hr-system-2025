# 🚀 HRシステム デプロイガイド

## 📋 概要

このガイドでは、HRシステムをHerokuとAWS S3を使用してデプロイする手順を説明します。

## 🛠️ 前提条件

- Heroku CLI がインストールされている
- AWS アカウントがある
- Git がインストールされている
- Node.js 18.x がインストールされている

## 🔧 ローカル開発環境のセットアップ

### 1. 依存関係のインストール

```bash
# 開発環境セットアップスクリプトを実行
./scripts/setup-dev.sh

# または手動で実行
npm install
npx prisma generate
npx prisma db push
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の内容を設定：

```env
# データベース設定
DATABASE_URL="file:./dev.db"

# 認証設定
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3設定（本番環境用）
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="ap-northeast-1"
AWS_S3_BUCKET_NAME="hr-system-files"
```

## 🌐 AWS S3 セットアップ

### 1. S3バケットの作成

1. AWS コンソールにログイン
2. S3 サービスに移動
3. 「バケットを作成」をクリック
4. バケット名を入力（例：`hr-system-files-your-company`）
5. リージョンを選択（推奨：`ap-northeast-1`）
6. パブリックアクセスをブロック設定
7. バケットを作成

### 2. IAMユーザーの作成

1. IAM コンソールに移動
2. 「ユーザー」→「ユーザーを追加」
3. ユーザー名を入力（例：`hr-system-s3-user`）
4. 「プログラムによるアクセス」を選択
5. ポリシーをアタッチ：
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```
6. アクセスキーIDとシークレットアクセスキーを保存

## 🚀 Heroku デプロイ

### 1. Heroku CLI のセットアップ

```bash
# Heroku CLI のインストール（macOS）
brew tap heroku/brew && brew install heroku

# Heroku にログイン
heroku login
```

### 2. Heroku アプリの作成

```bash
# アプリを作成
heroku create your-hr-app-name

# PostgreSQL アドオンを追加
heroku addons:create heroku-postgresql:mini
```

### 3. 環境変数の設定

```bash
# データベースURL（自動設定される）
heroku config:get DATABASE_URL

# AWS S3 設定
heroku config:set AWS_ACCESS_KEY_ID="your-aws-access-key"
heroku config:set AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
heroku config:set AWS_REGION="ap-northeast-1"
heroku config:set AWS_S3_BUCKET_NAME="your-bucket-name"

# NextAuth 設定
heroku config:set NEXTAUTH_SECRET="your-production-secret-key"
heroku config:set NEXTAUTH_URL="https://your-hr-app-name.herokuapp.com"
```

### 4. デプロイ

```bash
# Git リポジトリを初期化（まだの場合）
git init
git add .
git commit -m "Initial commit"

# Heroku リモートを追加
heroku git:remote -a your-hr-app-name

# デプロイ
git push heroku main

# データベースマイグレーション
heroku run npx prisma db push

# シードデータの投入（オプション）
heroku run npx prisma db seed
```

## 📊 データベース設計の改善

### 主要な改善点

1. **Enum型の追加**: より厳密なデータ型管理
2. **リレーションの改善**: 上司・部下関係の追加
3. **新機能テーブル**: 休暇申請、プロジェクト、通知
4. **セキュリティ強化**: ファイル暗号化、権限管理

### マイグレーション手順

```bash
# 開発環境でスキーマを更新
cp prisma/schema-improved.prisma prisma/schema.prisma

# マイグレーションを生成
npx prisma migrate dev --name improve-schema

# 本番環境でマイグレーション
heroku run npx prisma migrate deploy
```

## 🔒 セキュリティ設定

### 1. ファイルアクセス制御

- 署名付きURLを使用した一時的なアクセス
- ファイルの暗号化（機密ファイル用）
- 権限ベースのアクセス制御

### 2. データベースセキュリティ

- 環境変数での機密情報管理
- 接続の暗号化
- 定期的なバックアップ

### 3. アプリケーションセキュリティ

- NextAuth.js による認証
- CSRF 保護
- XSS 対策

## 📈 監視とログ

### 1. Heroku ログの確認

```bash
# リアルタイムログ
heroku logs --tail

# 特定の時間のログ
heroku logs --since="2024-01-01"
```

### 2. パフォーマンス監視

- Heroku Metrics の活用
- データベース接続数の監視
- レスポンス時間の追跡

## 🚨 トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   ```bash
   heroku run npx prisma db push
   ```

2. **S3アクセスエラー**
   - IAMポリシーの確認
   - バケット名の確認
   - リージョンの確認

3. **ビルドエラー**
   ```bash
   heroku logs --tail
   ```

### ログの確認

```bash
# アプリケーションログ
heroku logs --app your-hr-app-name

# データベースログ
heroku logs --app your-hr-app-name --dyno postgres
```

## 📚 参考資料

- [Heroku Node.js サポート](https://devcenter.heroku.com/articles/nodejs-support)
- [AWS S3 ドキュメント](https://docs.aws.amazon.com/s3/)
- [Prisma デプロイガイド](https://www.prisma.io/docs/guides/deployment)
- [Next.js デプロイガイド](https://nextjs.org/docs/deployment)

## 🤝 サポート

問題が発生した場合は、以下の手順でサポートを受けてください：

1. ログを確認
2. 環境変数を確認
3. データベース接続を確認
4. S3アクセス権限を確認

---

**注意**: 本番環境では必ず適切なセキュリティ設定を行い、定期的なバックアップを実施してください。
