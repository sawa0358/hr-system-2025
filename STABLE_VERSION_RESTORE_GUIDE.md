# 安定版復元手順書

## 概要
このドキュメントは、安定版（v1.0.0-stable）に戻すための手順を説明します。

## バックアップ情報
- **作成日時**: 2025年10月20日 23:18
- **Gitタグ**: `v1.0.0-stable`
- **データベースバックアップ**: `stable-backup-20251020_231838.sql`
- **状態**: ワークスペース・ボード取得問題解決済み（35個のワークスペースが正常に動作）

## 復元手順

### 1. コードの復元

#### 方法A: Gitタグから復元（推奨）
```bash
# 現在のブランチを確認
git branch

# 安定版タグに切り替え
git checkout v1.0.0-stable

# 新しいブランチを作成（必要に応じて）
git checkout -b restore-stable-version
```

#### 方法B: 特定のコミットから復元
```bash
# コミットハッシュを確認
git log --oneline

# 安定版のコミットに戻る
git checkout 33a5a56  # 安定版のコミットハッシュ
```

### 2. データベースの復元

#### Heroku本番環境への復元
```bash
# 1. 現在のデータベースをバックアップ（安全のため）
heroku run 'pg_dump $DATABASE_URL' -a hr-system-2025 > backup-before-restore-$(date +%Y%m%d_%H%M%S).sql

# 2. 安定版のデータベースを復元
heroku run 'psql $DATABASE_URL' -a hr-system-2025 < stable-backup-20251020_231838.sql

# 3. 復元確認
heroku run 'psql $DATABASE_URL -c "SELECT COUNT(*) FROM workspaces;"' -a hr-system-2025
```

#### ローカル環境への復元
```bash
# 1. ローカルデータベースをバックアップ
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d_%H%M%S)

# 2. PostgreSQLからSQLiteへの変換が必要な場合は、手動でデータを移行
# または、ローカルでPostgreSQLを使用する場合は以下を実行：
# createdb hr_system_local
# psql hr_system_local < stable-backup-20251020_231838.sql
```

### 3. 依存関係の再インストール
```bash
# 依存関係を再インストール
npm install

# Prismaクライアントを再生成
npx prisma generate
```

### 4. 動作確認

#### 本番環境での確認
```bash
# アプリケーションをデプロイ
git push heroku v1.0.0-stable:main

# ログを確認
heroku logs -t -a hr-system-2025

# ワークスペース取得をテスト
curl -H "x-employee-id: cmgnbka6z0001q80l4f83jbzo" https://hr-system-2025-33b161f586cd.herokuapp.com/api/workspaces
```

#### ローカル環境での確認
```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000/tasks にアクセス
# ワークスペースとボードが正常に表示されることを確認
```

## 復元後の状態

### 正常に動作する機能
- ✅ ワークスペース一覧取得（35個）
- ✅ ボード一覧取得
- ✅ 社員一覧取得（43名）
- ✅ 基本的なCRUD操作
- ✅ 認証・認可システム

### 既知の問題
- ⚠️ フロントエンドのレンダリングエラー（`NotFoundError: Failed to execute 'removeChild'`）
  - これはUI表示の問題で、データ取得は正常に動作
  - 別途対応が必要

## トラブルシューティング

### データベース復元でエラーが発生した場合
```bash
# 1. データベース接続を確認
heroku run 'psql $DATABASE_URL -c "SELECT version();"' -a hr-system-2025

# 2. テーブル一覧を確認
heroku run 'psql $DATABASE_URL -c "\dt"' -a hr-system-2025

# 3. 必要に応じてスキーマを再適用
heroku run 'npx prisma db push' -a hr-system-2025
```

### アプリケーションが起動しない場合
```bash
# 1. ログを確認
heroku logs -t -a hr-system-2025

# 2. 環境変数を確認
heroku config -a hr-system-2025

# 3. 依存関係を再インストール
heroku run 'npm install' -a hr-system-2025
```

## 注意事項

1. **データ損失のリスク**: 復元前に必ず現在のデータをバックアップしてください
2. **環境変数**: 復元後、環境変数が正しく設定されていることを確認してください
3. **依存関係**: 古いバージョンに戻す場合、依存関係の互換性に注意してください
4. **フロントエンドエラー**: レンダリングエラーは別途修正が必要です

## 連絡先
問題が発生した場合は、開発チームに連絡してください。

---
**作成日**: 2025年10月20日  
**バージョン**: 1.0  
**対象**: HRシステム安定版復元
