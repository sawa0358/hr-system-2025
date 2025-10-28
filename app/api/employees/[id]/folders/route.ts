import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  saveCustomFoldersToS3, 
  getCustomFoldersFromS3 
} from '@/lib/s3-client'

// カスタムフォルダを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'employee'

    console.log(`カスタムフォルダ取得開始: ${params.id}, category: ${category}`);
    
    // S3から優先的にデータを取得
    const s3Result = await getCustomFoldersFromS3(params.id);
    
    let folders;
    if (s3Result.success && s3Result.data) {
      console.log(`S3からカスタムフォルダを取得: ${params.id}`);
      folders = s3Result.data.filter(f => f.category === category);
    } else {
      console.log(`データベースからカスタムフォルダを取得: ${params.id}`);
      folders = await prisma.customFolder.findMany({
        where: { 
          employeeId: params.id,
          category: category
        },
        orderBy: { order: 'asc' }
      });
    }

    return NextResponse.json(folders.map(f => f.name))
  } catch (error: any) {
    console.error('カスタムフォルダ取得エラー:', error)
    console.error('エラー詳細:', error.message)
    console.error('エラースタック:', error.stack)
    return NextResponse.json(
      { error: 'カスタムフォルダの取得に失敗しました', details: error.message },
      { status: 500 }
    )
  }
}

// カスタムフォルダを保存
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { folders, category = 'employee' } = body

    if (!Array.isArray(folders)) {
      return NextResponse.json(
        { error: 'フォルダデータが正しい形式ではありません' },
        { status: 400 }
      )
    }

    // 既存のフォルダを削除
    await prisma.customFolder.deleteMany({
      where: { 
        employeeId: params.id,
        category: category
      }
    })

    // 新しいフォルダを追加
    let savedFolders = [];
    if (folders.length > 0) {
      await prisma.customFolder.createMany({
        data: folders.map((name: string, index: number) => ({
          employeeId: params.id,
          category: category,
          name: name,
          order: index
        }))
      });

      // 保存されたデータを取得
      savedFolders = await prisma.customFolder.findMany({
        where: { 
          employeeId: params.id,
          category: category
        },
        orderBy: { order: 'asc' }
      });
    }

    // S3への永続保存
    if (savedFolders.length > 0) {
      console.log(`S3へのカスタムフォルダ保存開始: ${params.id}`);
      const s3Result = await saveCustomFoldersToS3(params.id, savedFolders);
      if (s3Result.success) {
        console.log(`S3へのカスタムフォルダ保存成功: ${params.id}`);
      } else {
        console.error(`S3へのカスタムフォルダ保存失敗: ${params.id}`, s3Result.error);
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('カスタムフォルダ保存エラー:', error)
    console.error('エラー詳細:', error.message)
    console.error('エラースタック:', error.stack)
    return NextResponse.json(
      { error: 'カスタムフォルダの保存に失敗しました', details: error.message },
      { status: 500 }
    )
  }
}
