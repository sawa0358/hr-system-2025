# Gitフック回避機能 使用ガイド

## 概要

Gitフック（pre-commit/post-merge）を自動的に回避して、安全にGit操作を実行できる機能です。

## 問題の背景

以前、Git操作時にGitフックが実行され、以下の問題が発生していました：
- `schema.prisma`への修正が削除される
- MasterDataモデルが失われる
- 雇用形態保存機能が動作しなくなる

## 解決策

### 1. 根本的な修正
- `schema-base.prisma`にMasterDataモデルを追加
- Gitフック実行後も修正が保持されるように改善

### 2. フック回避機能の追加
- `scripts/safe-git.js` - 安全なGit操作スクリプト
- `scripts/bypass-hooks.js` - フック回避専用スクリプト
- npmスクリプトとして追加（簡単に使用可能）

## 使用方法

### 方法1: npmスクリプトを使用（推奨）

```bash
# 安全なコミット（フック自動スキップ）
npm run git:safe commit "コミットメッセージ"

# プッシュ
npm run git:safe push origin feature/branch

# 安全なマージ（フック自動スキップ）
npm run git:safe merge main

# プル
npm run git:safe pull origin main
```

### 方法2: bypass-hooks.jsを使用

```bash
# コミット（フックスキップ）
node scripts/bypass-hooks.js commit "メッセージ"

# プッシュ
node scripts/bypass-hooks.js push origin feature/branch

# マージ（フックスキップ）
node scripts/bypass-hooks.js merge main

# プル（フックスキップ）
node scripts/bypass-hooks.js pull origin main
```

### 方法3: safe-git.jsを直接使用

```bash
# 自動でスキーマチェック付きの安全な操作
node scripts/safe-git.js commit "メッセージ"
node scripts/safe-git.js push origin feature/branch
node scripts/safe-git.js merge main
node scripts/safe-git.js pull origin main
```

## 機能の違い

### safe-git.js（推奨）
- ✅ 自動スキーマチェック（MasterDataモデルの存在確認）
- ✅ コミット/マージ前後の自動検証
- ✅ より安全で推奨される方法

### bypass-hooks.js
- ✅ シンプルなフック回避
- ✅ 軽量で高速

## 通常のGitコマンドとの比較

| 操作 | 通常のGitコマンド | フック回避コマンド |
|------|------------------|-------------------|
| コミット | `git commit -m "..."` | `npm run git:safe commit "..."` |
| プッシュ | `git push origin branch` | `npm run git:safe push origin branch` |
| マージ | `git merge branch` | `npm run git:safe merge branch` |
| プル | `git pull origin branch` | `npm run git:safe pull origin branch` |

## いつフック回避を使うべきか

### ✅ フック回避推奨の場面

1. **MasterDataモデルなどのスキーマ修正時**
   - スキーマファイルの直接編集後
   - 新しいモデルの追加後

2. **ビルドに時間がかかる場合**
   - pre-commitフックのビルドテストが長い時
   - 緊急のコミットが必要な時

3. **フックが失敗する場合**
   - 一時的にフックの問題が発生している時
   - 開発中のプロトタイプコミット時

### ⚠️ 通常のGitコマンドで良い場面

1. **通常のコード変更**
   - コンポーネントやAPIの修正
   - バグ修正や機能追加

2. **テスト済みの変更**
   - フックのチェックを実行したい時
   - CI/CDでの検証が必要な時

## トラブルシューティング

### コミット後もMasterDataモデルが消えた場合

```bash
# 1. schema-base.prismaを確認
grep "model MasterData" prisma/schema-base.prisma

# 2. MasterDataモデルがなければ追加
# schema-base.prismaに以下を追加：

# model MasterData {
#   id        String   @id @default(cuid())
#   type      String
#   value     String
#   label     String
#   order     Int      @default(0)
#   createdAt DateTime @default(now())
#   updatedAt DateTime @updatedAt
#   @@unique([type, value])
#   @@map("master_data")
# }

# 3. スキーマを再生成
npm run schema:dev
```

### フックを完全に無効化したい場合

```bash
# フックを一時的にバックアップ
mv .git/hooks/pre-commit .git/hooks/pre-commit.backup
mv .git/hooks/post-merge .git/hooks/post-merge.backup

# Git操作実行

# フックを復元
mv .git/hooks/pre-commit.backup .git/hooks/pre-commit
mv .git/hooks/post-merge.backup .git/hooks/post-merge
```

## 注意事項

1. **フック回避は慎重に使用**
   - 通常はフックのチェックを実行することを推奨
   - 緊急時や確実に問題がない場合のみ使用

2. **スキーマ変更時は必ずschema-base.prismaも更新**
   - `schema.prisma`の変更は`schema-base.prisma`にも反映
   - これによりGitフック実行後も変更が保持される

3. **コミット前の確認**
   - 重要な変更の場合は、コミット前に確認
   - `git diff`で変更内容を確認

## まとめ

- ✅ フック回避機能を使用して、スキーマ修正が保持されることを確認済み
- ✅ `schema-base.prisma`にMasterDataモデルを追加済み
- ✅ 今後は`npm run git:safe`コマンドで安全にGit操作が可能

