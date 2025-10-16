FROM node:22-alpine

WORKDIR /app

# 依存関係をインストール
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションコードをコピー
COPY . .

# PostgreSQL用のスキーマを使用
RUN cp prisma/schema-postgres.prisma prisma/schema.prisma

# Prismaクライアントを生成
RUN npx prisma generate

# アプリケーションをビルド
RUN npm run build

# ポートを公開
EXPOSE 3000

# 本番サーバーを起動
CMD ["npm", "start"]
