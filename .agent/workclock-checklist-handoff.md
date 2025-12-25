# 業務チェック機能 実装引き継ぎ書

## 📋 概要

WorkClock（時間管理システム）に業務チェックリスト機能を実装しました。
ワーカーが日々の業務項目をチェックし、チェック項目に応じた報酬が自動計算されます。

**ブランチ**: `feature/business-checklist-ui`  
**最新コミット**: `c38e403`

---

## 🎯 実装済み機能

### 1. チェックリストパターン管理
- **場所**: `/workclock/admin/checklist-patterns`
- **機能**:
  - チェックリストパターンの作成・編集・削除
  - 各パターンに複数のチェック項目を設定
  - 項目ごとに報酬額、必須/任意、カテゴリを設定
  - ドラッグ&ドロップで項目の並び替え

### 2. ワーカーへのパターン割り当て
- **場所**: ワーカー登録・編集モーダル
- **機能**:
  - 「業務チェック有効化」トグル
  - チェックリストパターンの選択

### 3. 日次チェックリスト入力
- **場所**: カレンダーの日付クリック → 「業務チェック」タブ
- **機能**:
  - チェック項目の選択（チェックボックス）
  - 報酬の自動計算・表示
  - メモ入力
  - 保存機能（同日再保存で上書き）
  - 保存済みデータの復元表示

### 4. カレンダー表示
- **機能**:
  - 勤務記録のみ: 水色背景
  - 業務チェックのみ: 薄緑色背景 + チェックアイコン
  - 両方あり:
    - モバイル: 緑チェックアイコンのみ
    - 大画面: 勤務時間+備考+「チェック済」表示

### 5. 月次集計
- **場所**: WorkerSummary（今月の報酬見込カード）
- **機能**:
  - 月間のチェックリスト報酬を自動集計
  - 「+ 業務チェック報酬 ¥XXX」として表示（緑色）

### 6. PDF出力
- **機能**:
  - サマリー欄に「業務チェック報酬」を追加
  - 源泉なし小計に含まれる
  - 下部の詳細テーブルは削除済み（サマリーに表示されているため）

---

## 🗂️ データベーススキーマ

