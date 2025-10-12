# 🚀 デプロイ前チェックリスト

このチェックリストを使用して、本番環境へのデプロイをスムーズに行いましょう。

---

## ✅ デプロイ前準備

### 1. AWS S3 セットアップ

- [ ] **S3バケット作成完了**
  - バケット名: `hr-system-files-____`（ユニークな名前）
  - リージョン: `ap-northeast-1`（東京）
  - パブリックアクセス: すべてブロック
  - バージョニング: 有効化
  - 暗号化: 有効化（SSE-S3）

- [ ] **IAMユーザー作成完了**
  - ユーザー名: `hr-system-s3-user`
  - アクセスタイプ: プログラムによるアクセス
  - S3アクセスポリシーをアタッチ済み
  - アクセスキーID保存済み: `AKIA...`
  - シークレットアクセスキー保存済み: `wJalr...`

- [ ] **S3バケットの権限テスト完了**
  ```bash
  # AWS CLIでテスト
  aws s3 ls s3://your-bucket-name --region ap-northeast-1
  ```

### 2. Heroku セットアップ

- [ ] **Heroku CLIインストール済み**
  ```bash
  heroku --version
  ```

- [ ] **Herokuにログイン済み**
  ```bash
  heroku login
  ```

- [ ] **Herokuアプリ作成済み**
  ```bash
  heroku create your-hr-app-name
  ```

- [ ] **PostgreSQLアドオン追加済み**
  ```bash
  heroku addons:create heroku-postgresql:essential-0
  ```

### 3. 環境変数準備

- [ ] **AWS認証情報を準備**
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_S3_BUCKET_NAME`

- [ ] **Gemini APIキーを準備**
  - `GEMINI_API_KEY`

- [ ] **NextAuthシークレットを生成**
  ```bash
  openssl rand -base64 32
  ```
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`

### 4. コードの準備

- [ ] **最新のコードをコミット**
  ```bash
  git status
  git add .
  git commit -m "Production deployment with S3"
  ```

- [ ] **ビルドエラーがないか確認**
  ```bash
  npm run build
  ```

- [ ] **依存関係が最新か確認**
  ```bash
  npm audit
  npm outdated
  ```

---

## 🚀 デプロイ実行

### 1. 環境変数をHerokuに設定

```bash
# AWS S3設定
heroku config:set \
  AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY" \
  AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY" \
  AWS_REGION="ap-northeast-1" \
  AWS_S3_BUCKET_NAME="your-bucket-name"

# Gemini AI設定
heroku config:set GEMINI_API_KEY="YOUR_GEMINI_KEY"

# NextAuth設定
heroku config:set \
  NEXTAUTH_SECRET="YOUR_SECRET" \
  NEXTAUTH_URL="https://your-app-name.herokuapp.com"
```

- [ ] **環境変数設定完了**
  ```bash
  heroku config
  ```

### 2. デプロイ

```bash
# Herokuリモートを追加
heroku git:remote -a your-hr-app-name

# デプロイ実行
git push heroku main
```

- [ ] **デプロイ成功**
  ```bash
  heroku logs --tail
  ```

### 3. データベースセットアップ

```bash
# Prismaマイグレーション
heroku run npx prisma migrate deploy

# 初期データ投入
heroku run npx prisma db seed
```

- [ ] **データベースマイグレーション完了**
- [ ] **シードデータ投入完了**

---

## 🧪 デプロイ後テスト

### 1. 基本動作確認

- [ ] **アプリケーションにアクセス可能**
  - URL: `https://your-app-name.herokuapp.com`

- [ ] **ログイン機能が動作**
  - テストユーザーでログイン
  - ログアウト

- [ ] **ダッシュボード表示正常**
  - 各メニューが表示される
  - データが正常に読み込まれる

### 2. ファイルアップロード機能テスト

- [ ] **ファイルアップロード成功**
  - 社員ページからプロフィール画像アップロード
  - タスクページからファイル添付

- [ ] **ファイルダウンロード成功**
  - アップロードしたファイルをダウンロード
  - 正しいファイルが取得できる

