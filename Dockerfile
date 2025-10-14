FROM node:22-alpine

WORKDIR /app

# 依存関係をインストール
COPY package*.json ./
RUN npm ci

# アプリケーションコードをコピー
COPY . .

# Prismaクライアントを生成
RUN npx prisma generate

# ポートを公開
EXPOSE 3000

# 開発サーバーを起動
CMD ["npm", "run", "dev"]
