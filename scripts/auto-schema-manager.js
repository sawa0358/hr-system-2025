#!/usr/bin/env node

/**
 * 自動スキーマ管理システム
 * 環境を自動検出し、適切なスキーマに自動切り替え
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoSchemaManager {
  constructor() {
    this.baseSchemaPath = path.join(__dirname, '..', 'prisma', 'schema-base.prisma');
    this.currentSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    this.prodSchemaPath = path.join(__dirname, '..', 'prisma', 'schema-postgres.prisma');
  }

  // 環境を自動検出
  detectEnvironment() {
    const env = {
      isProduction: false,
      isDevelopment: false,
      isHeroku: false,
      isLocal: false,
      hasPostgresUrl: false,
      hasSqliteUrl: false
    };

    // Heroku環境の検出
    if (process.env.DYNO || process.env.HEROKU_APP_NAME) {
      env.isHeroku = true;
      env.isProduction = true;
    }

    // 本番環境の検出
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod') {
      env.isProduction = true;
    }

    // 開発環境の検出
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV) {
      env.isDevelopment = true;
    }

    // ローカル環境の検出
    if (!env.isHeroku && !process.env.CI) {
      env.isLocal = true;
    }

    // データベースURLの検出
    if (process.env.DATABASE_URL) {
      if (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://')) {
        env.hasPostgresUrl = true;
      } else if (process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.endsWith('.db')) {
        env.hasSqliteUrl = true;
      }
    }

    return env;
  }

  // 適切なスキーマを決定
  determineSchema(env) {
    if (env.isProduction || env.isHeroku || env.hasPostgresUrl) {
      return 'postgresql';
    } else if (env.isDevelopment || env.isLocal || env.hasSqliteUrl) {
      return 'sqlite';
    } else {
      // デフォルトは開発環境
      return 'sqlite';
    }
  }

  // ベーススキーマを読み込み
  readBaseSchema() {
    if (!fs.existsSync(this.baseSchemaPath)) {
      throw new Error(`ベーススキーマが見つかりません: ${this.baseSchemaPath}`);
    }
    return fs.readFileSync(this.baseSchemaPath, 'utf8');
  }

  // 環境別スキーマを生成
  generateSchema(baseSchema, provider) {
    const datasource = provider === 'postgresql' 
      ? `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
      : `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;

    return baseSchema.replace(
      'generator client {\n  provider = "prisma-client-js"\n}',
      `generator client {
  provider = "prisma-client-js"
}

${datasource}`
    );
  }

  // スキーマファイルを更新
  updateSchema(schema, targetPath) {
    fs.writeFileSync(targetPath, schema);
  }

  // データベーススキーマを適用
  pushSchema() {
    try {
      console.log('🔄 データベーススキーマを適用中...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('❌ データベーススキーマの適用に失敗:', error.message);
      return false;
    }
  }

  // Prismaクライアントを再生成
  regenerateClient() {
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('❌ Prismaクライアントの再生成に失敗:', error.message);
      return false;
    }
  }

  // 自動スキーマ管理を実行
  async run() {
    console.log('🤖 自動スキーマ管理システムを開始...');
    
    try {
      // 環境検出
      const env = this.detectEnvironment();
      console.log('🔍 環境検出結果:', {
        isProduction: env.isProduction,
        isDevelopment: env.isDevelopment,
        isHeroku: env.isHeroku,
        isLocal: env.isLocal,
        hasPostgresUrl: env.hasPostgresUrl,
        hasSqliteUrl: env.hasSqliteUrl
      });

      // 適切なスキーマを決定
      const provider = this.determineSchema(env);
      console.log(`📋 使用するデータベース: ${provider}`);

      // ベーススキーマを読み込み
      const baseSchema = this.readBaseSchema();

      // 環境別スキーマを生成
      const targetSchema = this.generateSchema(baseSchema, provider);

      // 現在のスキーマと比較
      let needsUpdate = true;
      if (fs.existsSync(this.currentSchemaPath)) {
        const currentSchema = fs.readFileSync(this.currentSchemaPath, 'utf8');
        if (currentSchema === targetSchema) {
          needsUpdate = false;
          console.log('✅ スキーマは既に最新です');
        }
      }

      if (needsUpdate) {
        // スキーマファイルを更新
        this.updateSchema(targetSchema, this.currentSchemaPath);
        console.log(`✅ スキーマを更新しました: ${provider}`);

        // データベーススキーマを適用（ローカル環境のみ、Herokuビルド時はスキップ）
        // Herokuではビルド時にデータベース接続ができないため、マイグレーションは別途実行
        if (!env.isHeroku && (env.isProduction || env.isLocal)) {
          if (this.pushSchema()) {
            console.log('✅ データベーススキーマを適用しました');
          } else {
            console.log('⚠️ データベーススキーマの適用に失敗しました');
          }
        } else if (env.isHeroku) {
          console.log('⏭️ Herokuビルド時はデータベーススキーマの適用をスキップします（postdeployで実行）');
        }

        // Prismaクライアントを再生成
        console.log('🔄 Prismaクライアントを再生成中...');
        if (this.regenerateClient()) {
          console.log('🎉 自動スキーマ管理が完了しました！');
        } else {
          console.log('⚠️ スキーマは更新されましたが、クライアント再生成に失敗しました');
        }
      } else {
        // スキーマが最新でも、ローカル環境の場合はデータベーススキーマを確認
        // Herokuビルド時はスキップ（ビルド時にデータベース接続ができないため）
        if (!env.isHeroku && (env.isProduction || env.isLocal)) {
          console.log('🔄 データベーススキーマを確認中...');
          if (this.pushSchema()) {
            console.log('✅ データベーススキーマを確認しました');
          }
        } else if (env.isHeroku) {
          console.log('⏭️ Herokuビルド時はデータベーススキーマの確認をスキップします');
        }

        // Prismaクライアントを再生成
        console.log('🔄 Prismaクライアントを再生成中...');
        this.regenerateClient();
      }

      // 本番環境用スキーマも更新（バックアップ用）
      if (provider === 'postgresql') {
        this.updateSchema(targetSchema, this.prodSchemaPath);
        console.log('📦 本番環境用スキーマも更新しました');
      }

    } catch (error) {
      console.error('❌ 自動スキーマ管理でエラーが発生:', error.message);
      process.exit(1);
    }
  }
}

// メイン実行
if (require.main === module) {
  const manager = new AutoSchemaManager();
  manager.run();
}

module.exports = AutoSchemaManager;
