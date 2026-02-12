# Chatwork API トークン設定（給与・請求 → Chatwork 送信）

給与・請求管理で「Chatworkへ送信する」を使うには、Chatwork の API トークンが必要です。

## 設定するファイル

- **ローカル:** プロジェクトルートの **`.env.local`**
- **本番（Heroku など）:** その環境の「Config Vars」や環境変数

## 変数名

```
CHATWORK_API_TOKEN=あなたのAPIトークン
```

## トークンの取得手順

1. Chatwork にログインする
2. 下記ページで「API トークン」を発行する  
   https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php
3. 表示されたトークンをコピーし、`.env.local` の `CHATWORK_API_TOKEN=` の右に貼り付けて保存

## 注意

- `.env.local` は `.gitignore` に含まれており、リポジトリにはコミットされません（トークンを安全に置けます）
- 本番環境では、Heroku の「Settings → Config Vars」などで `CHATWORK_API_TOKEN` を追加してください

---

## 本番で送信されない場合の確認（3点）

1. **Heroku にトークンを設定したか**
   - Heroku ダッシュボード → アプリ → Settings → Config Vars → Reveal Config Vars
   - `CHATWORK_API_TOKEN` を追加し、Chatwork で発行したトークンを貼り付けて保存
   - 設定後は再デプロイ不要（すぐ反映）

2. **本番で「Chatwork送信先」を登録したか**
   - 本番とローカルは**別データベース**のため、ローカルで登録したルームIDは本番にはありません
   - 本番アプリにログイン → 給与or請求管理 → 「Chatwork送信先設定」→ 各社員のルームIDを登録して保存

3. **エラー内容の確認**
   - ターミナルで `heroku logs --tail --app hr-system-2025` を実行し、ファイル送信を再度試す
   - `[Chatwork] CHATWORK_API_TOKEN が未設定です` → 上記1を実施
   - `[Chatwork] 送信先未設定` → 上記2を実施
   - `[Chatwork] 送信失敗:` の後に表示されるメッセージで Chatwork API のエラー内容を確認
