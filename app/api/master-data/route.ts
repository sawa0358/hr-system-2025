import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 新しいマスターデータに基づくデータを返す
    const masterData = {
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

    return NextResponse.json({
      success: true,
      data: masterData
    })
  } catch (error) {
    console.error('マスターデータ取得エラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'マスターデータの取得に失敗しました',
        details: error.message 
      },
      { status: 500 }
    )
  }
}