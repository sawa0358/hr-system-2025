# スキーマ管理完全ガイド

## 🎯 問題の解決

開発環境（SQLite）と本番環境（PostgreSQL）のスキーマの違いによるデプロイエラーを根本的に解決するための統一管理システムです。

## 📁 新しいファイル構成

```
prisma/
├── schema-base.prisma      # ベーススキーマ（共通定義）
├── schema.prisma          # 開発環境用（SQLite）
└── schema-postgres.prisma # 本番環境用（PostgreSQL）

scripts/
├── generate-schemas.js    # スキーマ自動生成
└── switch-schema.js       # スキーマ切り替え
```

## 🚀 使用方法

### 1. 開発環境での作業

```bash
# 開発環境用スキーマに切り替え
npm run schema:dev

# 開発サーバー起動
npm run dev
```

### 2. 本番デプロイ前の準備

```bash
# 本番環境用スキーマに切り替え
npm run schema:prod

# ビルドテスト
npm run build
```

### 3. スキーマの同期

```bash
# ベーススキーマから全環境を同期
npm run schema:sync
```

## 🔧 新しいnpmスクリプト

| コマンド | 説明 |
|---------|------|
| `npm run schema:dev` | 開発環境用スキーマ（SQLite）に切り替え |
| `npm run schema:prod` | 本番環境用スキーマ（PostgreSQL）に切り替え |
| `npm run schema:sync` | ベーススキーマから全環境を同期 |
| `npm run deploy:prepare` | 本番デプロイ用の準備（スキーマ切り替え+ビルド） |
| `npm run deploy:dev` | 開発環境用の準備（スキーマ切り替え+開発サーバー） |

## 📝 スキーマ変更の手順

### 1. ベーススキーマを編集

```bash
# prisma/schema-base.prisma を編集
# ここに共通のモデル定義を記述
```

### 2. 全環境に同期

```bash
# 変更を全環境に反映
npm run schema:sync
```

### 3. 開発環境でテスト

```bash
# 開発環境用に切り替え
npm run schema:dev

# 開発サーバーでテスト
npm run dev
```

### 4. 本番デプロイ

```bash
# 本番環境用に切り替え
npm run schema:prod

# ビルドテスト
npm run build

# デプロイ
git add .
git commit -m "feat: 新機能追加"
git push heroku main
```

## 🎯 メリット

### 1. **統一管理**
- 1つのベーススキーマから全環境を自動生成
- スキーマの不整合を防止

### 2. **簡単切り替え**
- 1コマンドで環境別スキーマに切り替え
- 手動でのファイルコピーが不要

### 3. **デプロイ安全性**
- 本番環境用スキーマでの事前ビルドテスト
- スキーマエラーをデプロイ前に発見

### 4. **開発効率**
- 開発環境ではSQLiteで高速動作
- 本番環境ではPostgreSQLで本格運用

## 🚨 重要な注意事項

### 1. ベーススキーマの編集

- **必ず** `prisma/schema-base.prisma` を編集してください
- 環境別スキーマ（`schema.prisma`, `schema-postgres.prisma`）は直接編集しないでください

### 2. デプロイ前の確認

```bash
# 必ず本番環境用スキーマでビルドテストを実行
npm run schema:prod
npm run build
```

### 3. スキーマの同期

- ベーススキーマを変更した後は必ず同期を実行
- `npm run schema:sync` で全環境に反映

## 🔄 移行手順

### 1. 現在のスキーマをベーススキーマに統合

```bash
# 現在のPostgreSQLスキーマをベーススキーマとして使用
cp prisma/schema-postgres.prisma prisma/schema-base.prisma
```

### 2. 全環境を同期

```bash
# 新しいシステムで全環境を生成
npm run schema:sync
```

### 3. 開発環境でテスト

```bash
# 開発環境用に切り替え
npm run schema:dev

# 動作確認
npm run dev
```

## 📊 トラブルシューティング

### 問題1: スキーマ切り替えが失敗する

**解決策**:
```bash
# Prismaクライアントを手動で再生成
npx prisma generate
```

### 問題2: ビルドエラーが発生する

**解決策**:
```bash
# 本番環境用スキーマでビルドテスト
npm run schema:prod
npm run build
```

### 問題3: データベース接続エラー

**解決策**:
```bash
# 環境変数を確認
echo $DATABASE_URL

# 開発環境用に切り替え
npm run schema:dev
```

## 🎉 まとめ

この新しいスキーマ管理システムにより：

1. **開発環境と本番環境のスキーマ不整合が解消**
2. **デプロイ時のスキーマエラーが防止**
3. **開発効率が向上**
4. **メンテナンスが簡単**

今後は `prisma/schema-base.prisma` を編集し、`npm run schema:sync` で全環境に同期するだけで、安全で確実なデプロイが可能になります！

---

**作成日**: 2025年10月17日  
**目的**: 開発・本番環境のスキーマ管理の統一化  
**対象**: HR-system (hr-system-2025)
