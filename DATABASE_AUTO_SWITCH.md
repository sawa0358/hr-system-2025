# 🚨 重要: データベース自動切り替えシステム

## ⚠️ このプロジェクトには自動スキーマ切り替え機能が実装されています

**AIアシスタントへの重要な注意事項:**
このプロジェクトでは、開発環境と本番環境でデータベースが自動的に切り替わります。
スキーマやデータベース関連の質問を受けた際は、必ずこのファイルを参照してください。

---

## 📌 自動切り替えの仕組み

### 開発時（ローカル）
```bash
npm run dev
```
→ **自動的にSQLiteに切り替わります**（手動操作不要）

### デプロイ時（本番）
```bash
git push heroku main
```
→ **自動的にPostgreSQLに切り替わります**（手動操作不要）

---

## 🔄 自動切り替えフロー

### 開発環境（ローカル）
```
npm run dev を実行
    ↓
1. scripts/switch-schema.js dev を自動実行
2. prisma/schema.prisma の provider を "sqlite" に変更
3. Prisma Client を自動再生成
4. DATABASE_URL="file:./prisma/dev.db" を使用
5. Next.js 開発サーバー起動
```

### 本番環境（Heroku）
```
git push heroku main を実行
    ↓
1. scripts/switch-schema.js prod を自動実行
2. prisma/schema.prisma の provider を "postgresql" に変更
3. Prisma Client を自動再生成
4. DATABASE_URL=<Heroku PostgreSQL URL> を使用
5. ビルド・デプロイ
```

---

## 📁 関連ファイル

### 1. package.json
```json
{
  "scripts": {
    "dev": "node scripts/switch-schema.js dev && node scripts/auto-prisma.js && next dev",
    "heroku-postbuild": "node scripts/switch-schema.js prod && npm run build"
  }
}
```

### 2. scripts/switch-schema.js
- 自動的にスキーマのproviderを切り替える
- 開発時: `provider = "sqlite"`
- 本番時: `provider = "postgresql"`

### 3. .env.local（ローカル開発用）
```env
DATABASE_URL="file:./prisma/dev.db"
```

### 4. Heroku環境変数（本番用）
```env
DATABASE_URL="postgresql://..."
```

---

## ❌ やってはいけないこと

### 🚫 ローカルと本番で同じPostgreSQLを使わない
- ローカルでの開発・テストが本番データを直接変更してしまう
- データの削除・更新が本番環境に即座に反映される
- 開発中のバグが本番データを破壊する可能性

### 🚫 手動でスキーマを編集しない
- 自動切り替えシステムが管理しているため、手動編集は不要
- `npm run dev` または `git push heroku main` で自動的に切り替わる

---

## ✅ 開発者が意識すべきこと

### 意識する必要がないこと（自動化済み）
- ✅ スキーマの切り替え
- ✅ Prisma Clientの再生成
- ✅ データベースの種類

### 意識すべきこと
- ⚠️ ローカルと本番でデータは完全に分離されている
- ⚠️ ローカルでのデータ変更は本番に影響しない
- ⚠️ 本番データを確認したい場合は別途アクセス方法が必要

---

## 🔍 トラブルシューティング

### スキーマエラーが出る場合
```bash
# 手動でスキーマを開発用に切り替え
npm run schema:dev

# または本番用に切り替え
npm run schema:prod
```

### データベース接続エラーが出る場合
```bash
# ローカル開発の場合
# .env.local を確認:
DATABASE_URL="file:./prisma/dev.db"

# 本番環境の場合
# Heroku環境変数を確認:
heroku config:get DATABASE_URL
```

---

## 📊 データベース環境の構成

| 環境 | DB種類 | 接続先 | 自動切り替え |
|------|--------|--------|-------------|
| ローカル開発 | SQLite | `./prisma/dev.db` | ✅ 自動 |
| 本番 | PostgreSQL | Heroku PostgreSQL | ✅ 自動 |

---

## 🎯 まとめ

**このプロジェクトでは、開発者はデータベースの種類を意識する必要がありません。**

- `npm run dev` → 自動的にSQLite
- `git push heroku main` → 自動的にPostgreSQL

**スキーマ切り替えは完全に自動化されています。**

---

## 📚 詳細情報

詳細な技術仕様は以下のファイルを参照：
- `.agent/database-environment-strategy.md` - データベース戦略の詳細
- `scripts/switch-schema.js` - 自動切り替えスクリプト
- `start-dev.sh` - ローカル開発用起動スクリプト

---

**最終更新: 2025-12-23**
**バージョン: 3.9.4**
