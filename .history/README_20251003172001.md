# HR Management System

人事管理システム - 社員情報、勤怠、評価、給与、タスク管理を統合したWebアプリケーション

## 🚀 技術スタック

- **フロントエンド**: Next.js 14, React 18, TypeScript
- **UI**: Tailwind CSS, Radix UI
- **データベース**: Prisma ORM, SQLite (開発) / PostgreSQL (本番)
- **認証**: NextAuth.js
- **ファイル管理**: AWS S3
- **デプロイ**: Heroku

## 📦 セットアップ

### 1. 依存関係のインストール

```bash
npm install
# または
pnpm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、必要な環境変数を設定してください：

```bash
cp .env.local.example .env.local
```

### 3. データベースの初期化

```bash
# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーション
npx prisma db push

# シードデータの投入（オプション）
npx prisma db seed
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## 🗄️ データベース設計

### 主要テーブル

- **Employee**: 社員情報、権限管理
- **Evaluation**: 評価データ
- **Task**: タスク管理
- **Attendance**: 勤怠記録
- **Payroll**: 給与データ
- **File/Folder**: ファイル管理
- **ActivityLog**: アクティビティログ

### 権限レベル

- `admin`: システム管理者
- `hr`: 人事部
- `manager`: 管理者
- `sub_manager`: サブ管理者
- `general`: 一般社員
- `viewer`: 閲覧のみ

## 🚀 デプロイ

### Heroku + AWS S3

1. **Herokuアプリの作成**
```bash
heroku create your-hr-app
```

2. **環境変数の設定**
```bash
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set AWS_ACCESS_KEY_ID="your-key"
heroku config:set AWS_SECRET_ACCESS_KEY="your-secret"
heroku config:set AWS_S3_BUCKET_NAME="your-bucket"
```

3. **デプロイ**
```bash
git push heroku main
```

## 📁 プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── attendance/         # 勤怠管理
│   ├── employees/          # 社員管理
│   ├── evaluations/        # 評価管理
│   ├── payroll/           # 給与管理
│   └── tasks/             # タスク管理
├── components/            # Reactコンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   └── ...               # 機能別コンポーネント
├── lib/                  # ユーティリティ
├── prisma/               # データベーススキーマ
└── public/               # 静的ファイル
```

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# リント
npm run lint

# Prisma Studio（データベースGUI）
npx prisma studio
```

## 📝 主要機能

- **社員管理**: 社員情報の登録・編集・検索
- **勤怠管理**: 出退勤記録、残業時間管理
- **評価管理**: 四半期評価、スコア管理
- **給与管理**: 給与計算、手当・控除管理
- **タスク管理**: カンバンボード、プロジェクト管理
- **ファイル管理**: ドキュメント管理、フォルダ構造
- **権限管理**: ロールベースのアクセス制御

## 🤝 貢献

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
