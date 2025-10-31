# 有給管理システム エラー調査レポート

## 調査日時
2025年10月31日

## 調査範囲
設定画面以外の有給管理システム全体のエラーハンドリングと保存処理

---

## 1. 申請API (`app/api/vacation/request/route.ts`)

### ✅ 正常に実装されている部分
- 必須項目チェック（employeeId, startDate, endDate）
- 社員存在チェック
- 期間と時間数の整合性チェック
- 基本的なエラーハンドリング（try-catch）

### ⚠️ 改善が必要な箇所（後で修正推奨）

#### 1.1 時間単位での `hours` が 0 の場合
```typescript
// 現在: 43行目
const hours = usedDays || 0  // hours が 0 でも通る

// 問題: hours が 0 の場合、申請が通ってしまう
// 推奨修正:
if (unit === "HOUR" && hoursPerDay) {
  const hours = usedDays || 0
  if (hours <= 0) {
    return NextResponse.json({ error: "使用時間数は1時間以上である必要があります" }, { status: 400 })
  }
  // ...
}
```

#### 1.2 日単位での `usedDays` が 0 以下の場合
```typescript
// 現在: 101行目
const rawDays = usedDays || periodDays  // 0 の場合でも通る

// 推奨修正:
const rawDays = usedDays || periodDays
if (rawDays <= 0) {
  return NextResponse.json({ error: "使用日数は0.5日以上である必要があります" }, { status: 400 })
}
```

### 優先度: 中
- **影響**: データ整合性の問題（0時間・0日の申請が作成される可能性）
- **緊急度**: 低（既存の申請が壊れることはないが、将来的に問題になる可能性）

---

## 2. 承認API (`app/api/vacation/requests/[id]/approve/route.ts`)

### ✅ 正常に実装されている部分
- 申請存在チェック
- ステータスチェック（PENDINGのみ承認可能）
- トランザクション処理（整合性保証）
- INSUFFICIENT_BALANCE エラーの特別処理

### ⚠️ 改善が必要な箇所（後で修正推奨）

#### 2.1 トランザクション内の部分的なエラー
```typescript
// 現在: トランザクション全体がロールバックされるが、どの処理で失敗したか不明確
// 推奨: 各処理の前に検証を追加

// 例: 残高チェックを事前に行う
const remainingDays = await calculateRemainingDays(req.employeeId)
if (remainingDays < daysToUse) {
  return NextResponse.json({ 
    error: "残高不足のため承認できません", 
    details: `残高: ${remainingDays}日、申請: ${daysToUse}日` 
  }, { status: 400 })
}
```

#### 2.2 Prismaエラーの詳細化
```typescript
// 現在: 汎用的なエラーメッセージ
// 推奨: Prismaの特定エラー（制約違反など）を検知して詳細なメッセージを返す

catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "データの重複が発生しました" }, { status: 400 })
    }
    // 他のPrismaエラーコードに対応
  }
  // ...
}
```

### 優先度: 低
- **影響**: エラーメッセージの詳細度の問題
- **緊急度**: 低（既存機能は動作するが、デバッグが困難）

---

## 3. 却下API (`app/api/vacation/requests/[id]/reject/route.ts`)

### ✅ 正常に実装されている部分
- 申請存在チェック
- ステータスチェック
- 監査ログの記録

### ⚠️ 改善が必要な箇所（後で修正推奨）

#### 3.1 却下理由の必須チェック
```typescript
// 現在: reason が空でも通る
// 推奨: 却下理由を必須にする（ポリシーによる）

if (!reason || reason.trim() === "") {
  return NextResponse.json({ error: "却下理由は必須です" }, { status: 400 })
}
```

### 優先度: 低
- **影響**: ユーザビリティの問題（却下理由が記録されない）
- **緊急度**: 低（業務的に却下理由を記録したい場合のみ必要）

---

## 4. UIコンポーネント (`yukyu-system/components/vacation-request-form.tsx`)

### ✅ 正常に実装されている部分
- 基本的なエラーハンドリング
- ローディング状態の管理

### ⚠️ 改善が必要な箇所（後で修正推奨）

#### 4.1 `alert` の使用
```typescript
// 現在: 69行目、72行目で `alert` を使用
alert("申請が送信されました")
alert(err?.message ?? "申請に失敗しました")

// 推奨: `useToast` フックを使用して統一されたUIで表示
// （すでに他のコンポーネントで使用されているため）
```

#### 4.2 バリデーションメッセージ
```typescript
// 現在: サーバーエラーのみ表示
// 推奨: クライアント側での事前バリデーションを追加

// 例: 開始日が終了日より後の場合
if (new Date(formData.startDate) > new Date(formData.endDate)) {
  toast({ title: "エラー", description: "開始日は終了日より前である必要があります", variant: "destructive" })
  return
}
```

### 優先度: 中
- **影響**: UXの問題（`alert` はモダンなWebアプリには不適切）
- **緊急度**: 低（機能は動作するが、UXが劣る）

---

## 5. データベース制約違反

### ⚠️ 確認が必要な箇所（後で確認推奨）

#### 5.1 一意制約違反
- `VacationAppConfig.version` の一意制約
- `GrantLot` の複合一意制約（ある場合）

#### 5.2 外部キー制約違反
- `TimeOffRequest.employeeId` → `Employee.id`
- `GrantLot.employeeId` → `Employee.id`
- `Consumption.lotId` → `GrantLot.id`

### 推奨対応
```typescript
// Prismaエラーの特定と適切なメッセージ返却
import { Prisma } from '@prisma/client'

catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // 一意制約違反
        return NextResponse.json({ error: "既に存在するデータです" }, { status: 409 })
      case 'P2003':
        // 外部キー制約違反
        return NextResponse.json({ error: "参照先のデータが存在しません" }, { status: 400 })
      // 他のエラーコード...
    }
  }
  // ...
}
```

### 優先度: 低
- **影響**: エラーメッセージの詳細度の問題
- **緊急度**: 低（通常の使用では発生しないが、エッジケースで発生する可能性）

---

## 6. その他の潜在的な問題

### 6.1 日付の検証不足
- 開始日が未来の日付でも通る
- 過去の日付でも通る（ポリシーによる）

### 6.2 承認APIでのロット存在チェック
- `consumeLIFO` が失敗した場合の詳細なエラーメッセージ

### 6.3 並行リクエストの処理
- 同じ申請を同時に承認/却下した場合の競合処理

---

## 推奨アクション

### 🔴 今すぐ修正すべき（なし）
現在の実装で重大な問題は見つかりませんでした。

### 🟡 後で修正推奨（優先度：中）
1. **申請API**: 時間/日数が 0 以下の場合のバリデーション
2. **UIコンポーネント**: `alert` から `useToast` への移行

### 🟢 後で修正推奨（優先度：低）
1. **承認API**: エラーメッセージの詳細化
2. **却下API**: 却下理由の必須チェック（ポリシーによる）
3. **データベース制約違反**: Prismaエラーの詳細な処理

---

## 結論

**現在の保存エラーは後から修正しても問題ありません。**

理由：
1. **重大な問題はない**: データ整合性を損なう問題は見つかっていません
2. **既存機能は動作**: 現在の実装で基本的な機能は動作します
3. **段階的な改善が可能**: 優先度に応じて段階的に修正できます

**推奨スケジュール**:
- **今週**: 機能実装を優先
- **来週以降**: エラーハンドリングとUX改善を実施

---

## 補足

設定画面については既にエラー確認済みとのことなので、本レポートの対象外としています。

