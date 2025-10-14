# 雇用形態保存問題の段階的マイグレーション手順書

## 📋 概要

**問題**: Heroku本番環境で雇用形態（`employeeType`）の保存が失敗する
**原因**: Prismaスキーマの`employeeType`をenumからString型に変更したが、本番データベースの型変更ができない
**解決方法**: データを保持したまま段階的にマイグレーションを実行

## 🎯 目標

- 本番データベースの既存データを完全に保持
- 雇用形態の保存機能を正常に動作させる
- システムのダウンタイムを最小限に抑制

## 📊 現在の状況

### 開発環境 ✅
- `employeeType`をString型に変更済み
- 雇用形態保存が正常に動作
- 新しい雇用形態（part_time, dispatched等）が保存可能

### 本番環境 ❌
- `employeeType`がenum型のまま
- 新しい雇用形態の保存が失敗
- データベースリセットが必要な状況

## 🔄 段階的マイグレーション手順

### フェーズ1: 準備段階

#### 1.1 データバックアップ
```bash
# Herokuからデータベースをバックアップ
heroku pg:backups:capture --app hr-system-2025
heroku pg:backups:download --app hr-system-2025

# バックアップファイルの確認
ls -la *.dump
```

#### 1.2 現在のスキーマ確認
```bash
# 本番データベースの現在のスキーマを確認
heroku run "npx prisma db pull" --app hr-system-2025
```

### フェーズ2: スキーマ変更

#### 2.1 一時的なフィールド追加
```sql
-- prisma/schema.prisma に追加
model Employee {
  // ... 既存フィールド
  employeeType          EmployeeType  // 既存（保持）
  employeeTypeString    String?       // 新規追加（一時的）
  // ... その他のフィールド
}
```

#### 2.2 マイグレーションファイル作成
```bash
npx prisma migrate dev --name add_employee_type_string_field
```

### フェーズ3: データ移行

#### 3.1 データ移行スクリプト作成
```javascript
// scripts/migrate-employee-type.js
const { PrismaClient } = require('@prisma/client')

async function migrateEmployeeTypes() {
  const prisma = new PrismaClient()
  
  try {
    // 既存のemployeeTypeをemployeeTypeStringに移行
    const employees = await prisma.employee.findMany()
    
    for (const employee of employees) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          employeeTypeString: employee.employeeType // enum値を文字列に変換
        }
      })
    }
    
    console.log(`✅ ${employees.length}件の雇用形態データを移行しました`)
  } catch (error) {
    console.error('❌ データ移行エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateEmployeeTypes()
```

#### 3.2 移行スクリプト実行
```bash
# 本番環境でデータ移行
heroku run "node scripts/migrate-employee-type.js" --app hr-system-2025
```

### フェーズ4: アプリケーション更新

#### 4.1 API更新
```typescript
// app/api/employees/[id]/route.ts
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // ... 既存コード
  
  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: {
      // employeeTypeStringを使用（一時的）
      employeeTypeString: body.employeeType,
      // ... その他のフィールド
    }
  })
}
```

#### 4.2 フロントエンド更新
```typescript
// components/employee-detail-dialog.tsx
// employeeTypeStringフィールドを使用するように変更
```

### フェーズ5: 最終移行

#### 5.1 最終スキーマ変更
```sql
-- prisma/schema.prisma 最終版
model Employee {
  // ... 既存フィールド
  employeeType          String        // String型に変更
  // employeeTypeString フィールドを削除
  // ... その他のフィールド
}
```

#### 5.2 最終マイグレーション
```bash
npx prisma migrate dev --name finalize_employee_type_migration
```

#### 5.3 最終データ移行
```javascript
// scripts/finalize-migration.js
const { PrismaClient } = require('@prisma/client')

async function finalizeMigration() {
  const prisma = new PrismaClient()
  
  try {
    // employeeTypeStringの値をemployeeTypeに移行
    const employees = await prisma.employee.findMany({
      where: { employeeTypeString: { not: null } }
    })
    
    for (const employee of employees) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          employeeType: employee.employeeTypeString
        }
      })
    }
    
    console.log(`✅ ${employees.length}件の最終移行が完了しました`)
  } catch (error) {
    console.error('❌ 最終移行エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalizeMigration()
```

## 🚀 デプロイ手順

### ステップ1: 準備
```bash
# 1. バックアップ作成
heroku pg:backups:capture --app hr-system-2025

# 2. 現在のコードをコミット
git add .
git commit -m "段階的マイグレーション準備完了"
git push
```

### ステップ2: フェーズ1-2デプロイ
```bash
# 一時的なフィールド追加版をデプロイ
git push heroku main
```

### ステップ3: データ移行実行
```bash
# 本番環境でデータ移行スクリプト実行
heroku run "node scripts/migrate-employee-type.js" --app hr-system-2025
```

### ステップ4: フェーズ4デプロイ
```bash
# アプリケーション更新版をデプロイ
git push heroku main
```

### ステップ5: 最終移行
```bash
# 最終スキーマ版をデプロイ
git push heroku main

# 最終データ移行実行
heroku run "node scripts/finalize-migration.js" --app hr-system-2025
```

## 🔍 検証手順

### 各フェーズ後の確認項目

#### フェーズ2後
- [ ] 一時的なフィールドが正常に追加されているか
- [ ] 既存データに影響がないか

#### フェーズ3後
- [ ] データ移行が正常に完了しているか
- [ ] 雇用形態データが正しく移行されているか

#### フェーズ4後
- [ ] 新しい雇用形態が保存できるか
- [ ] 既存の雇用形態表示が正常か

#### フェーズ5後
- [ ] 最終的なスキーマが正しいか
- [ ] すべての機能が正常に動作するか

## 🛠️ ロールバック手順

### 緊急時の復旧方法

#### 1. データベース復元
```bash
# バックアップから復元
heroku pg:backups:restore [BACKUP_ID] --app hr-system-2025
```

#### 2. コードロールバック
```bash
# 前のバージョンに戻す
git revert [COMMIT_HASH]
git push heroku main
```

## 📞 緊急連絡先

- **システム管理者**: [連絡先]
- **データベース管理者**: [連絡先]
- **開発チーム**: [連絡先]

## 📝 注意事項

1. **各フェーズは順番に実行**し、前のフェーズが完了してから次に進む
2. **データバックアップ**は各フェーズ前に必ず実行
3. **本番環境でのテスト**は限定的に行う
4. **ログの確認**を怠らない
5. **ユーザーへの事前通知**を忘れずに

## 🎉 完了後の確認

### 成功の指標
- [ ] 雇用形態「part_time」が正常に保存される
- [ ] 雇用形態「dispatched」が正常に保存される
- [ ] 既存の社員データがすべて保持されている
- [ ] 社員テーブルの検索・フィルタリングが正常に動作する
- [ ] システム全体のパフォーマンスに問題がない

---

**作成日**: 2025年1月15日
**作成者**: AI Assistant
**バージョン**: 1.0
**対象システム**: HR System v1.3.7
