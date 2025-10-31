# ブランチでのDB開発ガイド

## 📝 質問への回答

### Q1: ブランチでDBの構造を変えたら、メインのDBも変わるのか？

**A: はい、変わります。**

同じデータベースファイル（例：`prisma/dev.db`）を使用している場合、`develop`ブランチでマイグレーションを実行すると、実際のデータベースファイルが変更されます。その後、`main`ブランチに切り替えても、**同じデータベースファイルを参照しているため**、DB構造は変更されたままです。

**重要なポイント：**
- Gitブランチは**コード**（Prismaスキーマファイル）を管理します
- 実際の**データベースファイル**はGitで管理されていません
- すべてのブランチが**同じDBファイルを共有**している場合、一方のブランチでDBを変更すると、他方も影響を受けます

### Q2: DBマイグレーションなどで壊れた場合、現在のDB構造に戻れるか？

**A: はい、戻れます。**

バックアップから復元することで、以前のDB構造に戻せます。このガイドでは、安全に復元する方法を説明しています。

**復元方法：**
1. バックアップファイルから復元（推奨）
2. Prismaマイグレーションのロールバック（限定的）
3. データベースのリセット（開発環境のみ）

---

## ⚠️ 重要な理解

### Gitブランチとデータベースの関係

**答え：同じデータベースファイルを使用している場合、ブランチでDB構造を変えると、メインのDBも変わります。**

#### 理由
- Gitブランチは**コード**（Prismaスキーマファイル）を管理します
- 実際の**データベースファイル**（SQLiteファイルなど）はGitで管理されていません
- `develop`ブランチと`main`ブランチは、**同じデータベースファイルを参照**しています

#### 具体例
```bash
# developブランチでマイグレーションを実行
git checkout develop
npx prisma migrate dev --name add_new_field

# この時点で、実際のDBファイル（prisma/dev.db）が変更されます

# mainブランチに戻っても、同じDBファイルを参照しているため
git checkout main
# → DB構造は変更されたままです！
```

---

## ✅ 安全な開発方法

### 方法1: 開発用データベースを分離する（推奨）

ブランチごとに異なるデータベースファイルを使用します。

#### 手順

1. **環境変数ファイルをブランチごとに設定**

```bash
# .env.develop
DATABASE_URL="file:./prisma/dev.db"

# .env.develop-feature
DATABASE_URL="file:./prisma/dev-feature.db"
```

2. **開発用DBをバックアップから作成**

```bash
# 現在のDBをバックアップ
cp prisma/dev.db prisma/dev-main-backup.db

# 開発ブランチ用の新しいDBを作成
cp prisma/dev.db prisma/dev-feature.db
```

3. **マイグレーション前に現在の状態をバックアップ**

```bash
# 現在のDB状態をバックアップ
cp prisma/dev.db prisma/dev-backup-$(date +%Y%m%d_%H%M%S).db
```

---

### 方法2: マイグレーション前に必ずバックアップを取る

#### 手順

1. **マイグレーション前のバックアップ**

```bash
# 現在のデータベースをバックアップ
cp prisma/dev.db prisma/dev-backup-$(date +%Y%m%d_%H%M%S).db

# またはSQLダンプとして保存
npx prisma db execute --stdin < prisma/schema.prisma > backup-$(date +%Y%m%d_%H%M%S).sql
```

2. **マイグレーション実行**

```bash
# 開発ブランチで作業
git checkout develop

# スキーマ変更後、マイグレーション作成・適用
npx prisma migrate dev --name your_migration_name
```

3. **問題が発生した場合の復元**

```bash
# バックアップから復元
cp prisma/dev-backup-YYYYMMDD_HHMMSS.db prisma/dev.db

# Prismaクライアントを再生成
npx prisma generate
```

---

### 方法3: マイグレーション履歴を確認してロールバック

Prismaはマイグレーション履歴を管理しています。

#### マイグレーション状態の確認

```bash
# 適用済みマイグレーションの確認
npx prisma migrate status
```

#### ロールバック方法

```bash
# 方法A: 手動でマイグレーションをロールバック（SQLiteの場合）
# PrismaはSQLiteでマイグレーションの自動ロールバックをサポートしていないため、
# 手動でバックアップから復元する必要があります

# 方法B: マイグレーションをリセット（開発環境のみ）
# ⚠️ 警告：これによりすべてのデータが失われます
npx prisma migrate reset
```

---

## 🔄 実際の作業フロー

### 安全な開発フロー例

```bash
# 1. 現在のDB状態をバックアップ
npm run db:backup
# または直接実行
./scripts/db-backup-before-migration.sh

# 2. 開発ブランチに切り替え
git checkout develop

# 3. スキーマファイルを編集
# prisma/schema.prisma を編集

# 4. マイグレーションを作成（--create-onlyで適用前に確認）
npx prisma migrate dev --create-only --name add_test_field

# 5. マイグレーションファイルを確認
cat prisma/migrations/[timestamp]_add_test_field/migration.sql

# 6. 問題なければマイグレーションを適用
npx prisma migrate dev

# 7. テストを実行
npm test

# 8. 問題が発生した場合
# → バックアップから復元
cp prisma/dev-backup-YYYYMMDD_HHMMSS.db prisma/dev.db
npx prisma generate

# 9. 問題なければ、変更をコミット
git add .
git commit -m "Add new field to Employee model"
```

