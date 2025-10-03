import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id }
    });

    if (!employee) {
      return NextResponse.json(
        { error: '社員が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('社員取得エラー:', error);
    return NextResponse.json(
      { error: '社員の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // メールアドレスの重複チェック（自分以外）
    if (body.email) {
      const existingEmail = await prisma.employee.findFirst({
        where: { 
          email: body.email,
          id: { not: params.id }
        }
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }
    }

    // 社員番号の重複チェック（自分以外）
    if (body.employeeNumber) {
      const existingEmployeeNumber = await prisma.employee.findFirst({
        where: { 
          employeeNumber: body.employeeNumber,
          id: { not: params.id }
        }
      });
      if (existingEmployeeNumber) {
        return NextResponse.json(
          { error: 'この社員番号は既に使用されています' },
          { status: 400 }
        );
      }
    }
    
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        department: body.department,
        position: body.position,
        organization: body.organization,
        team: body.team,
        joinDate: body.joinDate ? new Date(body.joinDate) : undefined,
        status: body.status,
        password: body.password,
        role: body.role,
        myNumber: body.myNumber,
        employeeNumber: body.employeeNumber,
        employeeType: body.employeeType,
      }
    });

    return NextResponse.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('社員更新エラー:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'メールアドレスが既に使用されています' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '社員の更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.employee.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: '社員が削除されました'
    });
  } catch (error) {
    console.error('社員削除エラー:', error);
    return NextResponse.json(
      { error: '社員の削除に失敗しました' },
      { status: 500 }
    );
  }
}
