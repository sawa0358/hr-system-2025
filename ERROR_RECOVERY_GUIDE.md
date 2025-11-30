# エラー発生時の復元ガイド

## 📋 概要

このドキュメントは、マイグレーションやデータベース操作中にエラーが発生した場合の復元手順を説明します。

## 🚨 エラーが発生した場合の伝え方

エラーが発生した場合は、以下の情報を提供してください：

### 1. **バックアップのタイムスタンプ**
バックアップ実行時に表示された日時（例：`20251111_123456`）をメモしてください。

```
例：タイムスタンプ: 20251111_143022
```

### 2. **エラーメッセージ**
表示されたエラーメッセージ全体をコピーしてください。

```
例：
Error: Migration failed
  at runMigration (/path/to/file.js:123)
  Caused by: column "xxx" does not exist
```

### 3. **実行したコマンド**
エラーが発生する直前に実行したコマンドを記録してください。

```
例：
npx prisma migrate deploy
または
node scripts/some-migration-script.js
```

### 4. **エラーが発生した時刻**
エラーが発生した時刻を記録してください。

```
例：2025年11月11日 14:35
```

### 5. **現在の状況**
- アプリケーションは起動していますか？
- データベースにアクセスできますか？
- ユーザーへの影響はありますか？

## 📝 エラー報告テンプレート

以下のテンプレートをコピーして、情報を記入してください：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
エラー報告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【バックアップ情報】
タイムスタンプ: （例：20251111_143022）
バックアップディレクトリ: production_data_backup

【エラー内容】
実行したコマンド:
（ここにコマンドを記載）

エラーメッセージ:
（ここにエラーメッセージを貼り付け）

エラー発生時刻: （例：2025年11月11日 14:35）

【現在の状況】
- アプリケーション起動: □ 可能 / □ 不可
- データベースアクセス: □ 可能 / □ 不可  
- ユーザーへの影響: □ あり / □ なし

【その他の情報】
（気づいたことがあれば記載）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔧 自分で復元を試みる場合

### ステップ1: 落ち着いて状況を確認

```bash
# アプリケーションの状態を確認
heroku ps --app hr-system-2025

# データベースの状態を確認
heroku pg:info --app hr-system-2025

# 最新のログを確認
heroku logs --tail --app hr-system-2025
```

### ステップ2: バックアップファイルを確認

```bash
# バックアップファイルの一覧を表示
ls -lht production_data_backup/

# 最新のフルバックアップを確認
ls -lht production_data_backup/production-full-backup-*.sql | head -1
```

### ステップ3: 復元スクリプトを実行

⚠️ **注意**: 復元する前に、必ず最新のバックアップを別の場所にコピーしてください！

```bash
# 最新のバックアップファイルのパスをコピー
# 例：production_data_backup/production-full-backup-20251111_143022.sql

# 復元スクリプトを実行（タイムスタンプを実際のものに置き換えてください）
./scripts/restore-production-from-backup.sh production_data_backup/production-full-backup-YYYYMMDD_HHMMSS.sql
```

### ステップ4: アプリケーションを再起動

```bash
# Herokuアプリを再起動
heroku restart --app hr-system-2025

# ログを監視
heroku logs --tail --app hr-system-2025
```

### ステップ5: 動作確認

1. ブラウザでアプリケーションにアクセス
2. ログインできるか確認
3. 社員一覧が表示されるか確認
4. データが正しく表示されるか確認

## 🆘 緊急時の連絡方法

復元がうまくいかない場合や不安な場合は、以下の情報を添えてすぐに連絡してください：

1. **バックアップのタイムスタンプ**
2. **エラーメッセージ全文**
3. **実行したコマンド**
4. **上記のエラー報告テンプレート**

## 📚 関連コマンド一覧

### バックアップ確認
```bash
# 最新のバックアップファイルを表示
ls -lht production_data_backup/ | head -10

# バックアップ情報ファイルを確認
cat production_data_backup/backup-info-*.txt
```

### Heroku関連
```bash
# Herokuにログイン
heroku login

# アプリの状態確認
heroku ps --app hr-system-2025

# データベース情報確認
heroku pg:info --app hr-system-2025

# ログ確認
heroku logs --tail --app hr-system-2025

# アプリ再起動
heroku restart --app hr-system-2025
```

### データベース確認
```bash
# データベースに接続
heroku pg:psql --app hr-system-2025

# テーブル一覧を表示（psql接続後）
\dt

# 特定のテーブルのデータ件数を確認（psql接続後）
SELECT COUNT(*) FROM "Employee";
```

## ⚡ よくある問題と解決方法

### 問題1: 「permission denied」エラー

```bash
# スクリプトに実行権限を付与
chmod +x scripts/restore-production-from-backup.sh
```

### 問題2: 「heroku command not found」

```bash
# Heroku CLIをインストール
brew tap heroku/brew && brew install heroku

# またはnpmでインストール
npm install -g heroku
```

### 問題3: 「psql command not found」

```bash
# PostgreSQLクライアントをインストール（Mac）
brew install postgresql
```

### 問題4: データベース接続エラー

```bash
# Herokuにログインしているか確認
heroku auth:whoami

# ログインしていない場合
heroku login

# データベースURLを確認
heroku config:get DATABASE_URL --app hr-system-2025
```

## 📞 サポート情報

- **バックアップディレクトリ**: `production_data_backup/`
- **復元スクリプト**: `scripts/restore-production-from-backup.sh`
- **Herokuアプリ名**: `hr-system-2025`
- **このガイド**: `ERROR_RECOVERY_GUIDE.md`

---

**最終更新**: 2025年11月11日  
**バージョン**: 1.0.0




