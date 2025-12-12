# HR System v1.9.3 自動バックアップ設定ガイド

## 概要
HR System v1.9.3の自動バックアップ機能の設定方法と使用方法を説明します。

## 自動バックアップの保存場所

### 1. バックアップディレクトリ
- **場所**: `backups/` ディレクトリ
- **形式**: 圧縮されたJSONファイル（.json.gz）
- **命名規則**: `auto-backup-YYYY-MM-DDTHH-MM-SS.json.gz`

### 2. バックアップファイルの種類
- **データベースバックアップ**: `auto-backup-*.json.gz`
- **スキーマバックアップ**: `schema-backup-*.prisma`
- **手動バックアップ**: `current-db-backup-*.json`

## 自動バックアップの設定方法

### A. コードに埋め込む方法（推奨）

#### 1. 環境変数の設定
`.env` ファイルに以下を追加：

```bash
# 自動バックアップ設定
AUTO_BACKUP=true
NEXT_PUBLIC_AUTO_BACKUP=true
```

#### 2. アプリケーション起動時の自動バックアップ
- `lib/auto-backup.ts`: 自動バックアップ管理クラス
- `components/auto-backup-provider.tsx`: Reactコンテキストプロバイダー
- `app/api/backup/route.ts`: バックアップAPIエンドポイント

#### 3. 自動実行タイミング
- **アプリケーション起動時**: 最後のバックアップから1時間以上経過している場合
- **社員データ更新時**: 設定で有効化した場合
- **ファイルアップロード時**: 設定で有効化した場合
- **定期実行**: cronジョブで設定

### B. cronジョブでの定期バックアップ

#### 1. 設定スクリプトの実行
```bash
# 定期バックアップ設定スクリプトを実行
./scripts/setup-cron-backup.sh
```

#### 2. 設定オプション
- **毎日午前2時**: `0 2 * * *`
- **毎日午前2時と午後2時**: `0 2,14 * * *`
- **毎時**: `0 * * * *`（開発用）
- **カスタム設定**: 任意のcronスケジュール

#### 3. ログの確認
```bash
# バックアップログを確認
tail -f logs/backup.log
```

## 一般的な自動バックアップの設定

### 1. 本番環境での推奨設定

#### 環境変数
```bash
AUTO_BACKUP=true
NEXT_PUBLIC_AUTO_BACKUP=true
AUTO_BACKUP_CONFIG='{"enabled":true,"backupDir":"backups","retentionDays":30,"maxBackups":50,"compress":true,"triggers":{"onStartup":true,"onEmployeeUpdate":false,"onFileUpload":false,"onDaily":true}}'
```

#### cronジョブ
```bash
# 毎日午前2時にバックアップ
0 2 * * * cd /path/to/hr-system && node scripts/auto-backup.js >> logs/backup.log 2>&1
```

### 2. 開発環境での推奨設定

#### 環境変数
```bash
AUTO_BACKUP=false
NEXT_PUBLIC_AUTO_BACKUP=false
```

#### 手動バックアップ
```bash
# 必要に応じて手動実行
node scripts/auto-backup.js
```

## データベース構成の自動バックアップ

### 1. スキーマの自動バックアップ
- **ファイル**: `schema-backup-*.prisma`
- **内容**: Prismaスキーマファイル
- **実行タイミング**: データベースバックアップと同時

### 2. データベース構造のバックアップ
- **SQLiteファイル**: `database-v1.9.3-*.db`
- **SQLダンプ**: `database-dump-v1.9.3-*.sql`
- **JSON形式**: `auto-backup-*.json.gz`

### 3. 復元時の構成復元
```bash
# スキーマファイルから復元
cp backups/schema-backup-*.prisma prisma/schema.prisma
npx prisma db push

# データベースファイルから復元
cp backups/database-v1.9.3-*.db prisma/dev.db

# JSONバックアップから復元
node scripts/restore-db-v1.9.3.js backups/auto-backup-*.json
```

## バックアップの管理

### 1. 自動クリーンアップ
- **保持期間**: 30日間（設定可能）
- **最大ファイル数**: 50個（設定可能）
- **圧縮**: 有効（設定可能）

### 2. バックアップ状態の確認
```bash
# API経由で状態確認
curl http://localhost:3000/api/backup/status

# ファイル一覧確認
ls -la backups/
```

### 3. 手動バックアップ
```bash
# 即座にバックアップ実行
node scripts/auto-backup.js

# API経由でバックアップ実行
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"reason":"manual"}'
```

## セキュリティ考慮事項

### 1. バックアップファイルの保護
- **アクセス権限**: 適切なファイル権限を設定
- **暗号化**: 機密データの場合は暗号化を検討
- **外部保存**: S3、Google Drive等への保存を推奨

### 2. 環境変数の管理
- **本番環境**: 環境変数で設定を管理
- **開発環境**: ローカル設定ファイルを使用
- **機密情報**: 環境変数に含めない

## トラブルシューティング

### 1. バックアップが実行されない
- 環境変数 `AUTO_BACKUP=true` が設定されているか確認
- バックアップディレクトリの書き込み権限を確認
- ログファイル `logs/backup.log` を確認

### 2. バックアップファイルが大きすぎる
- 圧縮設定を有効化
- 保持期間を短縮
- 不要なデータの除外を検討

### 3. 復元に失敗する
- バックアップファイルの整合性を確認
- スキーマファイルの互換性を確認
- データベースの初期化を実行

## 関連ファイル

- `scripts/auto-backup.js`: 自動バックアップスクリプト
- `scripts/setup-cron-backup.sh`: cronジョブ設定スクリプト
- `lib/auto-backup.ts`: 自動バックアップ管理クラス
- `components/auto-backup-provider.tsx`: Reactプロバイダー
- `app/api/backup/route.ts`: バックアップAPI
- `app/api/backup/status/route.ts`: バックアップ状態API
- `ENV_AUTO_BACKUP_EXAMPLE.md`: 環境変数設定例

## 更新履歴

- **v1.9.3** (2025-10-24): 初版作成
  - 自動バックアップ機能の実装
  - cronジョブ設定スクリプトの追加
  - APIエンドポイントの作成
  - 環境変数設定の追加

---

**作成日**: 2025年10月24日  
**バージョン**: 1.9.3  
**対象システム**: HR System














