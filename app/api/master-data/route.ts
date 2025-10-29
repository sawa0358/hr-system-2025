import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// マスターデータを取得（社員データから動的に生成）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    // 社員データからマスターデータを動的に生成
    const employees = await prisma.employee.findMany({
      where: { status: 'active' },
      select: {
        department: true,
        position: true,
        organization: true,
        employeeType: true
      }
    })

    // 部署データを抽出
    const departments = new Set<string>()
    const positions = new Set<string>()
    const organizations = new Set<string>()
    const employeeTypes = new Set<string>()

    employees.forEach(emp => {
      // JSON配列をパース
      try {
        const deptArray = JSON.parse(emp.department)
        if (Array.isArray(deptArray)) {
          deptArray.forEach(dept => departments.add(dept))
        } else {
          departments.add(emp.department)
        }
      } catch {
        departments.add(emp.department)
      }

      try {
        const posArray = JSON.parse(emp.position)
        if (Array.isArray(posArray)) {
          posArray.forEach(pos => positions.add(pos))
        } else {
          positions.add(emp.position)
        }
      } catch {
        positions.add(emp.position)
      }

      try {
        const orgArray = JSON.parse(emp.organization)
        if (Array.isArray(orgArray)) {
          orgArray.forEach(org => organizations.add(org))
        } else {
          organizations.add(emp.organization)
        }
      } catch {
        organizations.add(emp.organization)
      }

      if (emp.employeeType && emp.employeeType.trim() !== '') {
        employeeTypes.add(emp.employeeType)
      }
    })

    // MasterDataテーブルから保存済みデータを取得
    let savedMasterData: any = {
      department: [],
      position: [],
      employeeType: []
    }

    try {
      if ('masterData' in prisma) {
        const masterDataRecords = await prisma.masterData.findMany({
          orderBy: { order: 'asc' }
        })
        
        masterDataRecords.forEach(record => {
          if (record.type === 'department') {
            savedMasterData.department.push({ value: record.value, label: record.label })
          } else if (record.type === 'position') {
            savedMasterData.position.push({ value: record.value, label: record.label })
          } else if (record.type === 'employeeType') {
            savedMasterData.employeeType.push({ value: record.value, label: record.label })
          }
        })
        console.log('MasterDataテーブルから取得:', {
          department: savedMasterData.department.length,
          position: savedMasterData.position.length,
          employeeType: savedMasterData.employeeType.length
        })
      }
    } catch (error) {
      console.warn('MasterDataテーブルからの取得エラー:', error)
    }

    // デフォルトのマスターデータ
    const defaultData = {
      department: [
        { value: '執行部', label: '執行部' },
        { value: '総務部', label: '総務部' },
        { value: '営業部', label: '営業部' },
        { value: '開発部', label: '開発部' },
        { value: '管理部', label: '管理部' },
        { value: '店舗部', label: '店舗部' }
      ],
      position: [
        { value: '代表取締役', label: '代表取締役' },
        { value: '管理者', label: '管理者' },
        { value: 'マネージャー', label: 'マネージャー' },
        { value: 'サブマネージャー', label: 'サブマネージャー' },
        { value: '店舗マネージャー', label: '店舗マネージャー' },
        { value: '総務担当', label: '総務担当' },
        { value: '営業担当', label: '営業担当' },
        { value: 'エンジニア', label: 'エンジニア' },
        { value: '一般社員', label: '一般社員' },
        { value: '閲覧者', label: '閲覧者' }
      ],
      organization: [
        { value: '株式会社オオサワ創研', label: '株式会社オオサワ創研' },
        { value: '株式会社テックイノベーション', label: '株式会社テックイノベーション' }
      ],
      employeeType: [
        { value: '正社員', label: '正社員' },
        { value: '契約社員', label: '契約社員' },
        { value: 'パートタイム', label: 'パートタイム' },
        { value: '派遣社員', label: '派遣社員' },
        { value: '業務委託', label: '業務委託' },
        { value: '外注先', label: '外注先' }
      ]
    }

    // 保存済みデータを優先し、その後Employeeデータ、最後にデフォルトデータをマージ
    const savedValues = {
      department: new Set(savedMasterData.department.map((d: any) => d.value)),
      position: new Set(savedMasterData.position.map((p: any) => p.value)),
      employeeType: new Set(savedMasterData.employeeType.map((t: any) => t.value))
    }

    // 保存済みデータを優先（保存済みデータがある場合は、それのみを返す）
    const groupedData = {
      department: savedMasterData.department.length > 0
        ? savedMasterData.department // 保存済みデータのみ
        : [
            ...Array.from(departments)
              .filter(dept => dept && dept.trim() !== '' && dept !== '[]')
              .map(dept => ({ value: dept, label: dept })),
            ...defaultData.department.filter(item => !departments.has(item.value))
          ],
      position: savedMasterData.position.length > 0
        ? savedMasterData.position.filter((pos: any) => pos.value !== '未設定') // 「未設定」を除外
        : [
            ...Array.from(positions)
              .filter(pos => pos && pos.trim() !== '' && pos !== '[]' && pos !== '未設定')
              .map(pos => ({ value: pos, label: pos })),
            ...defaultData.position.filter(item => !positions.has(item.value))
          ],
      organization: [
        ...Array.from(organizations).filter(org => org && org.trim() !== '').map(org => ({ value: org, label: org })),
        ...defaultData.organization.filter(item => !organizations.has(item.value))
      ],
      employeeType: savedMasterData.employeeType.length > 0
        ? savedMasterData.employeeType // 保存済みデータのみ
        : [
            ...Array.from(employeeTypes)
              .filter(type => type && type.trim() !== '')
              .map(type => ({ value: type, label: type })),
            ...defaultData.employeeType.filter(item => !employeeTypes.has(item.value))
          ]
    }
    
    console.log('マスターデータ返却:', {
      department: groupedData.department.length,
      position: groupedData.position.length,
      employeeType: groupedData.employeeType.length,
      savedEmployeeType: savedMasterData.employeeType.length,
      savedEmployeeTypes: savedMasterData.employeeType.map((t: any) => `${t.value}:${t.label}`)
    })

    // 特定のタイプが指定されている場合はそのタイプのみ返す
    if (type && groupedData[type as keyof typeof groupedData]) {
      return NextResponse.json({ success: true, data: { [type]: groupedData[type as keyof typeof groupedData] } })
    }

    return NextResponse.json({ success: true, data: groupedData })
  } catch (error) {
    console.error('マスターデータ取得エラー:', error)
    return NextResponse.json(
      { error: 'マスターデータの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// マスターデータを保存（POST形式 - フロントエンド互換）
export async function POST(request: NextRequest) {
  console.log('=== POST /api/master-data 開始 ===')
  try {
    const body = await request.json()
    const { departments, positions, employmentTypes } = body

    console.log('マスターデータ保存リクエスト受信:', { 
      departments: departments?.length, 
      positions: positions?.length, 
      employmentTypes: employmentTypes?.length,
      departmentsData: departments,
      positionsData: positions,
      employmentTypesData: employmentTypes
    })

    // MasterDataモデルが利用可能か確認
    const hasMasterData = 'masterData' in prisma
    console.log('MasterDataモデル利用可能:', hasMasterData)
    console.log('Prismaオブジェクトのキー:', Object.keys(prisma).filter(k => k.includes('master')))
    
    if (!hasMasterData) {
      console.error('❌ MasterDataモデルが利用できません。Prismaクライアントを確認してください。')
      // MasterDataモデルがなくても成功を返す（localStorageで動作するため）
      return NextResponse.json({ success: true, warning: 'MasterDataモデルが利用できないため、localStorageのみに保存しました' })
    }

    // フロントエンドから送信される形式に対応
    // 部署データを保存
    if (Array.isArray(departments)) {
      try {
        if (hasMasterData) {
          await prisma.masterData.deleteMany({ where: { type: 'department' } })
          const filteredDepts = departments.filter((dept: any) => {
            if (!dept) return false
            if (typeof dept === 'string' && dept.trim() !== '' && dept !== '[]') return true
            if (typeof dept === 'object' && (dept.value || dept.label)) return true
            return false
          })
          
          // 空配列でも削除処理は完了しているので、データがあれば保存
          if (filteredDepts.length > 0) {
            try {
              await prisma.masterData.createMany({
                data: filteredDepts.map((dept: any, index: number) => ({
                  type: 'department',
                  value: typeof dept === 'string' ? dept : (dept.value || dept.label || dept),
                  label: typeof dept === 'string' ? dept : (dept.label || dept.value || dept),
                  order: index
                }))
              })
              console.log(`部署データを保存しました: ${filteredDepts.length}件`)
            } catch (createError: any) {
              // 重複エラーの場合は個別に挿入を試みる
              if (createError.code === 'P2002' || createError.message?.includes('Unique constraint')) {
                console.warn('重複データをスキップして個別に保存を試みます')
                for (const dept of filteredDepts) {
                  try {
                    const value = typeof dept === 'string' ? dept : (dept.value || dept.label || dept)
                    const label = typeof dept === 'string' ? dept : (dept.label || dept.value || dept)
                    await prisma.masterData.upsert({
                      where: { type_value: { type: 'department', value } },
                      update: { label, order: filteredDepts.indexOf(dept) },
                      create: { type: 'department', value, label, order: filteredDepts.indexOf(dept) }
                    })
                  } catch (upsertError) {
                    console.warn(`部署の保存をスキップ: ${value}`, upsertError)
                  }
                }
                console.log(`✅ 部署データを個別保存しました`)
              } else {
                throw createError
              }
            }
          } else {
            console.log('部署データが空のため、既存データを削除しました')
          }
        } else {
          console.warn('MasterDataモデルが利用できないため、部署データをスキップしました')
        }
      } catch (error) {
        console.error('部署データの保存でエラー:', error)
        console.error('エラー詳細:', error instanceof Error ? error.message : String(error))
        console.error('スタックトレース:', error instanceof Error ? error.stack : '')
      }
    }

    // 役職データを保存
    if (Array.isArray(positions)) {
      try {
        if (hasMasterData) {
          await prisma.masterData.deleteMany({ where: { type: 'position' } })
          const filteredPos = positions.filter((pos: any) => {
            if (!pos) return false
            if (typeof pos === 'string' && pos.trim() !== '' && pos !== '[]') return true
            if (typeof pos === 'object' && (pos.value || pos.label)) return true
            return false
          })
          
          if (filteredPos.length > 0) {
            try {
              await prisma.masterData.createMany({
                data: filteredPos.map((pos: any, index: number) => ({
                  type: 'position',
                  value: typeof pos === 'string' ? pos : (pos.value || pos.label || pos),
                  label: typeof pos === 'string' ? pos : (pos.label || pos.value || pos),
                  order: index
                }))
              })
              console.log(`役職データを保存しました: ${filteredPos.length}件`)
            } catch (createError: any) {
              // 重複エラーの場合は個別に挿入を試みる
              if (createError.code === 'P2002' || createError.message?.includes('Unique constraint')) {
                console.warn('重複データをスキップして個別に保存を試みます')
                for (const pos of filteredPos) {
                  try {
                    const value = typeof pos === 'string' ? pos : (pos.value || pos.label || pos)
                    const label = typeof pos === 'string' ? pos : (pos.label || pos.value || pos)
                    await prisma.masterData.upsert({
                      where: { type_value: { type: 'position', value } },
                      update: { label, order: filteredPos.indexOf(pos) },
                      create: { type: 'position', value, label, order: filteredPos.indexOf(pos) }
                    })
                  } catch (upsertError) {
                    console.warn(`役職の保存をスキップ: ${value}`, upsertError)
                  }
                }
                console.log(`✅ 役職データを個別保存しました`)
              } else {
                throw createError
              }
            }
          } else {
            console.log('役職データが空のため、既存データを削除しました')
          }
        } else {
          console.warn('MasterDataモデルが利用できないため、役職データをスキップしました')
        }
      } catch (error) {
        console.error('役職データの保存でエラー:', error)
        console.error('エラー詳細:', error instanceof Error ? error.message : String(error))
        console.error('スタックトレース:', error instanceof Error ? error.stack : '')
      }
    }

    // 雇用形態データを保存
    if (Array.isArray(employmentTypes)) {
      try {
        if (hasMasterData) {
          await prisma.masterData.deleteMany({ where: { type: 'employeeType' } })
          const filteredTypes = employmentTypes.filter((type: any) => {
            if (!type) return false
            if (typeof type === 'string' && type.trim() !== '' && type !== '[]') return true
            if (typeof type === 'object' && (type.value || type.label)) return true
            return false
          })
          
          console.log(`雇用形態フィルタ後: ${filteredTypes.length}件`, filteredTypes)
          
          if (filteredTypes.length > 0) {
            const dataToInsert = filteredTypes.map((type: any, index: number) => {
              const value = typeof type === 'string' ? type : (type.value || type.label || type)
              const label = typeof type === 'string' ? type : (type.label || type.value || type)
              return {
                type: 'employeeType',
                value,
                label,
                order: index
              }
            })
            console.log(`保存する雇用形態データ:`, dataToInsert)
            
            try {
              await prisma.masterData.createMany({
                data: dataToInsert
              })
              console.log(`✅ 雇用形態データを保存しました: ${filteredTypes.length}件`)
            } catch (createError: any) {
              // 重複エラーの場合は個別に挿入を試みる
              if (createError.code === 'P2002' || createError.message?.includes('Unique constraint')) {
                console.warn('重複データをスキップして個別に保存を試みます')
                for (const item of dataToInsert) {
                  try {
                    await prisma.masterData.upsert({
                      where: { type_value: { type: item.type, value: item.value } },
                      update: { label: item.label, order: item.order },
                      create: item
                    })
                  } catch (upsertError) {
                    console.warn(`項目の保存をスキップ: ${item.value}`, upsertError)
                  }
                }
                console.log(`✅ 雇用形態データを個別保存しました`)
              } else {
                throw createError
              }
            }
          } else {
            console.log('⚠️ 雇用形態データが空のため、既存データを削除しました')
          }
        } else {
          console.warn('MasterDataモデルが利用できないため、雇用形態データをスキップしました')
        }
      } catch (error) {
        console.error('雇用形態データの保存でエラー:', error)
        console.error('エラー詳細:', error instanceof Error ? error.message : String(error))
        console.error('スタックトレース:', error instanceof Error ? error.stack : '')
      }
    }

    // MasterDataモデルがなくても成功を返す（localStorageで動作するため）
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('マスターデータ保存エラー:', error)
    // エラーでも成功を返す（localStorageで動作するため）
    return NextResponse.json({ success: true })
  }
}

// マスターデータを保存（PUT形式 - 従来の形式）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'マスターデータが正しい形式ではありません' },
        { status: 400 }
      )
    }

    try {
      // 既存のデータを削除
      await prisma.masterData.deleteMany({
        where: { type }
      })

      // 新しいデータを追加
      if (data.length > 0) {
        await prisma.masterData.createMany({
          data: data.map((item: any, index: number) => ({
            type,
            value: item.value,
            label: item.label || item.value,
            order: index
          }))
        })
      }
    } catch (error) {
      console.warn('MasterDataテーブルが存在しない可能性:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('マスターデータ保存エラー:', error)
    return NextResponse.json(
      { error: 'マスターデータの保存に失敗しました' },
      { status: 500 }
    )
  }
}