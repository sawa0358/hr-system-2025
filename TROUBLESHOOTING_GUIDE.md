# HRシステム トラブルシューティング完全ガイド

## 🚨 緊急時対応フローチャート

```
問題発生
    ↓
1. 即座にロールバック実行
   heroku rollback v50 --app hr-system-2025
    ↓
2. 動作確認
   curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/employees | head -3
    ↓
3. 問題分析と解決策検討
```

## 📊 よくある問題と解決策

### 問題1: 社員情報が表示されない

#### 症状
- ブラウザコンソールに `Filtered employees count: 0` が表示
- 社員一覧ページが空
- APIは正常にレスポンスを返している

#### 原因分析
```javascript
// フロントエンドのフィルタリング処理で問題が発生
// データは取得されているが、表示処理でフィルタリングされている
```

#### 解決策
1. **即座の対応**: ロールバック実行
2. **根本解決**: フロントエンドのフィルタリングロジックを確認
3. **デバッグ**: ブラウザの開発者ツールでデータの流れを確認

#### デバッグ手順
```javascript
// ブラウザコンソールで実行
console.log('Raw employees data:', employees);
console.log('Filtered employees:', filteredEmployees);
console.log('Filter criteria:', filterCriteria);
```

### 問題2: タスク管理でエラー

#### 症状
- ボードデータ取得で500エラー
- `GET /api/boards/[boardId] 500 (Internal Server Error)`
- ワークスペースAPIでも同様のエラー

#### 原因分析
```bash
# サーバーログで確認されるエラー
Board data received: {error: 'ボードの取得に失敗しました!'}
```

#### 解決策
1. **即座の対応**: ロールバック実行
2. **根本解決**: ボードAPIのエラーハンドリングを改善
3. **データベース確認**: ボードテーブルの整合性を確認

#### デバッグ手順
```bash
# サーバーログの確認
heroku logs --tail --app hr-system-2025

# データベースの確認
heroku run "psql \$DATABASE_URL -c 'SELECT COUNT(*) FROM boards;'" --app hr-system-2025
```

### 問題3: スキーマエラー

#### 症状
```
PrismaClientKnownRequestError: 
The column `employees.managerId` does not exist in the current database.
```

#### 原因分析
- PostgreSQLスキーマに`managerId`フィールドが定義されている
- 実際のデータベースには`managerId`カラムが存在しない
- 開発環境（SQLite）と本番環境（PostgreSQL）のスキーマの違い

#### 解決策
1. **即座の対応**: ロールバック実行
2. **根本解決**: PostgreSQLスキーマから`managerId`を削除
3. **検証**: 実際のデータベース構造を確認

#### 修正手順
```prisma
// prisma/schema-postgres.prisma
// 以下の行をコメントアウト
// managerId             String?
// manager               Employee? @relation("EmployeeHierarchy", fields: [managerId], references: [id])
// subordinates          Employee[] @relation("EmployeeHierarchy")
```

### 問題4: データ構造の不整合

#### 症状
- APIが空のオブジェクトを返す
- `Raw response data: (43) [{},{},...,{}]`
- データは存在するが内容が空

#### 原因分析
- データベースクエリは成功している
- データのシリアライゼーション処理で問題が発生
- Prismaクライアントの設定に問題

#### 解決策
1. **即座の対応**: ロールバック実行
2. **根本解決**: データ取得処理の見直し
3. **検証**: データベースの直接確認

## 🔍 デバッグツールとコマンド

### 1. システム状況確認

```bash
# アプリケーション情報
heroku apps:info --app hr-system-2025

# リリース履歴
heroku releases --app hr-system-2025

# データベース情報
heroku pg:info --app hr-system-2025

# 環境変数
heroku config --app hr-system-2025
```

### 2. ログ分析

```bash
# リアルタイムログ
heroku logs --tail --app hr-system-2025

# 特定の時間のログ
heroku logs --since="2025-10-17 04:00:00" --app hr-system-2025

# エラーログのみ
heroku logs --tail --app hr-system-2025 | grep -i error
```

### 3. データベース操作

```bash
# 社員数確認
heroku run "psql \$DATABASE_URL -c 'SELECT COUNT(*) FROM employees;'" --app hr-system-2025

# ボード数確認
heroku run "psql \$DATABASE_URL -c 'SELECT COUNT(*) FROM boards;'" --app hr-system-2025

# テーブル構造確認
heroku run "psql \$DATABASE_URL -c '\d employees'" --app hr-system-2025
```

### 4. API動作確認

```bash
# 社員API
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/employees | jq 'length'

# マスターデータAPI
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/master-data

# ボードAPI（特定のボードIDが必要）
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/boards/[boardId]
```

## 🚨 緊急時対応手順

### Step 1: 即座のロールバック

```bash
# 安定版に戻す
heroku rollback v50 --app hr-system-2025

# 確認
heroku releases --app hr-system-2025 | head -3
```

### Step 2: 動作確認

```bash
# API動作確認
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/employees | head -3

# エラーチェック
curl -s https://hr-system-2025-33b161f586cd.herokuapp.com/api/employees | grep -i error
```

### Step 3: 問題分析

```bash
# ログ確認
heroku logs --tail --app hr-system-2025 | head -50

# データベース確認
heroku run "psql \$DATABASE_URL -c 'SELECT COUNT(*) FROM employees;'" --app hr-system-2025
```

### Step 4: 根本原因の特定

1. **ログ分析**: エラーメッセージの詳細確認
2. **データベース確認**: データの整合性確認
3. **コード確認**: 変更箇所の影響範囲確認

## 📋 予防策

### 1. デプロイ前の確認事項

- [ ] ローカルでのビルドテスト完了
- [ ] スキーマの整合性確認
- [ ] データベース構造の確認
- [ ] 緊急時対応手順の確認

### 2. デプロイ中の監視事項

- [ ] ビルドプロセスの正常完了
- [ ] Prismaクライアント生成の成功
- [ ] エラーログの監視
- [ ] アプリケーション起動の確認

### 3. デプロイ後の確認事項

- [ ] API動作確認
- [ ] フロントエンド表示確認
- [ ] 機能動作確認
- [ ] エラーログの確認

## 🎯 成功のためのベストプラクティス

### 1. 段階的デプロイ
- 一度にすべてを変更しない
- 各段階で動作確認を行う
- 問題発生時は即座にロールバック

### 2. 十分なテスト
- ローカル環境での事前テスト
- 本番環境での段階的確認
- エッジケースの考慮

### 3. ログの活用
- デプロイ中のログ監視
- エラーログの詳細分析
- パフォーマンスログの確認

### 4. 緊急時対応の準備
- ロールバック手順の事前確認
- 問題発生時の即座の対応
- 根本原因の迅速な特定

## 📞 サポート情報

### 重要なリソース

- **アプリケーション**: hr-system-2025
- **URL**: https://hr-system-2025-33b161f586cd.herokuapp.com/
- **安定版**: v50
- **現在のバージョン**: v1.3.9相当

### 緊急時連絡先

問題が発生した場合は、このドキュメントの緊急時対応手順に従って、即座にロールバックを実行してください。

---

**作成日**: 2025年10月17日  
**作成者**: AI Assistant  
**対象システム**: HR-system (hr-system-2025)  
**目的**: トラブルシューティングと緊急時対応

このドキュメントを参考に、問題の迅速な解決とシステムの安定稼働を実現してください。
