#!/usr/bin/env node

/**
 * API エンドポイントテストスクリプト
 * 自動保存機能とS3保存機能のテスト
 */

const baseUrl = 'http://localhost:3000'

// テスト用のヘッダー
const headers = {
  'Content-Type': 'application/json',
  'x-employee-id': 'cmh4h9i3e00048zijah4mdkh1' // 管理者ID
}

// テスト結果を記録
const testResults = []

// テスト関数
async function testEndpoint(name, url, method = 'GET', body = null) {
  try {
    console.log(`\n🧪 テスト: ${name}`)
    console.log(`📍 URL: ${method} ${url}`)
    
    const options = {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) })
    }
    
    const response = await fetch(url, options)
    const data = await response.json()
    
    const result = {
      name,
      url,
      method,
      status: response.status,
      success: response.ok,
      data: data
    }
    
    if (response.ok) {
      console.log(`✅ 成功 (${response.status})`)
      console.log(`📊 レスポンス:`, JSON.stringify(data, null, 2))
    } else {
      console.log(`❌ 失敗 (${response.status})`)
      console.log(`🚨 エラー:`, data)
    }
    
    testResults.push(result)
    return result
    
  } catch (error) {
    console.log(`💥 エラー: ${error.message}`)
    testResults.push({
      name,
      url,
      method,
      status: 'ERROR',
      success: false,
      error: error.message
    })
  }
}

// メインテスト実行
async function runTests() {
  console.log('🚀 API エンドポイントテスト開始')
  console.log(`🌐 ベースURL: ${baseUrl}`)
  
  // 1. 基本APIテスト
  await testEndpoint('社員一覧取得', `${baseUrl}/api/employees`)
  await testEndpoint('ワークスペース一覧取得', `${baseUrl}/api/workspaces`)
  await testEndpoint('ボード一覧取得', `${baseUrl}/api/boards`)
  
  // 2. タスク管理S3保存テスト
  await testEndpoint('タスク管理全体バックアップ', `${baseUrl}/api/task-management/backup`, 'POST')
  await testEndpoint('タスク管理バックアップ一覧取得', `${baseUrl}/api/task-management/restore`, 'GET')
  
  // 3. ワークスペースS3保存テスト
  await testEndpoint('ワークスペース保存', `${baseUrl}/api/workspaces/save`, 'POST', {
    workspaceId: 'test-workspace-id'
  })
  
  // 4. 組織図S3保存テスト
  await testEndpoint('組織図保存', `${baseUrl}/api/organization-chart/save`, 'POST')
  await testEndpoint('組織図バックアップ一覧取得', `${baseUrl}/api/organization-chart/restore`, 'GET')
  
  // 5. 自動バックアップテスト
  await testEndpoint('自動バックアップ実行', `${baseUrl}/api/backup`, 'POST')
  await testEndpoint('バックアップステータス取得', `${baseUrl}/api/backup/status`, 'GET')
  
  // 結果サマリー
  console.log('\n📋 テスト結果サマリー')
  console.log('=' * 50)
  
  const successCount = testResults.filter(r => r.success).length
  const totalCount = testResults.length
  
  console.log(`✅ 成功: ${successCount}/${totalCount}`)
  console.log(`❌ 失敗: ${totalCount - successCount}/${totalCount}`)
  
  // 失敗したテストの詳細
  const failedTests = testResults.filter(r => !r.success)
  if (failedTests.length > 0) {
    console.log('\n🚨 失敗したテスト:')
    failedTests.forEach(test => {
      console.log(`- ${test.name}: ${test.status} ${test.error || test.data?.error || ''}`)
    })
  }
  
  // 成功したテストの詳細
  const successTests = testResults.filter(r => r.success)
  if (successTests.length > 0) {
    console.log('\n✅ 成功したテスト:')
    successTests.forEach(test => {
      console.log(`- ${test.name}: ${test.status}`)
    })
  }
  
  console.log('\n🏁 テスト完了')
}

// スクリプト実行
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testEndpoint, runTests }
