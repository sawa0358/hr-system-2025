import { NextRequest, NextResponse } from "next/server"
import { uploadFileToS3, getSignedDownloadUrl } from '@/lib/s3-client'

export async function GET() {
  try {
    // S3 に保存されたマスターデータがあれば優先して返す
    const filePath = 'master-data/master-data.json'
    try {
      const signed = await getSignedDownloadUrl(filePath)
      if (signed.success && signed.url) {
        const res = await fetch(signed.url)
        if (res.ok) {
          const data = await res.json()
          return NextResponse.json({ success: true, data })
        }
      }
    } catch (e) {
      // S3に存在しない／取得失敗時はデフォルトを返す
      console.warn('master-data GET: fallback to defaults')
    }

    const fallback = {
      departments: [
        "執行部",
        "広店",
        "焼山店",
        "不動産部",
        "工務部",
        "チカラもち",
        "福祉部"
      ],
      positions: [
        "代表取締役",
        "執行役員",
        "統括店長",
        "店長",
        "工務長",
        "福祉長",
        "アドバイザー",
        "内勤",
        "広報",
        "総務",
        "経理",
        "工務",
        "プランナー",
        "チームリーダー",
        "サービス管理責任者",
        "管理者"
      ],
      employmentTypes: [
        "正社員",
        "契約社員",
        "パートタイム",
        "派遣社員",
        "業務委託",
        "外注先"
      ]
    }

    return NextResponse.json({ success: true, data: fallback })
  } catch (error) {
    console.error('マスターデータ取得エラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'マスターデータの取得に失敗しました',
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { departments, positions, employmentTypes } = body || {}

    // バリデーション（最低限）
    const isValidArray = (arr: unknown) => Array.isArray(arr) && arr.every(v => typeof v === 'string')
    if (
      (departments !== undefined && !isValidArray(departments)) ||
      (positions !== undefined && !isValidArray(positions)) ||
      (employmentTypes !== undefined && !isValidArray(employmentTypes))
    ) {
      return NextResponse.json({ success: false, error: '不正なデータ形式です' }, { status: 400 })
    }

    // 既存ファイルの有無に関わらず上書き保存
    const payload = JSON.stringify({
      departments: departments ?? [],
      positions: positions ?? [],
      employmentTypes: employmentTypes ?? []
    }, null, 2)

    const buffer = Buffer.from(payload, 'utf-8')
    const result = await uploadFileToS3(buffer, 'master-data.json', 'application/json', 'master-data')
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || '保存に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'マスターデータを保存しました' })
  } catch (error) {
    console.error('マスターデータ保存エラー:', error)
    return NextResponse.json(
      { success: false, error: 'マスターデータの保存に失敗しました', details: (error as Error).message },
      { status: 500 }
    )
  }
}