import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword, isPasswordHashed } from '@/lib/password';
import { createSessionToken, getSessionCookieHeader, type SessionPayload } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
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
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // ステータスチェック（停止/休職/退職）
    if (employee.isSuspended || employee.status === 'suspended') {
      return NextResponse.json(
        { error: 'このアカウントは停止中です。管理者にお問い合わせください。' },
        { status: 403 }
      );
    }
    if (employee.status === 'leave' || employee.status === 'retired') {
      return NextResponse.json(
        { error: 'このアカウントは休職中または退職済みです。管理者にお問い合わせください。' },
        { status: 403 }
      );
    }

    // ロールが未設定の場合はログイン不可
    if (!employee.role) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワード検証（bcryptハッシュ・平文の両方に対応）
    const isValid = await verifyPassword(password, employee.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // 平文パスワードの場合、自動的にハッシュ化して更新（遅延マイグレーション）
    if (!isPasswordHashed(employee.password)) {
      try {
        const hashed = await hashPassword(password);
        await prisma.employee.update({
          where: { id: employee.id },
          data: { password: hashed }
        });
      } catch (e) {
        console.error('[Auth] パスワードの自動ハッシュ化に失敗:', e);
      }
    }

    // JWT セッショントークン生成
    const sessionPayload: SessionPayload = {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      email: employee.email,
      department: employee.department,
      position: employee.position,
      organization: employee.organization,
      employeeType: employee.employeeType,
      isPersonnelEvaluationTarget: employee.isPersonnelEvaluationTarget ?? false,
      personnelEvaluationTeamId: employee.personnelEvaluationTeamId,
    };
    const token = await createSessionToken(sessionPayload);

    // レスポンス作成（パスワードを含めない）
    const response = NextResponse.json({
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
        isPersonnelEvaluationTarget: employee.isPersonnelEvaluationTarget,
        personnelEvaluationTeamId: employee.personnelEvaluationTeamId,
        employeeNumber: employee.employeeNumber,
        isInvisibleTop: employee.isInvisibleTop,
        showInOrgChart: employee.showInOrgChart,
        parentEmployeeId: employee.parentEmployeeId,
        status: employee.status,
        isSuspended: employee.isSuspended,
        avatar: employee.avatar,
      }
    });

    // httpOnly Cookie にセッショントークンを設定
    response.headers.set('Set-Cookie', getSessionCookieHeader(token));

    return response;

  } catch (error) {
    console.error('ログインエラー:', error);
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}
