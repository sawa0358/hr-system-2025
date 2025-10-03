import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('社員一覧取得エラー:', error);
    return NextResponse.json(
      { error: '社員一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 必須フィールドのバリデーション
    const requiredFields = ['name', 'password'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field}は必須項目です` },
          { status: 400 }
        );
      }
    }

    // 社員IDの生成（年 + 連番）
    const currentYear = new Date().getFullYear();
    const existingEmployees = await prisma.employee.count({
      where: {
        employeeId: {
          startsWith: `EMP-${currentYear}`
        }
      }
    });
    
    const employeeNumber = String(existingEmployees + 1).padStart(3, '0');
    const employeeId = `EMP-${currentYear}-${employeeNumber}`;

    // 社員データの作成
    const employee = await prisma.employee.create({
      data: {
        employeeId,
        employeeNumber: employeeId,
        employeeType: body.employeeType || 'employee',
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        department: body.department,
        position: body.position,
        organization: body.organization,
        team: body.team || null,
        joinDate: new Date(body.joinDate),
        status: body.status || 'active',
        password: body.password,
        role: body.role,
        myNumber: body.myNumber || null,
      }
    });

    return NextResponse.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('社員作成エラー:', error);
    
    // ユニーク制約エラーの場合
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'メールアドレスが既に使用されています' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '社員の作成に失敗しました' },
      { status: 500 }
    );
  }
}
