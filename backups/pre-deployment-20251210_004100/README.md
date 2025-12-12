# デプロイ前フルバックアップ
**作成日時**: 2025年12月10日 00:41

## バックアップ内容

### ✅ 完了済み
1. **ローカルSQLiteデータベース** - `local-dev.db` (600KB)
2. **ローカルスキーマSQL** - `local-schema.sql` (26KB)
3. **Prismaスキーマファイル** (全3種類)
   - `schema.prisma` (28KB)
   - `schema-base.prisma` (28KB)
   - `schema-postgres.prisma` (28KB)
4. **Git履歴** - `git-log.txt` (直近20コミット)
5. **最近の変更差分** - `recent-changes.diff` (24KB)
6. **package.json** - `package.json` (4KB)

### ⏳ 手動実行が必要
7. **本番PostgreSQLバックアップ** - 以下のコマンドを別ターミナルで実行してください：
   ```bash
   heroku pg:backups:capture --app kanae-hr
   heroku pg:backups:download --app kanae-hr --output backups/pre-deployment-20251210_004100/heroku-production.dump
   ```

## デプロイ予定の変更内容

### 源泉徴収機能
- ワーカーに「源泉徴収対象」フラグを追加
- 設定画面で源泉徴収率を管理（100万円以下/超）
- PDF請求書に源泉徴収額を計算・表示

### チーム管理の永続化
- チーム情報をMasterDataテーブルに保存（PostgreSQL永続保存）
- 従来のワーカー紐付けとの互換性を維持

### UIの改善
- 税率設定を折りたたみ式に変更（コンパクト表示）
- パスワード保護機能を税率設定にも適用

## 復元方法

### ローカル環境
```bash
cp backups/pre-deployment-20251210_004100/local-dev.db prisma/prisma/dev.db
npx prisma generate
```

### 本番環境（慎重に！）
```bash
heroku pg:backups:restore backups/pre-deployment-20251210_004100/heroku-production.dump DATABASE_URL --app kanae-hr
```

## 注意事項
- デプロイ前に必ず本番環境のバックアップを完了させること
- 新しいマイグレーションは`withholdingTaxEnabled`カラムの追加のみ
- 既存データへの影響はなし（デフォルト値: false）