- [ ] **S3バケットにファイルが保存されている**
  - AWS コンソールでS3バケットを確認
  - 正しいフォルダ構造で保存されている

### 3. カンバンボード機能テスト

- [ ] **カードの作成成功**
- [ ] **カードのドラッグ&ドロップ動作**
- [ ] **カードの編集・削除動作**

### 4. パフォーマンステスト

- [ ] **ページ読み込み速度確認**（3秒以内）
- [ ] **カンバン操作の応答速度確認**（1秒以内）
- [ ] **ファイルアップロード速度確認**

---

## 📊 監視設定

### 1. ログ確認

```bash
# リアルタイムログ
heroku logs --tail

# エラーログ
heroku logs --tail | grep ERROR
```

- [ ] **エラーログに異常がない**

### 2. パフォーマンスメトリクス

```bash
# Dynoの状態
heroku ps

# データベース情報
heroku pg:info
```

- [ ] **Dynoが正常稼働**
- [ ] **データベース接続が正常**

---

## 🔒 セキュリティ確認

- [ ] **すべての環境変数が設定済み**
  ```bash
  heroku config
  ```

- [ ] **S3バケットがパブリックアクセスブロック**
  - AWS コンソールで確認

- [ ] **HTTPSが有効**
  - ブラウザで鍵マークを確認

- [ ] **管理者権限が適切に設定**
  - 一般ユーザーが管理機能にアクセスできない

---

## 📦 既存データ移行（オプション）

開発環境から本番環境にデータを移行する場合：

### 1. ファイル移行

```bash
# ローカルファイルをS3に移行
node scripts/migrate-files-to-s3.js
```

- [ ] **ファイル移行スクリプト実行完了**
- [ ] **移行結果確認（成功/失敗件数）**
- [ ] **S3バケットにファイルが存在する**

### 2. データベース移行

```bash
# ローカルのデータをエクスポート
npx prisma db pull
npx prisma db push --force-reset

# または手動でSQLダンプ
```

- [ ] **データベース移行完了**（該当する場合）

---

## 🎯 本番運用開始

### 最終確認

- [ ] **すべての機能が正常動作**
- [ ] **テストユーザーでの動作確認完了**
- [ ] **本番ユーザーへの案内準備完了**
- [ ] **バックアップ設定完了**
  ```bash
  heroku pg:backups:capture
  ```

### ドキュメント確認

- [ ] **README.md が最新**
- [ ] **デプロイガイドが正確**
- [ ] **環境変数テンプレートが正確**

### チーム連携

- [ ] **デプロイ完了をチームに通知**
- [ ] **ログイン情報を共有**
- [ ] **トラブルシューティングガイドを共有**

---

## 🚨 ロールバック手順（緊急時）

問題が発生した場合の対処法：

### 1. 前のバージョンにロールバック

```bash
# リリース履歴を確認
heroku releases

# 前のバージョンにロールバック
heroku rollback v前のバージョン番号
```

### 2. ログを確認

```bash
heroku logs --tail
```

### 3. データベースを復元

```bash
# バックアップから復元
heroku pg:backups:restore
```

---

## 📝 デプロイ完了報告テンプレート

```
【デプロイ完了報告】

■ デプロイ日時: YYYY/MM/DD HH:MM
■ デプロイ担当者: 〇〇
■ アプリケーションURL: https://your-app-name.herokuapp.com

■ デプロイ内容:
- AWS S3統合完了
- ファイルアップロード機能をS3に移行
- データベースマイグレーション実施

■ テスト結果:
✅ ログイン機能
✅ ファイルアップロード
✅ ファイルダウンロード
✅ カンバンボード操作
✅ パフォーマンス確認

■ 注意事項:
- ファイルは全てS3に保存されます
- アップロードサイズ上限: 10MB
- 対応ファイル形式: PDF, 画像, Office文書

■ 次回のアクション:
- 本番運用開始
- ユーザーフィードバック収集
- パフォーマンス監視
```

---

## ✅ デプロイ完了！

すべてのチェック項目が完了したら、本番運用を開始できます。

**お疲れさまでした！ 🎉**

