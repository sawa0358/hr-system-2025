# 🚀 HRシステム デプロイガイド（Heroku + AWS S3）

## 📋 概要

このガイドでは、HRシステムをHerokuとAWS S3を使用してデプロイする手順を説明します。

**アーキテクチャ:**
- **Heroku**: アプリケーション実行環境
- **Heroku PostgreSQL**: データベース
- **AWS S3 (東京リージョン)**: ファイルストレージ

## 🛠️ 前提条件

- [ ] Heroku CLI がインストールされている
- [ ] AWS アカウントがある
- [ ] Git がインストールされている
- [ ] Node.js 18.x 以上がインストールされている

---

## 🌐 AWS S3 セットアップ

### ステップ 1: S3バケットの作成

1. [AWS コンソール](https://console.aws.amazon.com/) にログイン
2. サービスから **S3** を選択
3. **バケットを作成** をクリック

#### バケット設定:
- **バケット名**: `hr-system-files-your-company` （ユニークな名前に変更）
- **AWS リージョン**: `アジアパシフィック (東京) ap-northeast-1`
- **パブリックアクセスをブロック**: ✅ すべてブロック（推奨）
- **バケットのバージョニング**: 有効化（推奨）
- **暗号化**: Amazon S3 マネージド キー (SSE-S3)

4. **バケットを作成** をクリック

### ステップ 2: IAMユーザーの作成

1. AWS コンソールで **IAM** サービスに移動
2. **ユーザー** → **ユーザーを作成** をクリック

#### ユーザー設定:
- **ユーザー名**: `hr-system-s3-user`
- **アクセスキー - プログラムによるアクセス**: ✅ チェック

3. **次へ: アクセス許可** をクリック
4. **ポリシーを直接アタッチ** を選択
5. **ポリシーの作成** をクリック

#### S3アクセスポリシー (JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "HRSystemS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::hr-system-files-your-company",
        "arn:aws:s3:::hr-system-files-your-company/*"
      ]
    }
  ]
}
```

**重要:** `hr-system-files-your-company` を実際のバケット名に変更してください。

6. ポリシー名: `HRSystemS3Policy`
7. ユーザーにポリシーをアタッチ
8. **ユーザーを作成** をクリック

#### アクセスキーの保存:
- **アクセスキーID**: `AKIA...` （メモする）
- **シークレットアクセスキー**: `wJalrXUt...` （メモする）

⚠️ **重要**: シークレットアクセスキーは再表示できません。必ず安全に保存してください。

---

## 🚀 Heroku デプロイ

### ステップ 1: Heroku CLI のセットアップ

```bash
# Heroku CLI のインストール（macOS）
brew tap heroku/brew && brew install heroku

# Heroku にログイン
heroku login
```

### ステップ 2: Heroku アプリの作成

```bash
# アプリを作成（日本リージョン推奨）
heroku create your-hr-app-name --region us

# PostgreSQL アドオンを追加（最小プラン）
heroku addons:create heroku-postgresql:essential-0

# データベースURLを確認
heroku config:get DATABASE_URL
```

### ステップ 3: 環境変数の設定

```bash
# AWS S3 設定
heroku config:set AWS_ACCESS_KEY_ID="AKIA..." \
  AWS_SECRET_ACCESS_KEY="wJalrXUt..." \
  AWS_REGION="ap-northeast-1" \
  AWS_S3_BUCKET_NAME="hr-system-files-your-company"

# Gemini AI 設定
heroku config:set GEMINI_API_KEY="your_gemini_api_key"

# NextAuth 設定（シークレットキーを生成）
# 実行: openssl rand -base64 32
heroku config:set NEXTAUTH_SECRET="生成されたシークレットキー"

# アプリケーションURL
heroku config:set NEXTAUTH_URL="https://your-hr-app-name.herokuapp.com"

# 設定確認
heroku config
```

### ステップ 4: デプロイ

```bash
# Git リポジトリを初期化（まだの場合）
git init
git add .
git commit -m "Initial deployment with S3 integration"

# Heroku リモートを追加
heroku git:remote -a your-hr-app-name

# デプロイ
git push heroku main

# ログを確認
heroku logs --tail
```

### ステップ 5: データベースのセットアップ

```bash
# Prismaマイグレーションを実行
heroku run npx prisma migrate deploy

# データベースのシード（初期データ投入）
heroku run npx prisma db seed
```

### ステップ 6: 動作確認

1. ブラウザでアプリにアクセス: `https://your-hr-app-name.herokuapp.com`
2. ログインして動作確認
3. ファイルアップロード機能をテスト

---

## 📦 既存データの移行（オプション）

開発環境の `uploads/` フォルダに既存ファイルがある場合、S3に移行します：