### WorkClockChecklistPattern
```prisma
model WorkClockChecklistPattern {
  id          String   @id @default(cuid())
  name        String
  description String?
  items       WorkClockChecklistItem[]
  workers     WorkClockWorker[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### WorkClockChecklistItem
```prisma
model WorkClockChecklistItem {
  id          String   @id @default(cuid())
  patternId   String
  pattern     WorkClockChecklistPattern @relation(...)
  title       String
  reward      Float    @default(0)
  isMandatory Boolean  @default(false)
  category    String?
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### WorkClockChecklistSubmission
```prisma
model WorkClockChecklistSubmission {
  id            String   @id @default(cuid())
  workerId      String
  worker        WorkClockWorker @relation(...)
  date          DateTime
  memo          String?
  hasPhoto      Boolean  @default(false)
  isSafetyAlert Boolean  @default(false)
  items         WorkClockChecklistSubmissionItem[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### WorkClockChecklistSubmissionItem
```prisma
model WorkClockChecklistSubmissionItem {
  id           String   @id @default(cuid())
  submissionId String
  submission   WorkClockChecklistSubmission @relation(...)
  title        String
  reward       Float    @default(0)
  isMandatory  Boolean  @default(false)
  isChecked    Boolean  @default(false)
  category     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## 📁 主要ファイル

### API Routes
- `app/api/workclock/checklist/patterns/route.ts` - パターン一覧・作成
- `app/api/workclock/checklist/patterns/[id]/route.ts` - パターン取得・更新・削除
- `app/api/workclock/checklist/submissions/route.ts` - 提出一覧・作成（上書き保存対応）

### Components
- `components/workclock/checklist-panel.tsx` - チェックリスト入力UI
- `components/workclock/time-entry-dialog.tsx` - 勤務記録+チェックリストのモーダル
- `components/workclock/calendar-view.tsx` - カレンダー表示（チェック済み日の色分け）
- `components/workclock/worker-summary.tsx` - 月次サマリー（チェックリスト報酬表示）
- `app/workclock/admin/checklist-patterns/page.tsx` - パターン管理画面

### Libraries
- `lib/workclock/api.ts` - API呼び出し関数
- `lib/workclock/pdf-export.tsx` - PDF生成（チェックリスト報酬対応）

---

## 🔧 重要な実装ポイント

### 1. React State管理の注意点
**問題**: `onStateChange`を直接呼ぶとReactの警告が出る
**解決**: `setTimeout(() => onStateChange(...), 0)` で遅延実行

```tsx
// checklist-panel.tsx
const handleToggle = (id: string) => {
  setCheckedItems(prev => {
    const newState = { ...prev, [id]: !prev[id] }
    setTimeout(() => {
      onStateChange?.({ checkedItems: newState, memo: reportText, items: checklistItems })
    }, 0)
    return newState
  })
}
```

### 2. 重複保存の防止
**問題**: 同じ日に何度も保存すると重複データが蓄積
**解決**: 保存時に既存データを削除してから新規作成

```typescript
// app/api/workclock/checklist/submissions/route.ts
// 同じ日の既存提出を検索
const existingSubmissions = await prisma.workClockChecklistSubmission.findMany({
  where: {
    workerId,
    date: { gte: startOfDay, lt: endOfDay }
  }
})

// 既存があれば削除
if (existingSubmissions.length > 0) {
  await prisma.workClockChecklistSubmissionItem.deleteMany(...)
  await prisma.workClockChecklistSubmission.deleteMany(...)
}

// 新規作成
await prisma.workClockChecklistSubmission.create(...)
```

### 3. 保存済みデータの復元
**実装場所**: `checklist-panel.tsx` の `useEffect`

```tsx
// 既存の提出データを取得
const submissionRes = await api.checklist.submissions.getAll({
  workerId,
  startDate: dateStr,
  endDate: dateStr,
})

// チェック状態を復元（タイトルでマッチング）
const checkedMap: Record<string, boolean> = {}
submission.items.forEach((item: any) => {
  const matchingItem = items.find(i => i.title === item.title)
  if (matchingItem && item.isChecked) {
    checkedMap[matchingItem.id] = true
  }
})
setCheckedItems(checkedMap)
```

### 4. 月次集計の計算
**実装場所**: `app/workclock/worker/[id]/page.tsx`

```tsx
const submissionRes = await api.checklist.submissions.getAll({
  workerId,
  startDate: firstDay,
  endDate: lastDay,
})

const totalChecklist = submissionRes.submissions.reduce((total, sub) => {
  if (sub.items) {
    return total + sub.items.reduce((itemTotal: number, item: any) => {
      return itemTotal + (item.isChecked ? (item.reward || 0) : 0)
    }, 0)
  }
  return total
}, 0)
setChecklistReward(totalChecklist)
```

---

## 🐛 既知の問題・制限事項

### 1. テスト中の重複データ
- **状況**: 開発中に同じ日に複数回保存したため重複データが存在
- **対処**: 手動でSQLクエリで削除済み
- **今後**: 上書き保存機能により新規発生しない

### 2. チェックリストパターンの削除
- **制限**: ワーカーに割り当て済みのパターンは削除不可
- **理由**: 外部キー制約
- **対処**: 削除前にワーカーの割り当てを解除する必要あり

### 3. PDF出力の源泉徴収
- **仕様**: チェックリスト報酬は源泉なし小計に含まれる
- **理由**: `isWithholding: false` で設定
- **変更方法**: `pdf-export.tsx` の `breakdowns.push()` で `isWithholding: true` に変更

---

## 📝 今後の拡張案

### 1. チェックリスト項目の追加機能
- パターン管理画面で項目を追加・編集
- カテゴリ別の集計表示
- 写真添付機能の実装

### 2. 統計・レポート機能
- ワーカー別のチェック達成率
- 項目別の実施率グラフ
- 月次・年次のトレンド分析

### 3. 通知機能
- 未チェック項目のリマインダー
- 必須項目の未完了アラート

### 4. モバイルアプリ対応
- PWA化
- オフライン対応
- カメラ連携

---

## 🚀 デプロイ前チェックリスト

- [ ] `npm run build` でビルドエラーがないか確認
- [ ] Prisma migration を本番環境で実行
  ```bash
  npx prisma migrate deploy
  ```
- [ ] 環境変数の確認（DATABASE_URLなど）
- [ ] 既存データのバックアップ
- [ ] ロールバック手順の確認

---

## 📞 トラブルシューティング

### チェックリストが保存されない
1. ブラウザのコンソールでエラーを確認
2. `checklistState` が null でないか確認
3. APIレスポンスを確認（Network タブ）

### 報酬が正しく計算されない
1. データベースで重複がないか確認
   ```sql
   SELECT workerId, date, COUNT(*) 
   FROM workclock_checklist_submissions 
   GROUP BY workerId, date 
   HAVING COUNT(*) > 1;
   ```
2. 集計ロジックを確認（`worker/[id]/page.tsx`）

### カレンダーに色が表示されない
1. `checklistDates` が正しく渡されているか確認
2. 日付フォーマットが `YYYY-MM-DD` か確認

---

## 📚 参考資料

- Prisma Documentation: https://www.prisma.io/docs
- Next.js App Router: https://nextjs.org/docs/app
- React Hook Form: https://react-hook-form.com/
- Tailwind CSS: https://tailwindcss.com/docs

---

**作成日**: 2025-12-25  
**作成者**: AI Assistant  
**ブランチ**: feature/business-checklist-ui  
**最終コミット**: c38e403
