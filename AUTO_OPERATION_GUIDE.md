# 完全自動運用システム ガイド

## 🎯 概要

**指示なしで自動運用**できるシステムを構築しました。環境検出、スキーマ管理、デプロイがすべて自動化されています。

## 🤖 自動化機能

### 1. **環境自動検出**
- Heroku環境の自動検出
- データベースURLの自動判別
- 開発・本番環境の自動切り替え

### 2. **スキーマ自動管理**
- 環境に応じたスキーマの自動生成
- Prismaクライアントの自動再生成
- スキーマ不整合の自動防止

### 3. **Git Hooks自動化**
- Pre-commit: コミット前の自動チェック
- Post-merge: マージ後の自動同期

### 4. **デプロイ自動化**
- 環境検出による自動デプロイ
- ビルドテストの自動実行
- エラー時の自動ロールバック

## 🚀 セットアップ（初回のみ）

### 1. 自動運用システムの初期化

```bash
# Git Hooksを設定（初回のみ）
npm run auto:setup
```

これで以下が自動設定されます：
- Pre-commit hook（コミット前の自動チェック）
- Post-merge hook（マージ後の自動同期）

## 🎉 自動運用の開始

### セットアップ後は**何もする必要がありません**！

#### 開発時
```bash
# 通常通り開発
npm run dev
# → 自動でSQLiteスキーマに切り替わります
```

#### デプロイ時
```bash
# 通常通りコミット・プッシュ
git add .
git commit -m "新機能追加"
git push heroku main
# → 自動でPostgreSQLスキーマに切り替わり、デプロイされます
```

## 🔄 自動化の流れ

### 開発環境での作業
1. **コード編集** → 通常通り
2. **git commit** → 自動でスキーマ管理とビルドテスト
3. **git push** → 自動で本番環境用スキーマに切り替え

### 本番環境でのデプロイ
1. **Heroku検出** → 自動でPostgreSQLスキーマに切り替え
2. **ビルドテスト** → 自動で本番環境用ビルドを実行
3. **デプロイ実行** → 自動でHerokuにデプロイ

## 📋 新しいnpmスクリプト

| コマンド | 説明 | 使用頻度 |
|---------|------|----------|
| `npm run auto:setup` | 自動運用システムの初期化 | 初回のみ |
| `npm run auto:deploy` | 完全自動デプロイ | 必要時のみ |
| `npm run auto:schema` | 手動スキーマ管理 | 緊急時のみ |

## 🎯 自動化のメリット

### 1. **完全自動化**
- 環境検出が自動
- スキーマ切り替えが自動
- デプロイ準備が自動

### 2. **エラー防止**
- スキーマ不整合を自動防止
- ビルドエラーを事前検出
- 不適切なデプロイを自動阻止

### 3. **開発効率向上**
- 手動操作が不要
- 環境設定を忘れる心配なし
- デプロイ手順を覚える必要なし

## 🚨 緊急時の手動操作

### 自動システムが動作しない場合

```bash
# 手動でスキーマ管理
npm run auto:schema

# 手動でデプロイ準備
npm run deploy:prepare

# 手動でデプロイ
git push heroku main
```

## 🔧 カスタマイズ

### 環境検出のカスタマイズ

`scripts/auto-schema-manager.js` の `detectEnvironment()` メソッドを編集：

```javascript
detectEnvironment() {
  const env = {
    // カスタム環境変数を追加
    isCustomEnv: process.env.CUSTOM_ENV === 'true',
    // 既存の検出ロジック
    isProduction: process.env.NODE_ENV === 'production',
    // ...
  };
  return env;
}
```

### スキーマ生成のカスタマイズ

`scripts/auto-schema-manager.js` の `generateSchema()` メソッドを編集：

```javascript
generateSchema(baseSchema, provider) {
  // カスタムスキーマ生成ロジック
  let schema = baseSchema.replace(/* ... */);
  
  // カスタムフィールドの追加
  if (provider === 'postgresql') {
    schema += '\n// カスタムPostgreSQL設定\n';
  }
  
  return schema;
}
```

## 📊 ログとモニタリング

### 自動化のログ確認

```bash
# スキーマ管理のログ
npm run auto:schema

# デプロイのログ
npm run auto:deploy
```

### Git Hooksのログ確認

```bash
# Pre-commit hookのログ
git commit -m "テストコミット"

# Post-merge hookのログ
git merge feature-branch
```

## 🎉 まとめ

この完全自動運用システムにより：

1. **開発者はコードに集中**できる
2. **環境設定を忘れる心配**がない
3. **デプロイエラーが自動防止**される
4. **運用コストが大幅削減**される

### 今後の運用

- **開発時**: 通常通り `npm run dev`
- **デプロイ時**: 通常通り `git push heroku main`
- **その他**: 何もする必要がありません！

**指示なしで自動運用**が実現されました！🎉

---

**作成日**: 2025年10月17日  
**目的**: 完全自動運用システムの構築  
**対象**: HR-system (hr-system-2025)
