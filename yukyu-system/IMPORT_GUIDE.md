V0取り込み手順（最小）

1. V0のコードを`yukyu-system/`配下に配置します。
   - ドメイン: `yukyu-system/domain/`
   - UI: `yukyu-system/ui/`
   - サーバー: `yukyu-system/server/`
2. 既存ページとの接続
   - `app/leave/page.tsx` から必要なUIやロジックを `@yukyu-system/*` でインポート
3. API・DB
   - Prismaの`LeaveRequest`に合わせてサーバー処理を実装
4. 動作確認
   - `npm run dev` でビルドエラーがないか確認

