import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 家族構成データを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const familyMembers = await prisma.familyMember.findMany({
      where: { employeeId: params.id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(familyMembers)
  } catch (error) {
    console.error('家族構成データ取得エラー:', error)
    return NextResponse.json(
      { error: '家族構成データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 家族構成データを保存
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { familyMembers } = body

    if (!Array.isArray(familyMembers)) {
      return NextResponse.json(
        { error: '家族構成データが正しい形式ではありません' },
        { status: 400 }
      )
    }

    // 既存の家族データを削除
    await prisma.familyMember.deleteMany({
      where: { employeeId: params.id }
    })

    // 新しい家族データを追加
    if (familyMembers.length > 0) {
      await prisma.familyMember.createMany({
        data: familyMembers.map((member: any) => ({
          employeeId: params.id,
          name: member.name,
          relationship: member.relationship,
          birthDate: member.birthday ? new Date(member.birthday) : null,
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('家族構成データ保存エラー:', error)
    return NextResponse.json(
      { error: '家族構成データの保存に失敗しました' },
      { status: 500 }
    )
  }
}
