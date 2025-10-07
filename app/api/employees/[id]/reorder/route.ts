import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { direction, currentIndex, newIndex } = body;

    console.log('順序入れ替えリクエスト:', { id: params.id, direction, currentIndex, newIndex });

    // 現在の社員を取得
    const currentEmployee = await prisma.employee.findUnique({
      where: { id: params.id }
    });

    if (!currentEmployee) {
      return NextResponse.json(
        { error: '社員が見つかりません' },
        { status: 404 }
      );
    }

    // 全社員を取得（表示順序でソート）
    const allEmployees = await prisma.employee.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // 現在のインデックスと新しいインデックスを取得
    const currentEmpIndex = allEmployees.findIndex(emp => emp.id === params.id);
    if (currentEmpIndex === -1) {
      return NextResponse.json(
        { error: '社員のインデックスが見つかりません' },
        { status: 400 }
      );
    }

    let newEmpIndex: number;
    if (direction === 'up') {
      newEmpIndex = currentEmpIndex - 1;
    } else {
      newEmpIndex = currentEmpIndex + 1;
    }

    // インデックスの範囲チェック
    if (newEmpIndex < 0 || newEmpIndex >= allEmployees.length) {
      return NextResponse.json(
        { error: '移動先のインデックスが無効です' },
        { status: 400 }
      );
    }

    // 社員の順序を入れ替える
    const updatedEmployees = [...allEmployees];
    [updatedEmployees[currentEmpIndex], updatedEmployees[newEmpIndex]] = 
    [updatedEmployees[newEmpIndex], updatedEmployees[currentEmpIndex]];

    // 順序を反映するためにupdatedAtを更新
    const now = new Date();
    
    // 現在の社員と移動先の社員のupdatedAtを更新
    await prisma.employee.update({
      where: { id: params.id },
      data: { updatedAt: now }
    });

    await prisma.employee.update({
      where: { id: updatedEmployees[newEmpIndex].id },
      data: { updatedAt: new Date(now.getTime() + 1) }
    });

    return NextResponse.json({
      success: true,
      message: '順序が更新されました'
    });

  } catch (error) {
    console.error('順序入れ替えエラー:', error);
    return NextResponse.json(
      { error: '順序入れ替えに失敗しました' },
      { status: 500 }
    );
  }
}
