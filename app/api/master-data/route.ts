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

      employeeTypes.add(emp.employeeType)
    })

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

    // 既存データとデフォルトデータをマージ
    const groupedData = {
      department: [
        ...Array.from(departments).map(dept => ({ value: dept, label: dept })),
        ...defaultData.department.filter(item => !departments.has(item.value))
      ],
      position: [
        ...Array.from(positions).map(pos => ({ value: pos, label: pos })),
        ...defaultData.position.filter(item => !positions.has(item.value))
      ],
      organization: [
        ...Array.from(organizations).map(org => ({ value: org, label: org })),
        ...defaultData.organization.filter(item => !organizations.has(item.value))
      ],
      employeeType: [
        ...Array.from(employeeTypes).map(type => ({ value: type, label: type })),
        ...defaultData.employeeType.filter(item => !employeeTypes.has(item.value))
      ]
    }

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

// マスターデータを保存
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('マスターデータ保存エラー:', error)
    return NextResponse.json(
      { error: 'マスターデータの保存に失敗しました' },
      { status: 500 }
    )
  }
}