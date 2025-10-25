import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  saveFamilyMembersToS3, 
  getFamilyMembersFromS3 
} from '@/lib/s3-client'

// 家族構成データを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`家族構成取得開始: ${params.id}`);
    
    // S3から優先的にデータを取得
    const s3Result = await getFamilyMembersFromS3(params.id);
    
    let familyMembers;
    if (s3Result.success && s3Result.data) {
      console.log(`S3から家族構成を取得: ${params.id}`, s3Result.data);
      familyMembers = s3Result.data;
    } else {
      console.log(`データベースから家族構成を取得: ${params.id}`);
      familyMembers = await prisma.familyMember.findMany({
        where: { employeeId: params.id },
        orderBy: { createdAt: 'asc' }
      });
      console.log(`データベースから取得した家族構成:`, familyMembers);
    }

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
    let savedFamilyMembers = [];
    if (familyMembers.length > 0) {
      const familyData = familyMembers.map((member: any) => ({
        employeeId: params.id,
        name: member.name,
        relationship: member.relationship,
        birthDate: member.birthday ? new Date(member.birthday) : null,
      }));

      console.log('保存する家族データ:', familyData);

      try {
        console.log('データベース保存開始:', familyData);
        const result = await prisma.familyMember.createMany({
          data: familyData
        });
        console.log('家族データ保存成功:', result);
        
        // 保存後のデータを確認
        const savedData = await prisma.familyMember.findMany({
          where: { employeeId: params.id },
          orderBy: { createdAt: 'asc' }
        });
        console.log('保存後のデータベース確認:', savedData);
      } catch (error) {
        console.error('家族データ保存エラー:', error);
        console.error('エラーの詳細:', {
          message: error.message,
          code: error.code,
          meta: error.meta
        });
        throw error;
      }

      // 保存されたデータを取得
      savedFamilyMembers = await prisma.familyMember.findMany({
        where: { employeeId: params.id },
        orderBy: { createdAt: 'asc' }
      });
    }

    // S3への永続保存
    if (savedFamilyMembers.length > 0) {
      console.log(`S3への家族構成保存開始: ${params.id}`);
      const s3Result = await saveFamilyMembersToS3(params.id, savedFamilyMembers);
      if (s3Result.success) {
        console.log(`S3への家族構成保存成功: ${params.id}`);
      } else {
        console.error(`S3への家族構成保存失敗: ${params.id}`, s3Result.error);
      }
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
