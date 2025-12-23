# データベース環境の分離とスキーマ管理に関する見解

## 質問への回答

### 1. 開発サーバーと本番で同じPostgreSQLを使う場合の影響

**❌ 絶対に避けるべきです！**

#### リスク：
- ✗ ローカルでの開発・テストが本番データを直接変更
- ✗ データの削除・更新が本番環境に即座に反映
- ✗ 開発中のバグが本番データを破壊する可能性
- ✗ 複数の開発者が同じDBを使うと競合・データ破損のリスク
- ✗ テストデータと本番データが混在
- ✗ パフォーマンステストで本番環境に負荷をかける

### 2. スキーマ切り替えを不要にする方法

**✅ 実装済みの解決策（推奨）**

以下の改善により、開発者は**スキーマ切り替えを意識する必要がなくなりました**：

```bash
# 開発時は自動的にSQLiteに切り替わる
npm run dev

# 本番デプロイ時は自動的にPostgreSQLに切り替わる
git push heroku main
```

## 推奨される構成

### データベース環境の分離

```
┌─────────────────┬──────────────┬─────────────────────────┐
│ 環境            │ DB種類       │ 接続先                  │
├─────────────────┼──────────────┼─────────────────────────┤
│ ローカル開発    │ SQLite       │ ローカルファイル        │
│ 本番            │ PostgreSQL   │ Heroku PostgreSQL       │
└─────────────────┴──────────────┴─────────────────────────┘
```

### 自動化された切り替えフロー

#### 開発時（ローカル）
```bash
npm run dev
↓
1. scripts/switch-schema.js dev を実行
2. schema.prisma の provider を "sqlite" に変更
3. Prisma Client を再生成
4. Next.js 開発サーバー起動
```

#### デプロイ時（本番）
```bash
git push heroku main
↓
1. scripts/switch-schema.js prod を実行
2. schema.prisma の provider を "postgresql" に変更
3. Prisma Client を再生成
4. Next.js ビルド
5. Heroku にデプロイ
```

## メリット・デメリット比較

### 現在の構成（SQLite + PostgreSQL分離）

**メリット：**
- ✅ 本番データに影響を与えない（完全分離）
- ✅ 高速な開発サイクル（SQLiteは軽量）
- ✅ オフラインでも開発可能
- ✅ 各開発者が独立した環境を持てる
- ✅ テストデータを自由に作成・削除できる
- ✅ 自動切り替えで開発者は意識不要

**デメリット：**
- ⚠️ PostgreSQL特有の機能のテストができない
- ⚠️ SQLiteとPostgreSQLの微妙な挙動の違い

### 代替案1: ローカルでもPostgreSQLを使う

**メリット：**
- ✅ 本番と同じ環境でテスト可能
- ✅ PostgreSQL特有の機能を使える

**デメリット：**
- ❌ Docker等の追加セットアップが必要
- ❌ 起動が遅い
- ❌ メモリ使用量が多い
- ❌ オフライン開発ができない
- ❌ 各開発者がPostgreSQLサーバーを管理する必要

### 代替案2: ローカルと本番で同じPostgreSQLを共有

**メリット：**
- ✅ セットアップが簡単

**デメリット：**
- ❌❌❌ **本番データが破壊されるリスク（致命的）**
- ❌ 複数開発者での競合
- ❌ テストデータと本番データが混在
- ❌ パフォーマンステストで本番に影響

## 結論と推奨事項

### ✅ 現在の構成を維持することを強く推奨

理由：
1. **安全性**: 本番データを保護
2. **効率性**: 高速な開発サイクル
3. **独立性**: 各開発者が独立した環境
4. **自動化**: スキーマ切り替えが自動化済み

### 実装済みの改善点

#### 1. 自動スキーマ切り替え
```json
// package.json
"dev": "node scripts/switch-schema.js dev && node scripts/auto-prisma.js && next dev"
```

開発者は`npm run dev`を実行するだけで、自動的にSQLiteに切り替わります。

#### 2. デプロイ時の自動切り替え
```json
// package.json
"heroku-postbuild": "node scripts/switch-schema.js prod && npm run build"
```

Herokuへのデプロイ時に自動的にPostgreSQLに切り替わります。

#### 3. ローカル開発用スクリプト
```bash
# start-dev.sh も引き続き使用可能
./start-dev.sh
```

### 開発者が意識すべきこと

**意識する必要がないこと：**
- ✅ スキーマの切り替え（自動化済み）
- ✅ Prisma Clientの再生成（自動化済み）
- ✅ データベースの種類（透過的に処理）

**意識すべきこと：**
- ⚠️ ローカルと本番でデータは完全に分離されている
- ⚠️ ローカルでのデータ変更は本番に影響しない
- ⚠️ 本番データを確認したい場合は別途アクセス方法が必要

## PostgreSQL特有機能が必要な場合

もしPostgreSQL特有の機能（全文検索、JSON型の高度な操作など）をテストする必要がある場合：

### オプション: Docker Composeでローカル PostgreSQL

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: hr_system_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

使用方法：
```bash
# PostgreSQLが必要な場合のみ
docker-compose up -d
export DATABASE_URL="postgresql://dev:dev@localhost:5432/hr_system_dev"
npm run dev
```

## まとめ

**現在の構成（SQLite開発 + PostgreSQL本番）が最適です。**

- ✅ 安全性が最優先
- ✅ 開発効率が高い
- ✅ 自動化により開発者の負担なし
- ✅ 必要に応じてローカルPostgreSQLも追加可能

**スキーマ切り替えは完全に自動化されているため、開発者は意識する必要がありません。**
