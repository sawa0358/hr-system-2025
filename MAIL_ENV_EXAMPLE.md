# メール設定用環境変数の例

このファイルの内容を `.env.local` ファイルに追加してください。

## .env.local に追加する内容

```bash
# =====================================
# メール通知設定（Gmail SMTP）
# =====================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# あなたのGmailアドレスを入力
SMTP_USER=your-email@gmail.com

# Googleアプリパスワード（16桁、スペースなし）
# 取得方法: https://myaccount.google.com/apppasswords
SMTP_PASS=abcdefghijklmnop

# 送信元として表示されるメールアドレス
MAIL_FROM=your-email@gmail.com
```

## 設定手順

### 1. `.env.local` ファイルを開く

プロジェクトのルートディレクトリにある `.env.local` ファイルを開いてください。

### 2. 上記の設定を追加

ファイルの最後に上記の内容をコピー＆ペーストしてください。

### 3. 値を実際の値に置き換える

- `your-email@gmail.com` → あなたのGmailアドレス
- `abcdefghijklmnop` → Googleアプリパスワード

### 4. 保存して開発サーバーを再起動

```bash
npm run dev
```

## Heroku本番環境への設定

ターミナルで以下のコマンドを実行してください：

```bash
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_SECURE=false
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-app-password
heroku config:set MAIL_FROM=your-email@gmail.com
```

**注意**: `your-email@gmail.com` と `your-app-password` を実際の値に置き換えてください。

## 詳細な手順

詳しい設定方法は `MAIL_SETUP_GUIDE.md` を参照してください。