---

## 🛡️ マイグレーション失敗時の復元手順

### ステップ1: マイグレーション状態の確認

```bash
# 現在のマイグレーション状態を確認
npx prisma migrate status
```

### ステップ2: バックアップからの復元

#### 方法A: 復元スクリプトを使用（推奨）

```bash
# 対話形式でバックアップを選択して復元
npm run db:restore

# または直接実行
./scripts/db-restore-from-backup.sh
```

#### 方法B: 手動で復元

```bash
# バックアップファイルをリストアップ
ls -la prisma/*.db.backup*
ls -la prisma/dev-backup-*.db

# 最新のバックアップを復元
cp prisma/dev-backup-[最新の日時].db prisma/dev.db

# Prismaクライアントを再生成
npx prisma generate
```

### ステップ3: データベースの整合性確認

```bash
# Prisma Studioで確認
npx prisma studio

# または直接SQLで確認（SQLiteの場合）
sqlite3 prisma/dev.db ".schema"
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM employees;"
```

### ステップ4: マイグレーション履歴の修正

```bash
# マイグレーション履歴テーブルを確認（SQLiteの場合）
sqlite3 prisma/dev.db "SELECT * FROM _prisma_migrations;"

# 失敗したマイグレーションを履歴から削除（必要な場合）
# ⚠️ 注意：これは手動操作が必要です
```

---

## 📋 チェックリスト

### マイグレーション前

- [ ] 現在のDBをバックアップしている
- [ ] スキーマ変更内容を確認している
- [ ] マイグレーションSQLを確認している（`--create-only`を使用）
- [ ] テストデータが不要な場合は、テスト環境で試している

### マイグレーション中

- [ ] エラーメッセージを確認している
- [ ] ログを保存している

### マイグレーション後

- [ ] データベース構造が正しいことを確認
- [ ] アプリケーションが正常に動作することを確認
- [ ] 既存データが正しく保持されていることを確認

### 問題発生時

- [ ] バックアップから復元手順を実行
- [ ] 問題の原因を特定
- [ ] 再試行する前に手順を見直し

---

## 🚨 重要な注意事項

1. **本番データベース（Heroku）には影響しません**
   - ローカルの開発DBのみが影響を受けます
   - 本番DBは別のデータベース（PostgreSQL）を使用しています

2. **SQLiteとPostgreSQLの違い**
   - 開発環境：SQLite（`prisma/dev.db`）
   - 本番環境：PostgreSQL（Heroku）
   - スキーマの違いに注意が必要です

3. **マイグレーションファイルはGitで管理**
   - `prisma/migrations/` ディレクトリはGitで管理されています
   - ブランチ間でマイグレーションファイルを共有します

4. **開発ブランチでの作業推奨**
   - `main`ブランチで直接マイグレーションを行わない
   - `develop`ブランチでテストしてから`main`にマージ

---

## 💡 ベストプラクティス

### 1. 定期的なバックアップ

```bash
# 毎日の開発開始前にバックアップ（スクリプト使用）
npm run db:backup

# または手動で
cp prisma/dev.db prisma/dev-backup-$(date +%Y%m%d).db
```

### 2. マイグレーション前の確認

```bash
# マイグレーションSQLを先に確認
npx prisma migrate dev --create-only --name migration_name
cat prisma/migrations/[latest]/migration.sql
```

### 3. スキーマ変更のドキュメント化

- 変更内容をREADMEまたはCHANGELOGに記録
- 理由と影響範囲を明記

### 4. 小さな変更を頻繁に

- 大きなマイグレーションを一度に行わない
- 段階的に変更を加える

---

## 📞 トラブル時の対応

### エラー: "Migration failed"

1. エラーメッセージを確認
2. バックアップから復元
3. スキーマファイルを見直し
4. マイグレーションSQLを手動で確認

### エラー: "Database is not in sync"

```bash
# PrismaとDBの状態を同期
npx prisma db push
# または
npx prisma migrate reset  # ⚠️ データが削除されます
```

### エラー: "Migration history diverged"

```bash
# マイグレーション履歴を確認
npx prisma migrate status

# 必要に応じて履歴を修正
# または、バックアップから復元
```

---

## 🛠️ 便利なコマンド（npm scripts）

プロジェクトには以下の便利なコマンドが用意されています：

```bash
# DBをバックアップ（マイグレーション前）
npm run db:backup

# バックアップから復元（対話形式）
npm run db:restore

# マイグレーション状態を確認
npm run db:status
```

---

## 📚 参考資料

- [Prisma Migrate ドキュメント](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - プロジェクト固有のマイグレーションガイド
- [STABLE_VERSION_RESTORE_GUIDE.md](./STABLE_VERSION_RESTORE_GUIDE.md) - 安定版への復元手順

---

**作成日**: 2025年1月26日  
**対象**: developブランチでの安全なDB開発
