# HRシステム v1.5.0 デプロイ完全ガイド

## 📋 概要

このドキュメントは、HRシステムのv1.5.0（タスク管理システム修正・雇用形態フィルター修正）を安全にデプロイするための完全な手順書です。過去の失敗事例を踏まえ、段階的なアプローチで確実にデプロイを成功させることを目的としています。

## 🚨 重要な前提条件

### 現在の状況（2025年10月17日時点）
- **本番環境**: v63（v50へのロールバック済み）- 安定版
- **バージョン**: v1.3.9相当
- **状態**: 正常稼働中（43名の社員データが正常に表示）
- **問題**: v1.5.0デプロイ時に重大なエラーが発生

### 過去に発生した問題
1. **社員情報表示エラー**: `Filtered employees count: 0` - 社員が全く表示されない
2. **タスク管理エラー**: ボードデータ取得で500エラー
3. **APIエラー**: 複数のAPIでInternal Server Error
4. **データ構造不整合**: 空のオブジェクトが返される

## 🎯 v1.5.0の新機能・修正内容

### タスク管理システム修正
- ワークスペースAPIの404エラー修正
- カード作成・更新APIの修正
- Prismaスキーマ互換性修正

### 雇用形態フィルター修正
- 雇用形態フィルターの値を実際のデータベースの値に修正
- 「正社員」で検索すると正社員の社員が表示されるように修正

### アバター背景色機能（既存）
雇用形態に応じてアバターの背景色が自動で変更されます：

```typescript
// 背景色の仕様
正社員: '#dbeafe' (青色)
契約社員・派遣社員: '#f5d5d5' (薄い赤色)
業務委託・外注先: '#d1f2d1' (薄い緑色)
パートタイム: '#fff5cc' (薄い黄色)
```

### 変更されたファイル
- `components/ui/avatar.tsx` - AvatarFallbackコンポーネント
- `components/kanban-board.tsx` - タスク管理でのアバター表示
- `components/sidebar.tsx` - サイドバーのアバター表示
- `components/task-detail-dialog.tsx` - タスク詳細ダイアログ
- `app/api/boards/[boardId]/route.ts` - ボードAPI
- `app/api/cards/[cardId]/route.ts` - カードAPI

## 🔧 デプロイ前の準備作業

### 1. 現在の状況確認

```bash
# 現在のリリース状況確認
heroku releases --app hr-system-2025 | head -5

# 本番APIの動作確認
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/employees | head -3

# 現在のバージョン確認
git log --oneline -5
```

### 2. ローカル環境でのテスト

```bash
# ローカルでビルドテスト
npm run build

# ローカルサーバーでの動作確認
npm run dev
```

### 3. データベース構造の確認

**重要**: 本番データベースの実際の構造を確認する必要があります。

```bash
# 本番データベースのカラム構造確認（Ecoプラン制限のため実行できない場合がある）
heroku run "psql \$DATABASE_URL -c \"SELECT column_name FROM information_schema.columns WHERE table_name = 'employees' ORDER BY ordinal_position;\"" --app hr-system-2025
```

## 🚀 段階的デプロイ手順

### Phase 1: スキーマ修正の確認

#### 1.1 PostgreSQLスキーマの修正確認

`prisma/schema-postgres.prisma`で以下の修正が適用されていることを確認：

```prisma
// 自己参照（上司・部下関係）
// managerId             String?
// manager               Employee? @relation("EmployeeHierarchy", fields: [managerId], references: [id])
// subordinates          Employee[] @relation("EmployeeHierarchy")
```

**修正理由**: 本番データベースに`managerId`カラムが存在しないため、スキーマから削除する必要があります。

#### 1.2 修正の確認

```bash
# 修正が適用されているか確認
grep -A 3 -B 1 "managerId" prisma/schema-postgres.prisma
```

### Phase 2: ローカルテスト

#### 2.1 スキーマ切り替えとテスト

```bash
# PostgreSQLスキーマをローカルに適用
cp prisma/schema-postgres.prisma prisma/schema.prisma

# Prismaクライアント再生成
npx prisma generate

# ビルドテスト
npm run build
```

**注意**: ローカルではSQLiteを使用するため、ビルド後に元に戻す必要があります：

```bash
# ローカルスキーマを元に戻す
git checkout prisma/schema.prisma
npx prisma generate
```

### Phase 3: 本番デプロイ

#### 3.1 最終確認

```bash
# 変更内容の確認
git status
git diff

# コミット状況確認
git log --oneline -3
```

#### 3.2 デプロイ実行

```bash
# 変更をコミット（まだの場合）
git add .
git commit -m "fix: v1.5.0デプロイ用のスキーマ修正とタスク管理・雇用形態フィルター修正"

# Herokuにデプロイ
git push heroku main
```

#### 3.3 デプロイ監視

デプロイ中は以下の点を監視：

1. **ビルドプロセス**: エラーが発生していないか
2. **Prismaクライアント生成**: 正常に完了しているか
3. **「見えないTOP」スクリプト**: エラーが発生していないか

### Phase 4: 動作確認

#### 4.1 API動作確認

```bash
# 社員APIの動作確認
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/employees | head -3

# エラーが発生していないか確認
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/employees | grep -i error
```

#### 4.2 フロントエンド確認

