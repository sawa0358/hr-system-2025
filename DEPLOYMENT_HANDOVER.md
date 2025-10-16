# HRシステム デプロイ引き継ぎ書

## 概要
HRシステム（HR-system）のHerokuデプロイに関する問題と解決策の詳細な記録です。このドキュメントは、今後システムのデプロイやメンテナンスを行う際の参考資料として活用してください。

## システム構成

### アプリケーション情報
- **アプリ名**: hr-system-2025
- **Heroku URL**: https://hr-system-2025-33b161f586cd.herokuapp.com/
- **スタック**: heroku-24
- **デプロイ方法**: Git push（従来方式）
- **データベース**: PostgreSQL（本番環境）

### 技術スタック
- **フレームワーク**: Next.js 14.2.16
- **ORM**: Prisma 6.16.3
- **データベース**: 
  - 開発環境: SQLite
  - 本番環境: PostgreSQL
- **Node.js**: 22.x
- **npm**: 10.x

## デプロイ関連ファイル

### 重要なファイル構成
```
├── package.json                    # デプロイ設定
├── Dockerfile                      # Docker設定（使用していない）
├── prisma/
│   ├── schema.prisma              # SQLite用スキーマ（開発環境）
│   └── schema-postgres.prisma     # PostgreSQL用スキーマ（本番環境）
└── scripts/
    └── auto-create-invisible-top.js  # デプロイ後スクリプト
```

### package.jsonの重要な設定
```json
{
  "version": "1.4.0",
  "engines": {
    "node": "22.x",
    "npm": "10.x"
  },
  "scripts": {
    "heroku-postbuild": "cp prisma/schema-postgres.prisma prisma/schema.prisma && npx prisma generate && npm run build",
    "postdeploy": "node scripts/auto-create-invisible-top.js"
  }
}
```

## 発生した問題と解決策

### 問題1: PostgreSQLスキーマの不整合

**問題の詳細:**
- Herokuの本番環境ではPostgreSQLを使用
- 開発環境ではSQLiteを使用
- 両環境でスキーマの違いが存在

**具体的なエラー:**
```
Invalid `prisma.employee.findMany()` invocation:
Unknown field `familyMembers` for include statement on model `Employee`.
The column `employees.privacyMyNumber` does not exist in the current database.
```

**解決策:**
1. `prisma/schema-postgres.prisma`ファイルを作成
2. `package.json`の`heroku-postbuild`スクリプトでスキーマを切り替え
3. 不要なフィールド（`familyMembers`, `privacyMyNumber`）を削除

### 問題2: データベースマイグレーションの競合

**問題の詳細:**
- 本番データベースが既にデータを含んでいる状態でマイグレーション実行
- `P3005`エラー（データベースが空でない）が発生

**解決策:**
```bash
# 既存データベースにベースラインを設定
heroku run npx prisma migrate resolve --applied 20251014193357_init -a hr-system-2025
```

### 問題3: 本番データの上書きリスク

**問題の詳細:**
- デプロイ時に本番データベースが開発データで上書きされる危険性
- `npx prisma migrate deploy`が本番データを変更する可能性

**解決策:**
- `heroku-postbuild`スクリプトから`npx prisma migrate deploy`を削除
- 本番データベースの変更を最小限に抑制

## 現在の安定状態

### 本番環境の状況（v50 - 安定版）
- ✅ **社員データ**: 43名の社員データが正常に存在
- ✅ **API**: 社員一覧取得APIが正常動作
- ✅ **アバター機能**: 雇用形態による背景色分けが適用済み
- ✅ **データベース**: PostgreSQLで正常動作

### アバター背景色の仕様
```typescript
// 雇用形態による背景色
正社員: '#dbeafe' (青色)
契約社員・派遣社員: '#f5d5d5' (薄い赤色)
業務委託・外注先: '#d1f2d1' (薄い緑色)
パートタイム: '#fff5cc' (薄い黄色)
```

