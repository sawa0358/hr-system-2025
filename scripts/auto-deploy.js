#!/usr/bin/env node

/**
 * 自動デプロイシステム
 * 環境検出とスキーマ管理を自動化
 */

const { execSync } = require('child_process');
const AutoSchemaManager = require('./auto-schema-manager');

class AutoDeploy {
  constructor() {
    this.manager = new AutoSchemaManager();
  }

  // 環境を検出
  detectEnvironment() {
    return this.manager.detectEnvironment();
  }

  // デプロイ前の準備
  async prepareDeploy() {
    console.log('🚀 自動デプロイ準備を開始...');

    try {
      // 1. 自動スキーマ管理
      console.log('📋 スキーマ管理を実行中...');
      await this.manager.run();

      // 2. 環境検出
      const env = this.detectEnvironment();
      console.log('🔍 環境:', env.isProduction ? '本番環境' : '開発環境');

      // 3. 本番環境用スキーマでビルドテスト
      if (env.isProduction) {
        console.log('🔨 本番環境用ビルドテストを実行中...');
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ ビルドテストが成功しました');
      }

      console.log('🎉 デプロイ準備が完了しました！');

    } catch (error) {
      console.error('❌ デプロイ準備に失敗しました:', error.message);
      throw error;
    }
  }

  // Herokuデプロイ
  async deployToHeroku() {
    console.log('🚀 Herokuデプロイを開始...');

    try {
      // デプロイ準備
      await this.prepareDeploy();

      // Git status確認
      console.log('📋 Git status確認中...');
      execSync('git status', { stdio: 'inherit' });

      // 変更をコミット
      console.log('💾 変更をコミット中...');
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "auto: 自動スキーマ管理とデプロイ準備"', { stdio: 'inherit' });

      // Herokuにデプロイ
      console.log('🌐 Herokuにデプロイ中...');
      execSync('git push heroku main', { stdio: 'inherit' });

      console.log('🎉 Herokuデプロイが完了しました！');

    } catch (error) {
      console.error('❌ Herokuデプロイに失敗しました:', error.message);
      throw error;
    }
  }

  // ローカル開発環境の起動
  async startDevelopment() {
    console.log('🛠️ 開発環境を起動中...');

    try {
      // 自動スキーマ管理
      await this.manager.run();

      // 開発サーバー起動
      console.log('🚀 開発サーバーを起動中...');
      execSync('npm run dev', { stdio: 'inherit' });

    } catch (error) {
      console.error('❌ 開発環境の起動に失敗しました:', error.message);
      throw error;
    }
  }

  // メイン実行
  async run() {
    const env = this.detectEnvironment();

    if (env.isHeroku || env.isProduction) {
      await this.deployToHeroku();
    } else {
      await this.startDevelopment();
    }
  }
}

// メイン実行
if (require.main === module) {
  const deployer = new AutoDeploy();
  deployer.run().catch(error => {
    console.error('❌ 自動デプロイに失敗しました:', error.message);
    process.exit(1);
  });
}

module.exports = AutoDeploy;
