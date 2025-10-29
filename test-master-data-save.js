const testMasterDataSave = async () => {
  console.log('=== マスターデータ保存テスト開始 ===')
  
  try {
    // テストデータ
    const testData = {
      departments: ['執行部', '総務部', '営業部', '開発部'],
      positions: ['代表取締役', '管理者', 'マネージャー', '一般社員'],
      employmentTypes: [
        { value: '正社員', label: '正社員' },
        { value: '契約社員', label: '契約社員' },
        { value: 'パートタイム', label: 'パートタイム' }
      ]
    }
    
    console.log('送信データ:', testData)
    
    // APIに送信
    const response = await fetch('http://localhost:3000/api/master-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    console.log('レスポンスステータス:', response.status)
    console.log('レスポンスOK:', response.ok)
    
    const result = await response.json()
    console.log('レスポンス結果:', result)
    
    if (response.ok) {
      console.log('✅ マスターデータ保存成功')
      
      // 保存後にデータを取得して確認
      const getResponse = await fetch('http://localhost:3000/api/master-data')
      const getResult = await getResponse.json()
      console.log('保存後のデータ取得結果:', getResult)
      
    } else {
      console.error('❌ マスターデータ保存失敗:', result)
    }
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error)
  }
}

// テスト実行
testMasterDataSave()
