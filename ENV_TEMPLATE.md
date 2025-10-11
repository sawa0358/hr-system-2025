# 環境変数テンプレート

プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下の内容をコピーしてください。

```bash
# Gemini API Configuration
# Google AI StudioでAPIキーを取得してください: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration (開発環境)
DATABASE_URL="file:./prisma/dev.db"
```

## セットアップ手順

1. `.env.local` ファイルを作成
2. 上記の内容をコピー
3. `your_gemini_api_key_here` を実際のAPIキーに置き換え
4. 開発サーバーを再起動: `npm run dev`

詳細は `GEMINI_API_SETUP.md` を参照してください。

