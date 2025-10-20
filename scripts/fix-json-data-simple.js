const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function fixJsonData() {
  try {
    console.log('JSONデータの修正を開始します...');
    
    // SQLiteコマンドを使用してデータを修正
    const dbPath = path.join(__dirname, '../prisma/dev.db');
    
    // 各社員の部署・役職・組織データをJSON配列形式に更新
    const updateQueries = [
      `UPDATE employees SET department = json_array(department) WHERE json_type(department) != 'array'`,
      `UPDATE employees SET position = json_array(position) WHERE json_type(position) != 'array'`,
      `UPDATE employees SET organization = json_array(organization) WHERE json_type(organization) != 'array'`
    ];
    
    for (const query of updateQueries) {
      console.log(`実行中: ${query}`);
      execSync(`sqlite3 "${dbPath}" "${query}"`, { stdio: 'inherit' });
    }
    
    console.log('データ修正が完了しました！');
    
    // 結果を確認
    const selectQuery = 'SELECT id, name, department, position, organization FROM employees LIMIT 3';
    console.log('\n修正後のデータ確認:');
    execSync(`sqlite3 "${dbPath}" "${selectQuery}"`, { stdio: 'inherit' });
    
  } catch (error) {
    console.error('データ修正中にエラーが発生しました:', error);
  }
}

fixJsonData();