1. **社員一覧ページ**: 社員が正常に表示されるか
2. **タスク管理ページ**: ボードが正常に読み込まれるか
3. **アバター表示**: 背景色が雇用形態に応じて変更されているか

#### 4.3 ブラウザコンソール確認

開発者ツールのコンソールで以下を確認：

- `Filtered employees count: 0` が表示されていないか
- 500エラーが発生していないか
- アバターの背景色が正しく適用されているか

## 🚨 緊急時の対応

### 問題が発生した場合の即座の対応

#### 1. ロールバック実行

```bash
# 安定版（v50）に即座にロールバック
heroku rollback v50 --app hr-system-2025

# ロールバック確認
heroku releases --app hr-system-2025 | head -3
```

#### 2. 動作確認

```bash
# API動作確認
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/employees | head -3
```

### よくある問題と解決策

#### 問題1: 社員が表示されない

**症状**: `Filtered employees count: 0`

**原因**: フロントエンドのフィルタリング処理の問題

**解決策**: 
1. ブラウザのキャッシュをクリア
2. フロントエンドのフィルタリングロジックを確認
3. 必要に応じてロールバック

#### 問題2: タスク管理でエラー

**症状**: ボードデータ取得で500エラー

**原因**: サーバーサイドのAPI処理エラー

**解決策**:
1. サーバーログを確認
2. データベース接続を確認
3. 必要に応じてロールバック

#### 問題3: スキーマエラー

**症状**: `managerId`カラムが存在しないエラー

**原因**: PostgreSQLスキーマとデータベースの不整合

**解決策**:
1. スキーマ修正の確認
2. Prismaクライアントの再生成
3. 必要に応じてロールバック

## 📊 成功の判定基準

### デプロイ成功の条件

1. ✅ **API動作**: 社員APIが正常にレスポンスを返す
2. ✅ **フロントエンド表示**: 社員一覧に43名の社員が表示される
3. ✅ **タスク管理**: ボードが正常に読み込まれる
4. ✅ **アバター機能**: 雇用形態に応じた背景色が適用される
5. ✅ **エラーなし**: ブラウザコンソールにエラーが表示されない

### 確認手順

```bash
# 1. API確認
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/employees | jq 'length'

# 2. リリース確認
heroku releases --app hr-system-2025 | head -3

# 3. ログ確認
heroku logs --tail --app hr-system-2025 | head -20
```

## 🔍 トラブルシューティング

### デバッグ用コマンド

```bash
# アプリケーション情報
heroku apps:info --app hr-system-2025

# データベース情報
heroku pg:info --app hr-system-2025

# 環境変数確認
heroku config --app hr-system-2025

# ログ確認
heroku logs --tail --app hr-system-2025

# データベース接続テスト
heroku run "psql \$DATABASE_URL -c 'SELECT COUNT(*) FROM employees;'" --app hr-system-2025
```

### ログの見方

#### 正常なログ
```
Prismaクライアント初期化確認: true
「見えないTOP」社員の自動作成・管理を開始します...
✅ 既存の「見えないTOP」社員を更新しました
🎉 「見えないTOP」社員の自動管理が完了しました！
```

#### 異常なログ
```
❌ エラーが発生しました: PrismaClientKnownRequestError
The column `employees.managerId` does not exist in the current database.
```

## 📝 チェックリスト

### デプロイ前チェック

- [ ] 現在の本番環境が安定状態（v50）であることを確認
- [ ] ローカルでビルドが成功することを確認
- [ ] PostgreSQLスキーマの修正が適用されていることを確認
- [ ] 変更内容をコミット済みであることを確認
- [ ] 緊急時のロールバック手順を理解している

### デプロイ中チェック

- [ ] ビルドプロセスが正常に完了することを確認
- [ ] Prismaクライアント生成が成功することを確認
- [ ] 「見えないTOP」スクリプトが正常に実行されることを確認
- [ ] エラーログが出力されていないことを確認

### デプロイ後チェック

- [ ] 社員APIが正常にレスポンスを返すことを確認
- [ ] 社員一覧に43名の社員が表示されることを確認
- [ ] タスク管理が正常に動作することを確認
- [ ] アバターの背景色が正しく適用されることを確認
- [ ] ブラウザコンソールにエラーが表示されないことを確認

## 🎯 成功のポイント

### 1. 段階的なアプローチ
- 一度にすべてを変更せず、段階的に進める
- 各段階で動作確認を行う

### 2. 緊急時の準備
- ロールバック手順を事前に確認
- 問題発生時の即座の対応を準備

### 3. 十分なテスト
- ローカル環境での事前テスト
- 本番環境での段階的確認

### 4. ログの監視
- デプロイ中のログを注意深く監視
- エラーの早期発見と対応

## 📞 サポート情報

### 重要なリソース

- **アプリケーション**: hr-system-2025
- **URL**: https://hr-system-2025-33b161f586cd.herokuapp.com/
- **安定版**: v50
- **現在のバージョン**: v1.3.9相当

### 緊急連絡先

問題が発生した場合は、このドキュメントの緊急時対応手順に従って、即座にロールバックを実行してください。

---

**作成日**: 2025年10月17日  
**作成者**: AI Assistant  
**対象システム**: HR-system (hr-system-2025)  
**目的**: v1.5.0の安全なデプロイ

このドキュメントを参考に、安全で確実なデプロイを実施してください。不明な点がある場合は、過去の失敗事例を参考に慎重に対応してください。
