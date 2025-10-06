# 「見えないTOP」機能の本番環境デプロイ手順

## 1. 事前準備

### 環境変数の確認
```bash
# 本番環境のDATABASE_URLが設定されていることを確認
echo $DATABASE_URL
```

### バックアップの作成（重要！）
```bash
# 本番データベースのバックアップを作成
pg_dump $DATABASE_URL > backup_before_invisible_top_$(date +%Y%m%d_%H%M%S).sql
```

## 2. デプロイ手順

### Step 1: コードのデプロイ
```bash
# 最新のコードを本番環境にデプロイ
git push origin main
# または Heroku の場合
git push heroku main
```

### Step 2: データベースマイグレーション
```bash
# 本番環境でマイグレーションを実行
npx prisma migrate deploy
```

### Step 3: 既存データの更新
```bash
# 「見えないTOP」社員にフラグを設定
NODE_ENV=production node scripts/set-invisible-top-production.js
```

### Step 4: 動作確認
1. 本番環境にアクセス
2. 管理者アカウントでログイン
3. 社員情報ページで「見えないTOP」社員が表示されることを確認
4. 一般ユーザーでログインして「見えないTOP」社員が表示されないことを確認
5. 組織図でTOPドロップゾーンが表示されることを確認

## 3. ロールバック手順（問題が発生した場合）

```bash
# バックアップから復元
psql $DATABASE_URL < backup_before_invisible_top_YYYYMMDD_HHMMSS.sql

# または、フラグを無効化
NODE_ENV=production node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.employee.updateMany({
  where: { isInvisibleTop: true },
  data: { isInvisibleTop: false }
}).then(() => {
  console.log('フラグを無効化しました');
  prisma.\$disconnect();
});
"
```

## 4. 確認項目

- [ ] 「見えないTOP」社員が管理者のみに表示される
- [ ] 一般ユーザーには「見えないTOP」社員が表示されない
- [ ] 組織図でTOPドロップゾーンが表示される
- [ ] 「見えないTOP」社員のクリックが無効化されている
- [ ] 他の社員は正常に操作可能

## 5. 注意事項

- 本番環境での実行前に必ずバックアップを取得
- 段階的にデプロイして動作確認を行う
- 問題が発生した場合は即座にロールバック
- ユーザーへの影響を最小限に抑えるため、メンテナンス時間を設定
