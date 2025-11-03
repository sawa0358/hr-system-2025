const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 本番環境のデータベーススキーマをバックアップ
 * Prismaのdb pullを使って本番DBからスキーマを取得
 */
async function backupProductionSchema() {
  try {
    console.log('📊 本番環境のデータベーススキーマをバックアップします...');
    
    const backupDir = path.join(__dirname, '../prisma/schema-backups');
    
    // バックアップディレクトリが存在しない場合は作成
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 バックアップディレクトリを作成しました:', backupDir);
    }
    
    // 現在のスキーマをバックアップ（念のため）
    const currentSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
    if (fs.existsSync(currentSchemaPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const currentBackupName = `schema.current.${timestamp}.prisma`;
      const currentBackupPath = path.join(backupDir, currentBackupName);
      fs.copyFileSync(currentSchemaPath, currentBackupPath);
      console.log(`💾 現在のスキーマをバックアップしました: ${currentBackupName}`);
    }
    
    // 本番環境のスキーマを取得
    console.log('🔄 Herokuからデータベーススキーマを取得しています...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const productionBackupName = `schema.production.${timestamp}.prisma`;
    const productionBackupPath = path.join(backupDir, productionBackupName);
    
    // 本番環境でprisma db pullを実行してスキーマを取得
    // 注意: DATABASE_URL環境変数が本番のものに設定されている必要があります
    const dbUrl = process.env.DATABASE_URL || process.env.HEROKU_POSTGRESQL_URL;
    
    if (!dbUrl) {
      console.error('❌ DATABASE_URL環境変数が設定されていません');
      console.log('💡 HerokuからデータベースURLを取得するには:');
      console.log('   heroku config:get DATABASE_URL --app hr-system-2025');
      process.exit(1);
    }
    
    // 一時的に本番DBからスキーマをpull
    console.log('📥 本番データベースからスキーマを取得中...');
    
    try {
      // prisma db pullを実行
      execSync(`DATABASE_URL="${dbUrl}" npx prisma db pull`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: dbUrl
        }
      });
      
      // 取得したスキーマをバックアップ
      if (fs.existsSync(currentSchemaPath)) {
        fs.copyFileSync(currentSchemaPath, productionBackupPath);
        console.log(`✅ 本番スキーマをバックアップしました: ${productionBackupName}`);
        
        // スキーマ情報を表示
        const schemaContent = fs.readFileSync(currentSchemaPath, 'utf8');
        const modelCount = (schemaContent.match(/^model\s+\w+/gm) || []).length;
        const enumCount = (schemaContent.match(/^enum\s+\w+/gm) || []).length;
        
        console.log(`📊 取得したスキーマ情報:`);
        console.log(`   - モデル数: ${modelCount}`);
        console.log(`   - 列挙型数: ${enumCount}`);
      } else {
        console.error('❌ スキーマファイルが見つかりません');
      }
    } catch (error) {
      console.error('❌ スキーマ取得に失敗しました:', error.message);
      console.log('\n💡 別の方法: pg_dumpを使用してスキーマのみをバックアップ');
      process.exit(1);
    }
    
    console.log(`\n✅ バックアップが完了しました！`);
    console.log(`📁 保存先: ${productionBackupPath}`);
    
  } catch (error) {
    console.error('❌ バックアップ中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
backupProductionSchema();

