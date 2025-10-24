# descriptionフィールド問題の引き継ぎ書

## 問題の概要

HRシステムで社員データの作成・更新時に`description`フィールドに関するエラーが発生している。

### エラー内容
```
PrismaClientValidationError: Unknown argument `description`. Available options are marked with ?.
```

## 問題の原因

1. **スキーマの不整合**: Prismaスキーマ（`prisma/schema.prisma`）には`description`フィールドが定義されていない
2. **APIコードの残存**: 複数のAPIエンドポイントで`description`フィールドが使用されている
3. **Prismaクライアントのキャッシュ**: 古いスキーマがキャッシュされている可能性

## 影響範囲

### 影響を受けるAPIエンドポイント
- `POST /api/employees` - 新規社員作成
- `PUT /api/employees/[id]` - 社員情報更新
- `POST /api/employees/[id]/copy` - 社員コピー

### 影響を受ける機能
- 社員の新規登録
- 社員情報の編集
- 社員データのコピー
- バックアップデータの復元

## 現在の状況

### ローカル環境
- `description`フィールドをAPIコードから削除済み
- Prismaクライアント再生成済み
- しかし、まだエラーが発生している
- ログでは`description: null`が表示されている

### 本番環境（Heroku）
- 同じ問題が発生する可能性が高い
- ログインは成功しているが、社員データの操作でエラーが発生

## 必要な対応

### 1. コードの完全な修正
以下のファイルで`description`フィールドの使用を完全に削除する必要がある：

```typescript
// app/api/employees/route.ts
// app/api/employees/[id]/route.ts  
// app/api/employees/[id]/copy/route.ts
```

### 2. Prismaクライアントの完全な再生成
```bash
# ローカル環境
rm -rf node_modules/.prisma
npx prisma generate

# 本番環境（Heroku）
heroku run npx prisma generate --app hr-system-2025
```

### 3. キャッシュのクリア
```bash
# ローカル環境
rm -rf .next
npm run dev

# 本番環境
heroku restart --app hr-system-2025
```

## 調査が必要な箇所

### 1. スプレッド構文の影響
APIコードで`...employee`のようなスプレッド構文を使用している箇所で、`description`フィールドが含まれている可能性がある。

### 2. データベースの実際のスキーマ
- ローカル（SQLite）と本番（PostgreSQL）でスキーマが異なる可能性
- 実際のデータベースに`description`カラムが存在する可能性

### 3. フロントエンドからの送信データ
フロントエンドから`description`フィールドが送信されている可能性がある。

## 推奨される解決手順

### ステップ1: コードの完全な確認
```bash
# descriptionフィールドの使用箇所を検索
grep -r "description" app/api/ --include="*.ts"
```

### ステップ2: データベーススキーマの確認
```bash
# ローカル環境
npx prisma db pull
npx prisma generate

# 本番環境
heroku run npx prisma db pull --app hr-system-2025
heroku run npx prisma generate --app hr-system-2025
```

### ステップ3: 段階的なテスト
1. ローカル環境で完全に動作することを確認
2. 本番環境にデプロイ
3. 本番環境でテスト

## 緊急時の対応

### 一時的な回避策
`description`フィールドをスキーマに追加する：
```prisma
model Employee {
  // ... 既存のフィールド
  description String?  // 一時的に追加
}
```

### ロールバック
問題が解決しない場合は、前のコミットにロールバック：
```bash
git log --oneline
git reset --hard <前のコミットハッシュ>
git push heroku main --force
```

## 関連ファイル

- `prisma/schema.prisma` - メインスキーマ
- `prisma/schema-postgres.prisma` - PostgreSQL用スキーマ
- `app/api/employees/route.ts` - 社員API
- `app/api/employees/[id]/route.ts` - 社員詳細API
- `app/api/employees/[id]/copy/route.ts` - 社員コピーAPI

## 注意事項

- 本番環境でのデータ損失を避けるため、十分なテストが必要
- バックアップデータの復元も同様の問題に直面する可能性
- フロントエンドのコードも確認が必要

## 作成日時
2025年10月24日

## 作成者
AI Assistant
