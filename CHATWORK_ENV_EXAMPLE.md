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
