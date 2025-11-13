# HR System v1.9.3 復元ガイド

## 概要
HR System v1.9.3のコードとデータベースを復元する手順を説明します。

## 1. コードの復元方法

### A. 特定のコミットに戻す（推奨）

#### 1. 現在の状態を確認
```bash
# 現在のコミットハッシュを確認
git rev-parse HEAD

# コミット履歴を確認
git log --oneline -10
```

#### 2. 復元したいコミットを特定
```bash
# 例：v1.9.3の最初のコミットに戻す場合
git checkout d8d89b3

# または、特定の日付のコミットを探す
git log --since="2025-10-24" --until="2025-10-25" --oneline
```

#### 3. 新しいブランチを作成して復元
```bash
# 復元用のブランチを作成
git checkout -b restore-to-v1.9.3 d8d89b3

# または、現在のブランチでリセット
git reset --hard d8d89b3
```

### B. タグから復元（タグが設定されている場合）
```bash
# 利用可能なタグを確認
git tag -l

# 特定のタグに戻す
git checkout v1.9.3
```

### C. バックアップファイルから復元
```bash
# プロジェクト全体のバックアップがある場合
tar -xzf hr-system-backup-YYYYMMDD.tar.gz
```

## 2. データベースの復元方法

### A. JSONバックアップから復元（推奨）

#### 1. 利用可能なバックアップを確認
```bash
# バックアップファイル一覧を確認
ls -la backups/auto-backup-*.json*
ls -la current-db-backup-*.json
```

#### 2. 復元スクリプトを実行
```bash
# 最新のバックアップから復元
node scripts/restore-db-v1.9.3.js backups/auto-backup-2025-10-24T15-49-24.json

# または、手動バックアップから復元
node scripts/restore-db-v1.9.3.js current-db-backup-2025-10-24T15-43-08.json
```

### B. SQLiteファイルから復元

#### 1. 既存のDBをバックアップ
```bash
# 現在のDBをバックアップ
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d_%H%M%S)
```

#### 2. バックアップファイルを復元
```bash
# バックアップファイルを復元
cp database-v1.9.3-YYYYMMDD_HHMMSS.db prisma/dev.db
```

### C. SQLダンプから復元

#### 1. 既存のDBを削除
```bash
rm prisma/dev.db
```

#### 2. スキーマを再作成
```bash
npx prisma db push
```

#### 3. SQLダンプを復元
```bash
sqlite3 prisma/dev.db < database-dump-v1.9.3-YYYYMMDD_HHMMSS.sql
```

## 3. 完全復元の手順（コード + DB）

### 手順1: コードの復元
```bash
# 1. 現在の状態をバックアップ
git stash push -m "復元前の状態を保存"

# 2. 復元したいコミットに戻す
git checkout -b restore-$(date +%Y%m%d) d8d89b3

# 3. 依存関係を再インストール
npm install
```

### 手順2: データベースの復元
```bash
# 1. バックアップファイルを確認
ls -la backups/auto-backup-*.json*

# 2. 復元スクリプトを実行
node scripts/restore-db-v1.9.3.js backups/auto-backup-2025-10-24T15-49-24.json

# 3. Prismaクライアントを再生成
npx prisma generate
```

### 手順3: 動作確認
```bash
# 1. アプリケーションを起動
npm run dev

# 2. ブラウザでアクセスして動作確認
# http://localhost:3000
```

## 4. 復元時の注意事項

### A. 事前準備
- 現在の状態を必ずバックアップ
- 復元前にアプリケーションを停止
- 環境変数の設定を確認

### B. 復元後の確認項目
- [ ] アプリケーションが正常に起動する
- [ ] データベースにアクセスできる
- [ ] 社員データが表示される
- [ ] ファイルアップロードが動作する
- [ ] 家族構成データが表示される

### C. トラブルシューティング

#### アプリケーションが起動しない場合
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# Prismaクライアントを再生成
npx prisma generate
```

#### データベースエラーが発生する場合
```bash
# スキーマを再適用
npx prisma db push

# データベースをリセット
npx prisma db push --force-reset
```

#### データが表示されない場合
```bash
# データベースの状態を確認
npx prisma studio

# 復元スクリプトを再実行
node scripts/restore-db-v1.9.3.js [バックアップファイル]
```

## 5. 復元用スクリプト

### 完全復元スクリプト
```bash
#!/bin/bash
# 完全復元スクリプト

echo "🔄 HR System v1.9.3 完全復元を開始します..."

# 1. 現在の状態をバックアップ
echo "💾 現在の状態をバックアップ中..."
git stash push -m "復元前の状態-$(date +%Y%m%d_%H%M%S)"

# 2. コードを復元
echo "📝 コードを復元中..."
git checkout -b restore-$(date +%Y%m%d) d8d89b3

# 3. 依存関係を再インストール
echo "📦 依存関係を再インストール中..."
npm install

# 4. データベースを復元
echo "🗄️  データベースを復元中..."
node scripts/restore-db-v1.9.3.js backups/auto-backup-2025-10-24T15-49-24.json

# 5. Prismaクライアントを再生成
echo "🔨 Prismaクライアントを再生成中..."
npx prisma generate

echo "✅ 完全復元が完了しました！"
echo "🚀 アプリケーションを起動してください: npm run dev"
```

## 6. 復元後のメンテナンス

### A. データの整合性確認
```bash
# データベースの状態を確認
npx prisma studio

# バックアップの整合性を確認
node scripts/export-current-db.js
```

### B. 自動バックアップの設定
```bash
# 自動バックアップを有効化
export AUTO_BACKUP=true

# cronジョブを設定
./scripts/setup-cron-backup.sh
```

## 7. 緊急時の連絡先

### 復元に失敗した場合
1. **現在の状態をバックアップ**
2. **エラーログを保存**
3. **以下の情報を提供**：
   - 復元しようとしたコミットハッシュ
   - 使用したバックアップファイル名
   - エラーメッセージ
   - 実行したコマンド

### 提供する情報
- コミットハッシュ: `d8d89b3` (v1.9.3の最初のコミット)
- バックアップファイル: `backups/auto-backup-2025-10-24T15-49-24.json`
- 復元スクリプト: `scripts/restore-db-v1.9.3.js`

---

**作成日**: 2025年10月24日  
**バージョン**: 1.9.3  
**対象システム**: HR System


