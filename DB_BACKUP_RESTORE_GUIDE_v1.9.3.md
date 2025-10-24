# HR System v1.9.3 データベースバックアップ・復元ガイド

## 概要
HR System v1.9.3のデータベースバックアップと復元の手順を説明します。

## バックアップ方法

### 1. 自動バックアップ（推奨）
```bash
# 現在のDBをJSON形式でバックアップ
node scripts/export-current-db.js
```

### 2. 手動バックアップ

#### SQLiteファイルのコピー
```bash
# DBファイルをコピー
cp prisma/dev.db database-v1.9.3-$(date +%Y%m%d_%H%M%S).db

# スキーマファイルをコピー
cp prisma/schema.prisma database-schema-v1.9.3-$(date +%Y%m%d_%H%M%S).prisma
```

#### SQLダンプファイルの作成
```bash
# SQLiteのダンプファイルを作成
sqlite3 prisma/dev.db ".dump" > database-dump-v1.9.3-$(date +%Y%m%d_%H%M%S).sql
```

## 復元方法

### 1. JSONバックアップからの復元（推奨）
```bash
# バックアップファイルを指定して復元
node scripts/restore-db-v1.9.3.js [バックアップファイル名]

# 例
node scripts/restore-db-v1.9.3.js current-db-backup-2025-10-24T15-43-08.json
```

### 2. SQLiteファイルからの復元
```bash
# 既存のDBをバックアップ
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d_%H%M%S)

# バックアップファイルを復元
cp database-v1.9.3-YYYYMMDD_HHMMSS.db prisma/dev.db
```

### 3. SQLダンプからの復元
```bash
# 既存のDBを削除
rm prisma/dev.db

# スキーマを再作成
npx prisma db push

# SQLダンプを復元
sqlite3 prisma/dev.db < database-dump-v1.9.3-YYYYMMDD_HHMMSS.sql
```

## バックアップファイルの種類

### 1. JSONバックアップ（推奨）
- **ファイル名**: `current-db-backup-YYYY-MM-DDTHH-MM-SS.json`
- **内容**: 全テーブルのデータをJSON形式で保存
- **利点**: データの可読性が高く、部分復元が可能
- **作成方法**: `node scripts/export-current-db.js`

### 2. SQLiteファイルバックアップ
- **ファイル名**: `database-v1.9.3-YYYYMMDD_HHMMSS.db`
- **内容**: SQLiteデータベースファイル全体
- **利点**: 完全なデータベース状態を保存
- **作成方法**: `cp prisma/dev.db database-v1.9.3-$(date +%Y%m%d_%H%M%S).db`

### 3. SQLダンプバックアップ
- **ファイル名**: `database-dump-v1.9.3-YYYYMMDD_HHMMSS.sql`
- **内容**: SQL文によるデータベース構造とデータ
- **利点**: テキスト形式で可読性が高い
- **作成方法**: `sqlite3 prisma/dev.db ".dump" > database-dump-v1.9.3-$(date +%Y%m%d_%H%M%S).sql`

### 4. スキーマバックアップ
- **ファイル名**: `database-schema-v1.9.3-YYYYMMDD_HHMMSS.prisma`
- **内容**: Prismaスキーマファイル
- **利点**: データベース構造の変更履歴を追跡
- **作成方法**: `cp prisma/schema.prisma database-schema-v1.9.3-$(date +%Y%m%d_%H%M%S).prisma`

## 復元時の注意事項

### 1. 事前準備
- 既存のデータベースは自動的にバックアップされます
- 復元前にアプリケーションを停止してください
- 復元後はPrismaクライアントを再生成してください

### 2. 復元後の確認
```bash
# Prismaクライアントを再生成
npx prisma generate

# データベースの状態を確認
npx prisma studio
```

### 3. トラブルシューティング

#### 復元に失敗した場合
1. 既存のDBバックアップから復元
2. スキーマファイルを確認
3. データの整合性をチェック

#### データが表示されない場合
1. Prismaクライアントを再生成
2. アプリケーションを再起動
3. ブラウザのキャッシュをクリア

## 自動バックアップの設定

### 定期バックアップスクリプト
```bash
#!/bin/bash
# 毎日午前2時にバックアップを実行
0 2 * * * cd /path/to/hr-system && node scripts/export-current-db.js
```

### Gitフックでのバックアップ
```bash
# pre-commitフックでバックアップ
#!/bin/bash
node scripts/export-current-db.js
git add current-db-backup-*.json
```

## バックアップファイルの管理

### ファイル命名規則
- JSONバックアップ: `current-db-backup-YYYY-MM-DDTHH-MM-SS.json`
- SQLiteバックアップ: `database-v1.9.3-YYYYMMDD_HHMMSS.db`
- SQLダンプ: `database-dump-v1.9.3-YYYYMMDD_HHMMSS.sql`
- スキーマ: `database-schema-v1.9.3-YYYYMMDD_HHMMSS.prisma`

### 保存場所
- プロジェクトルートディレクトリ
- `backups/` ディレクトリ（推奨）
- 外部ストレージ（S3、Google Drive等）

### 保存期間
- 日次バックアップ: 30日間
- 週次バックアップ: 12週間
- 月次バックアップ: 12ヶ月間

## セキュリティ考慮事項

### 1. 機密データの保護
- バックアップファイルには機密情報が含まれます
- 適切なアクセス権限を設定してください
- 暗号化を検討してください

### 2. バックアップファイルの管理
- 不要なバックアップファイルは定期的に削除
- バックアップファイルの整合性を定期的に確認
- 復元テストを定期的に実行

## 関連ファイル

- `scripts/export-current-db.js`: バックアップスクリプト
- `scripts/restore-db-v1.9.3.js`: 復元スクリプト
- `prisma/schema.prisma`: データベーススキーマ
- `prisma/dev.db`: 開発用データベース

## 更新履歴

- **v1.9.3** (2025-10-24): 初版作成
  - リロード後の表示問題修正
  - バックアップ・復元機能の追加
  - 自動化スクリプトの作成

---

**作成日**: 2025年10月24日  
**バージョン**: 1.9.3  
**対象システム**: HR System
