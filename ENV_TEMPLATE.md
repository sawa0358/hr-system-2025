# 環境変数テンプレート

プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下の内容をコピーしてください。

```bash
# =====================================
# データベース設定
# =====================================
# 開発環境（SQLite）
DATABASE_URL="file:./prisma/dev.db"

# 本番環境（Heroku PostgreSQL）- Herokuが自動設定
# DATABASE_URL="postgresql://..."

# =====================================
# Gemini API Configuration
# =====================================
# Google AI StudioでAPIキーを取得してください: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# =====================================
# AWS S3設定（ファイルストレージ）
# =====================================
# AWS Access Key ID（IAMユーザーのアクセスキー）
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here

# AWS Secret Access Key（IAMユーザーのシークレットキー）
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here

# AWS リージョン（推奨: ap-northeast-1 = 東京）
AWS_REGION=ap-northeast-1

# S3バケット名（事前に作成が必要）
AWS_S3_BUCKET_NAME=hr-system-files-your-company

# =====================================
# NextAuth.js 設定（認証）
# =====================================
# NextAuthのシークレットキー（本番環境では必須）
# 生成コマンド: openssl rand -base64 32
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# アプリケーションのURL
# 開発環境
NEXTAUTH_URL=http://localhost:3000

# 本番環境（Heroku）
# NEXTAUTH_URL=https://your-app-name.herokuapp.com

# =====================================
# S3自動バックアップ設定
# =====================================
# 自動バックアップを有効化する場合 'true' に設定
AUTO_S3_BACKUP=false

# バックアップ実行間隔（時間単位、デフォルト: 24時間）
BACKUP_INTERVAL_HOURS=24

# アプリケーションのベースURL（スケジューラー用）
NEXT_PUBLIC_BASE_URL=http://localhost:3007

# =====================================
# Cron自動実行設定
# =====================================
# Cronエンドポイント認証トークン（自動実行用）
# 生成コマンド: openssl rand -base64 32
CRON_SECRET_TOKEN=your_cron_secret_token_here
```

## 📋 セットアップ手順

### 1. `.env.local` ファイルを作成

```bash
cp ENV_TEMPLATE.md .env.local
```

### 2. 各環境変数を設定

#### 🔑 Gemini API Key
1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. APIキーを作成
3. `GEMINI_API_KEY` に設定

#### ☁️ AWS S3設定
1. AWSコンソールで S3 バケットを作成
   - バケット名: `hr-system-files-your-company`
   - リージョン: `ap-northeast-1`（東京）
   - パブリックアクセス: ブロック
   
2. IAM ユーザーを作成
   - プログラムによるアクセス有効
   - S3アクセス権限を付与
   - アクセスキーとシークレットキーを取得

3. 環境変数に設定
   ```bash
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=wJalrXUt...
   AWS_REGION=ap-northeast-1
   AWS_S3_BUCKET_NAME=hr-system-files-your-company
   ```

詳細は `deploy-guide.md` を参照してください。

### 3. 開発サーバーを再起動

```bash
npm run dev
```

## 🚀 本番環境（Heroku）の設定

Herokuでは `.env.local` は使用されません。以下のコマンドで環境変数を設定してください：

```bash
# Gemini API
heroku config:set GEMINI_API_KEY="your_gemini_api_key"

# AWS S3
heroku config:set AWS_ACCESS_KEY_ID="your_access_key"
heroku config:set AWS_SECRET_ACCESS_KEY="your_secret_key"
heroku config:set AWS_REGION="ap-northeast-1"
heroku config:set AWS_S3_BUCKET_NAME="hr-system-files-your-company"

# NextAuth
heroku config:set NEXTAUTH_SECRET="your_production_secret"
heroku config:set NEXTAUTH_URL="https://your-app-name.herokuapp.com"

# データベース（Herokuが自動設定）
# DATABASE_URL は自動的に設定されます
```

## ⚠️ セキュリティ注意事項

- **絶対に** `.env.local` ファイルを Git にコミットしないでください
- `.gitignore` に `.env.local` が含まれていることを確認してください
- 本番環境のキーは定期的に更新してください
- AWS IAMユーザーには必要最小限の権限のみ付与してください

## 🔍 トラブルシューティング

### エラー: "AWS credentials not found"
→ AWS関連の環境変数が設定されていません。`.env.local` を確認してください。

### エラー: "The specified bucket does not exist"
→ S3バケットが作成されていないか、バケット名が間違っています。

### エラー: "Access Denied"
→ IAMユーザーに適切な権限がありません。S3アクセスポリシーを確認してください。

---

**詳細なセットアップ手順**: `deploy-guide.md` を参照してください。
