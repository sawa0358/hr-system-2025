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

    // 雇用形態のバリデーション
    const validEmployeeTypes = ['employee', 'contractor'];
    if (body.employeeType && !validEmployeeTypes.includes(body.employeeType)) {
      return NextResponse.json(
        { error: '雇用形態は employee または contractor のみ有効です' },
        { status: 400 }
      );
    }

    // roleの値の正規化（ハイフンをアンダースコアに変換）
    const validRoles = ['viewer', 'general', 'sub_manager', 'manager', 'hr', 'admin'];
    let normalizedRole = body.role;
    if (normalizedRole === 'sub-manager') {
      normalizedRole = 'sub_manager';
    }
    
    // roleのバリデーション
    if (normalizedRole && normalizedRole !== '' && !validRoles.includes(normalizedRole)) {
      console.error('Invalid role value:', normalizedRole);
      return NextResponse.json(
        { error: `無効なrole値です: ${normalizedRole}` },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    if (body.email) {
      const existingEmail = await prisma.employee.findUnique({
        where: { email: body.email }
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }
    }

    // 社員番号の重複チェック
    if (body.employeeNumber) {
      const existingEmployeeNumber = await prisma.employee.findUnique({
        where: { employeeNumber: body.employeeNumber }
      });
      if (existingEmployeeNumber) {
        return NextResponse.json(
          { error: 'この社員番号は既に使用されています' },
          { status: 400 }
        );
      }
    }

    // 社員IDの生成（入力された社員番号を使用）
    const employeeId = body.employeeNumber || `EMP-${Date.now()}`;

    // 社員データの作成
    const employee = await prisma.employee.create({
      data: {
        employeeId,
        employeeNumber: body.employeeNumber || employeeId,
        employeeType: body.employeeType || 'employee',
        name: body.name,
        email: body.email || `${body.name.toLowerCase().replace(/\s+/g, '')}@company.com`,
        phone: body.phone || null,
        department: body.department || '未設定',
        position: body.position || '未設定',
        organization: body.organization || '株式会社テックイノベーション',
        team: body.team || null,
        joinDate: body.joinDate ? new Date(body.joinDate) : new Date(),
        status: body.status || 'active',
        password: body.password,
        role: normalizedRole && normalizedRole !== '' ? normalizedRole : null,
        myNumber: body.myNumber || null,
        userId: body.userId || null,
        url: body.url || null,
        address: body.address || null,
        selfIntroduction: body.selfIntroduction || null,
        phoneInternal: body.phoneInternal || null,
        phoneMobile: body.phoneMobile || null,
        birthDate: (() => {
          if (!body.birthDate || body.birthDate === '' || body.birthDate === null || body.birthDate === undefined) {
            return null;
          }
          try {
            const date = new Date(body.birthDate);
            return isNaN(date.getTime()) ? null : date;
          } catch (error) {
            console.error('birthDate parsing error:', error);
            return null;
          }
        })(),
        showInOrgChart: body.showInOrgChart !== undefined ? body.showInOrgChart : true,
      }
    });

    return NextResponse.json({
      success: true,
      employee
    });
  } catch (error: any) {
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
