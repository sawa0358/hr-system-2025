# HR System - プロジェクト概要

## 🚨 最初に読むべき重要情報

### ⚠️ データベース自動切り替えシステム
**このプロジェクトには自動スキーマ切り替え機能が実装されています。**

詳細は必ず `DATABASE_AUTO_SWITCH.md` を参照してください。

---

## プロジェクト構成

### 技術スタック
- **フレームワーク**: Next.js 14.2.16
- **言語**: TypeScript
- **データベース**: 
  - ローカル開発: SQLite（自動切り替え）
  - 本番環境: PostgreSQL（自動切り替え）
- **ORM**: Prisma
- **デプロイ**: Heroku
- **バージョン**: 3.9.0

### 主要機能
1. 人事管理システム
2. 勤怠管理
3. 有給管理（ロットベース）
4. 業務委託時間管理（WorkClock）
5. タスク管理
6. 組織図管理

---

## 🚀 開発の始め方

### 1. ローカル開発サーバーの起動
```bash
# 推奨: 自動的にSQLiteに切り替わります
npm run dev

# または
./start-dev.sh
```

### 2. デプロイ
```bash
# 自動的にPostgreSQLに切り替わります
git push heroku main
```

---

## 📁 重要なファイル

### 必読ドキュメント
- `DATABASE_AUTO_SWITCH.md` - **データベース自動切り替えの説明（必読）**
- `.agent/database-environment-strategy.md` - データベース戦略の詳細
- `.agent/workclock-modal-ui-fix.md` - 勤務時間記録モーダルのUI修正

### 設定ファイル
- `package.json` - NPMスクリプト（自動切り替え設定含む）
- `prisma/schema.prisma` - データベーススキーマ（自動切り替え対象）
- `.env.local` - ローカル環境変数
- `start-dev.sh` - ローカル開発用起動スクリプト

### スクリプト
- `scripts/switch-schema.js` - **スキーマ自動切り替えスクリプト**
- `scripts/auto-prisma.js` - Prisma自動再生成
- `scripts/auto-create-invisible-top.js` - デプロイ後の自動セットアップ

---

## ⚠️ 注意事項

### データベース関連
1. **ローカルと本番でデータベースは完全に分離されています**
2. **スキーマ切り替えは自動化されています（手動操作不要）**
3. **ローカルでの変更は本番に影響しません**

### 開発フロー
1. ローカルで開発・テスト（SQLite）
2. Gitにコミット
3. Herokuにデプロイ（自動的にPostgreSQLに切り替わる）

---

## 🔧 よく使うコマンド

```bash
# 開発サーバー起動（自動的にSQLiteに切り替え）
npm run dev

# ビルド
npm run build

# Prismaスキーマを手動で開発用に切り替え
npm run schema:dev

# Prismaスキーマを手動で本番用に切り替え
npm run schema:prod

# データベースマイグレーション状態確認
npm run db:status

# デプロイ
git push heroku main
```

---

## 📚 ドキュメント構成

```
.agent/
├── database-environment-strategy.md  # データベース戦略の詳細
├── workclock-modal-ui-fix.md        # WorkClock UI修正
└── workflows/                        # ワークフロー定義

DATABASE_AUTO_SWITCH.md               # データベース自動切り替え（必読）
README.md                             # このファイル
```

---

## 🆘 トラブルシューティング

### データベース接続エラー
→ `DATABASE_AUTO_SWITCH.md` の「トラブルシューティング」セクションを参照

### スキーマエラー
→ `npm run schema:dev` でスキーマを開発用に切り替え

### ビルドエラー
→ `npm run schema:prod` でスキーマを本番用に切り替えてから `npm run build`

---

## 📞 サポート

質問や問題がある場合は、まず以下のドキュメントを確認してください：
1. `DATABASE_AUTO_SWITCH.md` - データベース関連
2. `.agent/database-environment-strategy.md` - 詳細な技術仕様

---

**最終更新: 2025-12-23**
**バージョン: 3.9.0**