## デプロイ手順

### 通常のデプロイ
```bash
# 1. ローカルで変更をコミット
git add .
git commit -m "変更内容の説明"

# 2. Herokuにプッシュ
git push heroku main

# 3. デプロイ確認
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/employees | head -5
```

### 緊急時のロールバック
```bash
# 安定版に戻す
heroku rollback v50 --app hr-system-2025

# ロールバック確認
heroku releases --app hr-system-2025 | head -3
```

### トラブルシューティング

#### 1. 社員データが取得できない場合
```bash
# データベース接続確認
heroku run "psql \$DATABASE_URL -c 'SELECT COUNT(*) FROM employees;'" --app hr-system-2025

# Prismaクライアント再生成
heroku run "npx prisma generate" --app hr-system-2025
```

#### 2. スキーマエラーが発生した場合
```bash
# PostgreSQLスキーマを確認
heroku run "npx prisma db pull --print" --app hr-system-2025 | head -50

# スキーマを手動で更新
heroku run "cp prisma/schema-postgres.prisma prisma/schema.prisma && npx prisma generate" --app hr-system-2025
```

#### 3. アプリケーションが起動しない場合
```bash
# ログを確認
heroku logs --tail --app hr-system-2025

# アプリケーションを再起動
heroku restart --app hr-system-2025
```

## 重要な注意事項

### データベース操作に関する注意
1. **本番データベースの変更は極力避ける**
2. マイグレーションは慎重に実行する
3. デプロイ前に必ずバックアップを取得する

### スキーマ管理に関する注意
1. **開発環境（SQLite）と本番環境（PostgreSQL）のスキーマの違いを常に意識する**
2. 新しいフィールドを追加する際は両方のスキーマを更新する
3. `familyMembers`や`privacyMyNumber`などの古いフィールドは使用しない

### デプロイに関する注意
1. **本番環境へのデプロイは必ずテスト環境で検証してから実行する**
2. デプロイ後は必ずAPIの動作確認を行う
3. 問題が発生した場合は即座にロールバックを検討する

## 緊急連絡先・リソース

### 重要なコマンド集
```bash
# アプリケーション情報確認
heroku apps:info --app hr-system-2025

# リリース履歴確認
heroku releases --app hr-system-2025

# データベース接続確認
heroku pg:info --app hr-system-2025

# 環境変数確認
heroku config --app hr-system-2025
```

### バックアップ手順
```bash
# データベースバックアップ作成
heroku pg:backups:capture --app hr-system-2025

# バックアップ一覧確認
heroku pg:backups --app hr-system-2025

# バックアップからの復元（緊急時のみ）
heroku pg:backups:restore <バックアップURL> --app hr-system-2025
```

## 今後の改善提案

### 1. 開発環境の統一
- 開発環境もPostgreSQLを使用することを検討
- Docker Composeを使用した環境統一

### 2. CI/CDパイプラインの導入
- GitHub Actionsを使用した自動テスト・デプロイ
- ステージング環境の構築

### 3. 監視・アラートの強化
- アプリケーション監視ツールの導入
- エラー通知の自動化

### 4. ドキュメントの充実
- API仕様書の作成
- 運用マニュアルの整備

## まとめ

HRシステムのデプロイは、SQLiteとPostgreSQLのスキーマの違いが主な課題となっています。現在の安定状態（v50）では正常に動作していますが、今後の変更時は以下の点に注意してください：

1. **スキーマの整合性を保つ**
2. **本番データベースの変更を最小限に抑える**
3. **デプロイ前の十分なテスト**
4. **問題発生時の迅速なロールバック**

このドキュメントを参考に、安全で確実なデプロイを実施してください。

---
**作成日**: 2025年10月17日
**最終更新**: 2025年10月17日
**作成者**: AI Assistant
**対象システム**: HR-system (hr-system-2025)