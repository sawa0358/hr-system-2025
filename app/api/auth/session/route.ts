import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, getTokenFromCookieHeader } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookieHeader(cookieHeader);

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // DBから最新のユーザー情報を取得（ロール変更等を反映）
    const employee = await prisma.employee.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        organization: true,
        employeeType: true,
        employeeNumber: true,
        isPersonnelEvaluationTarget: true,
        personnelEvaluationTeamId: true,
        isInvisibleTop: true,
        showInOrgChart: true,
        parentEmployeeId: true,
        status: true,
        isSuspended: true,
        avatar: true,
      }
    });

    if (!employee) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // 停止/退職ユーザーのセッションを無効化
    if (employee.isSuspended || employee.status === 'suspended' || employee.status === 'leave' || employee.status === 'retired') {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: employee,
    });
  } catch (error) {
    console.error('セッション確認エラー:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
