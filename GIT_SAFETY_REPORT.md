# Git操作の安全性調査レポート

## 調査日時
2025年10月29日

## 問題の原因
以前、Git操作（コミット・マージ）で修正が削除された原因は、**Gitフック（pre-commit/post-merge）**が自動的にスキーマファイルを再生成していたためです。

## 現在の状況

### 設定されているGitフック
1. **pre-commit** (`scripts/pre-commit.js`)
   - コミット前に自動スキーマ管理を実行
   - 本番環境用スキーマでビルドテストを実行
   - その後、開発環境用スキーマに戻す

2. **post-merge** (`scripts/post-merge.js`)
   - マージ後に自動スキーマ管理を実行

### 問題点
- `schema-base.prisma`（ベーススキーマ）から`schema.prisma`（現在のスキーマ）を自動生成
- `schema.prisma`に直接加えた変更が`schema-base.prisma`に反映されていない場合、フック実行時に削除される

## 修正内容

### ✅ 完了した修正
1. **`schema-base.prisma`にMasterDataモデルを追加**
   - Gitフック実行後もMasterDataモデルが保持されます
   - 雇用形態・部署・役職保存機能が維持されます

### 確認済み
- `auto-schema-manager.js`実行後もMasterDataモデルが保持されることを確認
- Prismaクライアントの再生成も正常

## Git操作の推奨事項

### ✅ 安全に実行できる操作

1. **通常のコミット**
   ```bash
   git add .
   git commit -m "メッセージ"
   ```
   - 修正内容は保持されます
   - pre-commitフックが実行されますが、MasterDataモデルは保持されます

2. **ブランチの切り替え**
   ```bash
   git checkout <branch-name>
   ```
   - 問題ありません

3. **プッシュ**
   ```bash
   git push origin <branch-name>
   ```
   - 問題ありません

### ⚠️ 注意が必要な操作

1. **マージ**
   ```bash
   git merge <branch-name>
   ```
   - post-mergeフックが実行されます
   - 現在は問題ありませんが、念のためマージ後に確認してください

2. **プル（マージが含まれる場合）**
   ```bash
   git pull origin <branch-name>
   ```
   - post-mergeフックが実行される可能性があります

### 🛡️ 安全策（オプション）

もし完全に安全を確保したい場合は、Gitフックを一時的に無効化できます：

```bash
# pre-commitフックを一時的に無効化
mv .git/hooks/pre-commit .git/hooks/pre-commit.backup

# post-mergeフックを一時的に無効化
mv .git/hooks/post-merge .git/hooks/post-merge.backup

# Git操作実行後、フックを再度有効化
mv .git/hooks/pre-commit.backup .git/hooks/pre-commit
mv .git/hooks/post-merge.backup .git/hooks/post-merge
```

## 現在の修正内容（未コミット）

以下のファイルが修正されています：
- ✅ `prisma/schema-base.prisma` - MasterDataモデルを追加
- ✅ `prisma/schema.prisma` - 既にMasterDataモデルが含まれている
- ✅ `app/api/master-data/route.ts` - 雇用形態保存処理の修正
- ✅ `components/employment-type-manager-dialog.tsx` - 値生成ロジックの改善
- ✅ `components/employee-detail-dialog.tsx` - API送信処理の修正
- ✅ その他のコンポーネント修正

## まとめ

**結論：現在の状態であれば、Git操作は安全です。**

理由：
1. `schema-base.prisma`にMasterDataモデルを追加済み
2. Gitフック実行後も修正が保持されることを確認済み
3. Prismaクライアントの再生成も正常

**推奨アクション：**
1. 修正内容をコミットして問題ありません
2. コミット前に`git status`で変更内容を確認してください
3. 念のため、コミット後に`schema.prisma`にMasterDataモデルが含まれているか確認してください