```bash
# 移行スクリプトを実行
node scripts/migrate-files-to-s3.js

# 環境変数を設定してから実行
AWS_ACCESS_KEY_ID="..." \
AWS_SECRET_ACCESS_KEY="..." \
AWS_REGION="ap-northeast-1" \
AWS_S3_BUCKET_NAME="your-bucket-name" \
node scripts/migrate-files-to-s3.js
```

---

## 🔒 セキュリティ設定

### 1. S3バケットポリシー（追加推奨）

S3バケットにバケットポリシーを設定して、さらにセキュリティを強化：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hr-system-files-your-company/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::YOUR_ACCOUNT_ID:user/hr-system-s3-user"
        }
      }
    }
  ]
}
```

### 2. HTTPS の強制

Heroku は自動的に HTTPS を有効にします。

### 3. 定期的なバックアップ

```bash
# Heroku Postgres のバックアップ
heroku pg:backups:capture
heroku pg:backups:download

# S3のバージョニングを有効化（既に設定済み）
```

---

## 📈 監視とログ

### Heroku ログの確認

```bash
# リアルタイムログ
heroku logs --tail

# 過去500行のログ
heroku logs -n 500

# エラーログのみ
heroku logs --tail | grep ERROR
```

### S3アクセスログの有効化（オプション）

1. S3コンソールでバケットを選択
2. **プロパティ** → **サーバーアクセスのログ記録**
3. ログバケットを設定

### パフォーマンス監視

```bash
# Dynoの状態確認
heroku ps

# データベース接続数
heroku pg:info

# アプリのメトリクス
heroku metrics
```

---

## 🚨 トラブルシューティング

### 問題1: ファイルアップロードに失敗する

**症状**: `Access Denied` エラー

**解決策**:
1. IAMユーザーの権限を確認
2. バケット名が正しいか確認
3. 環境変数が設定されているか確認

```bash
heroku config:get AWS_S3_BUCKET_NAME
heroku config:get AWS_ACCESS_KEY_ID
```

### 問題2: データベース接続エラー

**症状**: `Cannot connect to database`

**解決策**:
```bash
# データベースの状態確認
heroku pg:info

# マイグレーション再実行
heroku run npx prisma migrate deploy
```

### 問題3: ビルドエラー

**症状**: デプロイ時にビルドが失敗

**解決策**:
```bash
# ログを確認
heroku logs --tail

# Node.jsバージョン確認
heroku config:set NODE_VERSION=18.x

# 依存関係の再インストール
git commit --allow-empty -m "Rebuild"
git push heroku main
```

### 問題4: 環境変数が反映されない

**解決策**:
```bash
# 環境変数を再設定
heroku config:set KEY="VALUE"

# Dynoを再起動
heroku restart
```

---

## 💰 コスト見積もり

### AWS S3
- **ストレージ**: ¥2.80 / GB / 月
- **リクエスト**: PUT ¥0.0047 / 1,000回、GET ¥0.00037 / 1,000回
- **データ転送**: 最初の1GB無料、その後 ¥12.40 / GB

**想定コスト**: ¥500〜¥2,000 / 月（10GB、10,000リクエスト/月）

### Heroku
- **Dyno**: $7〜$25 / 月（Eco〜Basic）
- **PostgreSQL**: $5〜$50 / 月（Essential〜Standard）

**合計**: **約¥2,500〜¥10,000 / 月**

---

## 📚 参考資料

- [Heroku Node.js サポート](https://devcenter.heroku.com/articles/nodejs-support)
- [AWS S3 ドキュメント](https://docs.aws.amazon.com/s3/)
- [Prisma デプロイガイド](https://www.prisma.io/docs/guides/deployment)
- [Next.js デプロイガイド](https://nextjs.org/docs/deployment)

---

## ✅ デプロイ完了チェックリスト

- [ ] AWS S3バケット作成完了
- [ ] IAMユーザー作成・権限設定完了
- [ ] Herokuアプリ作成完了
- [ ] PostgreSQLアドオン追加完了
- [ ] 環境変数設定完了（AWS、Gemini、NextAuth）
- [ ] アプリケーションデプロイ完了
- [ ] データベースマイグレーション完了
- [ ] ファイルアップロード機能テスト完了
- [ ] 本番環境での動作確認完了

---

## 🤝 サポート

問題が発生した場合：

1. **ログを確認**: `heroku logs --tail`
2. **環境変数を確認**: `heroku config`
3. **データベース確認**: `heroku pg:info`
4. **S3アクセス確認**: AWS コンソールでバケットポリシーを確認

---

**注意**: 本番環境では必ず適切なセキュリティ設定を行い、定期的なバックアップを実施してください。
