import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('ログインリクエスト開始');
    const body = await request.json();
    const { username, password } = body;

    console.log('ログイン試行:', { username });

    if (!username || !password) {
      console.log('ユーザー名またはパスワードが不足');
      return NextResponse.json(
        { error: 'ユーザー名とパスワードは必須です' },
        { status: 400 }
      );
    }

    // ユーザー名またはメールアドレスで社員を検索
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { name: username },
          { email: username },
          { userId: username }
        ],
        status: 'active'
      }
    });

    if (!employee) {
      console.log('社員が見つかりません:', username);
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワードの確認
    if (employee.password !== password) {
      console.log('パスワードが一致しません:', username);
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    console.log('ログイン成功:', employee.name);

    // ログイン成功時のレスポンス
    return NextResponse.json({
      success: true,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        position: employee.position,
        organization: employee.organization,
        employeeType: employee.employeeType,
        isPersonnelEvaluationTarget: employee.isPersonnelEvaluationTarget
      }
    });

  } catch (error) {
    console.error('ログインエラー:', error);
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}
