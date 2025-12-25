# 業務チェック機能 引き継ぎ書

**最終更新**: 2025-12-25 23:18
**現在のコミット**: `23a1c389ba1785c7d0cbc6c3789277e2dcddfa37`
**ブランチ**: `feature/business-checklist-ui`

---

## 1. 機能概要

業務チェック機能は、ワーカーが日々のタスク完了状況を報告し、管理者がそれを分析・管理するためのシステムです。

### 主要コンポーネント

| コンポーネント | パス | 説明 |
|--------------|------|------|
| ワーカー個別ページ | `app/workclock/worker/[id]/page.tsx` | チェックリスト入力UI（ChecklistPanel） |
| 管理画面 | `app/workclock/checklist-summary/page.tsx` | 日次/期間分析、AIレポート |
| チェックリストAPI | `app/api/workclock/checklist-submissions/route.ts` | 提出データのCRUD |
| AIレポートAPI | `app/api/workclock/ai-reports/route.ts` | AI分析レポート生成・取得 |

---

## 2. データベース構造

### workclock_checklist_submissions テーブル

```prisma
model WorkClockChecklistSubmission {
  id            String   @id @default(cuid())
  workerId      String
  date          DateTime
  items         Json     // チェック項目の配列
  memo          String?
  hasPhoto      Boolean  @default(false)
  isSafetyAlert Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([workerId, date])
  @@map("workclock_checklist_submissions")
}
```

### items JSON構造

```typescript
interface ChecklistItem {
  title: string           // 項目名
  reward: number          // 報酬（寸志）
  isChecked: boolean      // チェック状態
  isFreeText: boolean     // 自由記入欄かどうか
  freeTextValue?: string  // 自由記入内容
}
```

### workclock_ai_reports テーブル

```prisma
model WorkClockAIReport {
  id          String   @id @default(cuid())
  date        DateTime
  summary     String   // AIが生成したサマリー
  promptId    String?
  promptName  String?
  workerCount Int
  alerts      Int      @default(0)
  totalReward Int
  createdAt   DateTime @default(now())

  @@map("workclock_ai_reports")
}
```

---

## 3. 実装済み機能

### ✅ ワーカー側（ChecklistPanel）
- チェックボックス式タスク報告
- 自由記入欄（freeTextValue）
- 寸志（報酬）の自動計算
- ヒヤリハット報告フラグ
- 1日1回の提出制限（上書き可能）

### ✅ 管理画面（checklist-summary）
- **日次モード**: 特定日のワーカー別報告一覧
- **期間モード**: 日付範囲指定でのAIレポート履歴表示
- フィルター機能（チーム、雇用形態、検索）
- カレンダーによる日付/期間選択

### ✅ AIレポート機能
- プロンプト選択・カスタム保存（localStorage）
- 日次/期間での自動レポート生成
- Gemini API連携（フォールバックあり）
- 自由記入欄の内容を抽出してレポートに含める

### ✅ 表示改善
- 「画像・メモ」列に自由記入欄（freeTextValue）を表示
- AIレポート行クリックで詳細モーダル表示
- ローディング表示「レポートを集計しています...」

---

## 4. 現在の課題・未解決事項

### � 重要な問題

1. **期間モードでremoveChildエラー**
   - ブラウザの自動翻訳機能とReact DOMが競合
   - 対策: `layout.tsx`に`translate="no"`を追加（ただしrevert済み）
   - 本番環境では問題なし（翻訳機能OFF）

2. **AIレポートの重複生成**
   - 「AIレポート」ボタンを押すたびに新しいレポートが追加される
   - 同じ日に複数のレポートが蓄積する
   - **対策案**: 同じ日のレポートは上書きするか、重複チェックを追加

### 🟡 改善すべき点

1. **期間モードのAIレポートボタン**
   - 現在はChatGPTライクな静的テンプレートを返すだけ
   - Gemini AIを使った実際の分析機能が未実装

2. **「AIに聞く」ボタン**
   - 日次モードでは動作確認済み
   - 期間モードでのコンテキスト設定が未完全

---

## 5. API仕様

### GET /api/workclock/checklist-submissions

```
Query: date, workerId
Response: { submissions: [...] }
```

### POST /api/workclock/checklist-submissions

```json
{
  "workerId": "string",
  "date": "YYYY-MM-DD",
  "items": [...],
  "memo": "string",
  "hasPhoto": boolean,
  "isSafetyAlert": boolean
}
```

### GET /api/workclock/ai-reports

```
Query: startDate, endDate, page, limit, autoGenerate
Response: { reports: [...], pagination: {...} }
```

autoGenerate=trueの場合、チェックリスト提出があるがAIレポートがない日は自動生成

### POST /api/workclock/ai-reports

```json
{
  "date": "YYYY-MM-DD",
  "summary": "string",
  "promptId": "string",
  "promptName": "string",
  "workerCount": number,
  "alerts": number,
  "totalReward": number
}
```

---

## 6. ファイル構成

```
app/
├── workclock/
│   ├── worker/[id]/page.tsx         # ワーカー個別ページ
│   └── checklist-summary/page.tsx   # 管理画面
├── api/workclock/
│   ├── checklist-submissions/route.ts
│   └── ai-reports/route.ts
components/
├── checklist-panel.tsx              # チェックリスト入力コンポーネント
├── ai-ask-button.tsx                # AIに聞くボタン
└── ui/                              # shadcn/uiコンポーネント
```

---

## 7. 次のステップ候補

1. **AIレポート重複問題の解決**
   - 同じ日のレポートは更新（upsert）するように変更
   - または「この日のレポートを再生成しますか？」確認ダイアログ追加

2. **期間モードのAI分析強化**
   - Gemini APIを使って履歴レポートを統合分析
   - プロンプト選択が機能するように修正

3. **removeChildエラーの根本対策**
   - `translate="no"`メタタグを適切に追加
   - ErrorBoundaryでの復帰処理改善

4. **PDF出力機能**
   - チェックリスト報告のPDF化
   - 期間サマリーのPDF化

---

## 8. テスト用コマンド

```bash
# 開発サーバー起動
npm run dev

# AIレポート一覧取得（自動生成あり）
curl -H "x-employee-id: YOUR_ID" \
  "http://localhost:3000/api/workclock/ai-reports?startDate=2025-12-20&endDate=2025-12-25&autoGenerate=true"

# 既存AIレポート削除
echo "DELETE FROM workclock_ai_reports;" | sqlite3 prisma/dev.db

# チェックリスト提出確認
echo "SELECT * FROM workclock_checklist_submissions;" | sqlite3 prisma/dev.db
```

---

## 9. 環境変数

```env
# Gemini AI（オプション - なくてもフォールバック動作）
GEMINI_API_KEY=your_key_here
```

---

## 10. 注意事項

- **ブランチ**: `feature/business-checklist-ui`で作業中
- **本番デプロイ前に**: mainブランチにマージが必要
- **DBスキーマ変更時**: `npx prisma migrate dev`を実行
- **型エラー発生時**: `npx prisma generate`を実行

---

*この引き継ぎ書は新しい開発セッションで参照してください*
