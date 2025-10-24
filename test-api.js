// APIテストスクリプト
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// テスト用の社員ID（実際のIDに置き換えてください）
const TEST_EMPLOYEE_ID = 'test-employee-id';

async function testCustomFoldersAPI() {
  console.log('=== カスタムフォルダAPIテスト ===');
  
  try {
    // 1. カスタムフォルダの取得テスト
    console.log('1. カスタムフォルダの取得テスト');
    const getResponse = await fetch(`${BASE_URL}/api/employees/${TEST_EMPLOYEE_ID}/folders?category=employee`);
    console.log('GET レスポンス:', getResponse.status);
    
    if (getResponse.ok) {
      const folders = await getResponse.json();
      console.log('取得されたフォルダ:', folders);
    }
    
    // 2. カスタムフォルダの保存テスト
    console.log('2. カスタムフォルダの保存テスト');
    const testFolders = ['テストフォルダ1', 'テストフォルダ2', 'テストフォルダ3'];
    
    const putResponse = await fetch(`${BASE_URL}/api/employees/${TEST_EMPLOYEE_ID}/folders`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folders: testFolders,
        category: 'employee'
      })
    });
    
    console.log('PUT レスポンス:', putResponse.status);
    
    if (putResponse.ok) {
      const result = await putResponse.json();
      console.log('保存結果:', result);
    } else {
      const error = await putResponse.text();
      console.log('保存エラー:', error);
    }
    
    // 3. 保存後の取得テスト
    console.log('3. 保存後の取得テスト');
    const getResponse2 = await fetch(`${BASE_URL}/api/employees/${TEST_EMPLOYEE_ID}/folders?category=employee`);
    if (getResponse2.ok) {
      const folders2 = await getResponse2.json();
      console.log('保存後のフォルダ:', folders2);
    }
    
  } catch (error) {
    console.error('カスタムフォルダAPIテストエラー:', error);
  }
}

async function testUserSettingsAPI() {
  console.log('\n=== ユーザー設定APIテスト ===');
  
  try {
    // 1. ユーザー設定の取得テスト
    console.log('1. ユーザー設定の取得テスト');
    const getResponse = await fetch(`${BASE_URL}/api/employees/${TEST_EMPLOYEE_ID}/settings`);
    console.log('GET レスポンス:', getResponse.status);
    
    if (getResponse.ok) {
      const settings = await getResponse.json();
      console.log('取得された設定:', settings);
    }
    
    // 2. パスワード表示設定の保存テスト
    console.log('2. パスワード表示設定の保存テスト');
    const putResponse1 = await fetch(`${BASE_URL}/api/employees/${TEST_EMPLOYEE_ID}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'password-visible',
        value: true
      })
    });
    
    console.log('PUT レスポンス (password-visible):', putResponse1.status);
    
    // 3. アバターテキストの保存テスト
    console.log('3. アバターテキストの保存テスト');
    const putResponse2 = await fetch(`${BASE_URL}/api/employees/${TEST_EMPLOYEE_ID}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'avatar-text',
        value: 'テストテキスト'
      })
    });
    
    console.log('PUT レスポンス (avatar-text):', putResponse2.status);
    
    // 4. 保存後の取得テスト
    console.log('4. 保存後の取得テスト');
    const getResponse2 = await fetch(`${BASE_URL}/api/employees/${TEST_EMPLOYEE_ID}/settings`);
    if (getResponse2.ok) {
      const settings2 = await getResponse2.json();
      console.log('保存後の設定:', settings2);
    }
    
  } catch (error) {
    console.error('ユーザー設定APIテストエラー:', error);
  }
}

async function testMasterDataAPI() {
  console.log('\n=== マスターデータAPIテスト ===');
  
  try {
    // 1. マスターデータの取得テスト
    console.log('1. マスターデータの取得テスト');
    const getResponse = await fetch(`${BASE_URL}/api/master-data`);
    console.log('GET レスポンス:', getResponse.status);
    
    if (getResponse.ok) {
      const masterData = await getResponse.json();
      console.log('取得されたマスターデータ:', masterData);
    }
    
    // 2. マスターデータの保存テスト
    console.log('2. マスターデータの保存テスト');
    const testData = [
      { value: 'テスト値1', label: 'テストラベル1' },
      { value: 'テスト値2', label: 'テストラベル2' }
    ];
    
    const putResponse = await fetch(`${BASE_URL}/api/master-data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test-type',
        data: testData
      })
    });
    
    console.log('PUT レスポンス:', putResponse.status);
    
    if (putResponse.ok) {
      const result = await putResponse.json();
      console.log('保存結果:', result);
    } else {
      const error = await putResponse.text();
      console.log('保存エラー:', error);
    }
    
  } catch (error) {
    console.error('マスターデータAPIテストエラー:', error);
  }
}

async function runAllTests() {
  console.log('APIテスト開始...\n');
  
  await testCustomFoldersAPI();
  await testUserSettingsAPI();
  await testMasterDataAPI();
  
  console.log('\nAPIテスト完了');
}

// テスト実行
runAllTests().catch(console.error);
