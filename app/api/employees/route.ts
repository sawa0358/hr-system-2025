import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Prismaクライアントの初期化確認
console.log('Prismaクライアント初期化確認:', !!prisma);

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        familyMembers: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 複数の組織名・部署・役職をパースして返す
    const processedEmployees = employees.map(employee => ({
      ...employee,
      departments: parseJsonArray(employee.department),
      positions: parseJsonArray(employee.position),
      organizations: parseJsonArray(employee.organization),
    }));

    return NextResponse.json(processedEmployees);
  } catch (error) {
    console.error('社員一覧取得エラー:', error);
    return NextResponse.json(
      { error: '社員一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// JSON配列をパースするヘルパー関数
function parseJsonArray(value: string): string[] {
  if (!value) return [];
  
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(item => item && item.trim() !== '') : [value];
  } catch {
    // JSONでない場合は単一の値として扱う
    return value ? [value] : [];
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/employees 開始');
  try {
    console.log('リクエストボディの解析開始');
    const body = await request.json();
    console.log('新規社員登録リクエスト:', body);
    
    // 必須フィールドのバリデーション
    const requiredFields = ['name', 'password'];
    for (const field of requiredFields) {
      if (!body[field] || body[field].trim() === '') {
        console.error(`必須フィールドが不足: ${field}`, body[field]);
        return NextResponse.json(
          { error: `${field}は必須項目です` },
          { status: 400 }
        );
      }
    }
    
    console.log('必須フィールドバリデーション通過');

    // Prismaクライアントの接続確認
    console.log('Prismaクライアント接続確認中...');
    try {
      await prisma.$connect();
      console.log('Prismaクライアント接続成功');
    } catch (prismaError) {
      console.error('Prismaクライアント接続エラー:', prismaError);
      return NextResponse.json(
        { error: 'データベース接続エラー' },
        { status: 500 }
      );
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
    const validRoles = ['viewer', 'general', 'sub_manager', 'store_manager', 'manager', 'hr', 'admin'];
    let normalizedRole = body.role;
    if (normalizedRole === 'sub-manager') {
      normalizedRole = 'sub_manager';
    }
    if (normalizedRole === 'store-manager') {
      normalizedRole = 'store_manager';
    }
    
    // roleのバリデーション
    if (normalizedRole && normalizedRole !== '' && !validRoles.includes(normalizedRole)) {
      console.error('Invalid role value:', normalizedRole);
      console.error('Valid roles:', validRoles);
      return NextResponse.json(
        { error: `無効なrole値です: ${normalizedRole}` },
        { status: 400 }
      );
    }
    
    console.log('正規化後のrole:', normalizedRole);

    // 社員番号の重複チェック
    if (body.employeeNumber) {
      const existingEmployeeNumber = await prisma.employee.findUnique({
        where: { employeeNumber: body.employeeNumber }
      });
      if (existingEmployeeNumber) {
        console.error('社員番号重複:', body.employeeNumber);
        return NextResponse.json(
          { error: 'この社員番号は既に使用されています' },
          { status: 400 }
        );
      }
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
    console.log('社員データ作成開始:', {
      employeeId,
      employeeNumber: body.employeeNumber || employeeId,
      employeeType: body.employeeType || 'employee',
      name: body.name,
      email: body.email || `${body.name.toLowerCase().replace(/\s+/g, '')}@company.com`,
      role: normalizedRole
    });
    
    console.log('prisma.employee.create 実行開始');
    const employee = await prisma.employee.create({
      data: {
        employeeId,
        employeeNumber: body.employeeNumber || employeeId,
        employeeType: body.employeeType || 'employee',
        name: body.name,
        furigana: (() => {
          if (!body.furigana || body.furigana === '' || body.furigana === null || body.furigana === undefined) {
            return null;
          }
          const trimmed = String(body.furigana).trim();
          return trimmed !== '' ? trimmed : null;
        })(),
        email: body.email || `${body.name.toLowerCase().replace(/\s+/g, '')}@company.com`,
        phone: body.phone || null,
        department: Array.isArray(body.departments) ? JSON.stringify(body.departments) : (body.department || '未設定'),
        position: Array.isArray(body.positions) ? JSON.stringify(body.positions) : (body.position || '未設定'),
        organization: Array.isArray(body.organizations) ? JSON.stringify(body.organizations) : (body.organization || '株式会社テックイノベーション'),
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
        isSuspended: body.isSuspended !== undefined ? body.isSuspended : false,
        retirementDate: body.retirementDate ? new Date(body.retirementDate) : null,
        // 公開設定（デフォルトは全て公開）
        privacyDisplayName: body.privacyDisplayName !== undefined ? body.privacyDisplayName : true,
        privacyOrganization: body.privacyOrganization !== undefined ? body.privacyOrganization : true,
        privacyDepartment: body.privacyDepartment !== undefined ? body.privacyDepartment : true,
        privacyPosition: body.privacyPosition !== undefined ? body.privacyPosition : true,
        privacyUrl: body.privacyUrl !== undefined ? body.privacyUrl : true,
        privacyAddress: body.privacyAddress !== undefined ? body.privacyAddress : true,
        privacyBio: body.privacyBio !== undefined ? body.privacyBio : true,
        privacyEmail: body.privacyEmail !== undefined ? body.privacyEmail : true,
        privacyWorkPhone: body.privacyWorkPhone !== undefined ? body.privacyWorkPhone : true,
        privacyExtension: body.privacyExtension !== undefined ? body.privacyExtension : true,
        privacyMobilePhone: body.privacyMobilePhone !== undefined ? body.privacyMobilePhone : true,
      }
    });

    console.log('社員データ作成成功:', employee);

    return NextResponse.json({
      success: true,
      employee
    });
  } catch (error: any) {
    console.error('社員作成エラー:', error);
    console.error('エラーの詳細:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
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
