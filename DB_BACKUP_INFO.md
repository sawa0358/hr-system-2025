# データベースバックアップ情報

## 📅 バックアップ作成日時
**作成日**: 2025年10月16日 14:11:47

## 📁 バックアップファイル

### 1. SQLite DBファイル
- **ファイル**: `prisma/prisma/dev.db.backup.20251016_141147`
- **説明**: 現在のSQLiteデータベースの完全バックアップ
- **復元方法**: 
  ```bash
  cp prisma/prisma/dev.db.backup.20251016_141147 prisma/prisma/dev.db
  ```

### 2. JSONエクスポート
- **ファイル**: `current-db-backup-2025-10-16T14-11-47.json`
- **説明**: 全テーブルのデータをJSON形式でエクスポート
- **復元方法**: 専用スクリプトでインポート可能

## 📊 バックアップ内容

| テーブル名 | レコード数 | 説明 |
|-----------|-----------|------|
| employees | 16件 | 社員情報 |
| workspaces | 12件 | ワークスペース |
| boards | 13件 | ボード情報 |
| boardLists | 48件 | ボードリスト |
| cards | 0件 | カード |
| cardMembers | 0件 | カードメンバー |
| tasks | 0件 | タスク |
| evaluations | 0件 | 評価 |
| attendances | 0件 | 勤怠 |
| payrolls | 0件 | 給与 |
| files | 0件 | ファイル |
| folders | 0件 | フォルダ |
| familyMembers | 12件 | 家族情報 |
| activityLogs | 0件 | アクティビティログ |

## 🔄 復元手順

### 方法1: SQLiteファイルから復元
```bash
# 現在のDBをバックアップ
cp prisma/prisma/dev.db prisma/prisma/dev.db.current-backup

# バックアップから復元
cp prisma/prisma/dev.db.backup.20251016_141147 prisma/prisma/dev.db

# 開発サーバーを再起動
npm run dev
```

### 方法2: JSONファイルから復元
```bash
# 専用の復元スクリプトを作成して実行
node scripts/import-db-from-json.js current-db-backup-2025-10-16T14-11-47.json
```

## 📝 注意事項

- このバックアップは **Herokuからの復元後** の状態です
- シードデータが投入された状態のバックアップです
- 本番環境の実際のデータは含まれていません
- 復元前に必ず現在の状態をバックアップしてください

## 🏷️ タグ
- `heroku-restore`
- `seed-data`
- `development-backup`
- `2025-10-16`
