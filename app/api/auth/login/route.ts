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

    // ユーザー名またはメールアドレスで社員候補を検索（同名対応のためfindMany）
    const candidates = await prisma.employee.findMany({
      where: {
        OR: [
          { name: username },
          { email: username },
          { userId: username }
        ],
      }
    });

    if (candidates.length === 0) {
      console.log(`[Auth] ユーザー未検出: "${username}"`);
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    console.log(`[Auth] 候補${candidates.length}件: "${username}"`);

    // 候補の中からパスワードが一致し、ログイン可能な社員を探す
    let employee = null;
    for (const candidate of candidates) {
      // ロールが未設定はスキップ
      if (!candidate.role) continue;
      // 停止・休職・退職はスキップ
      if (candidate.isSuspended || candidate.status === 'suspended') continue;
      if (candidate.status === 'leave' || candidate.status === 'retired') continue;

      const isValid = await verifyPassword(password, candidate.password);
      console.log(`[Auth] 検証: "${candidate.name}" (ID: ${candidate.id}), pwHashed=${isPasswordHashed(candidate.password)}, inputLen=${password.length}, storedLen=${candidate.password.length}, valid=${isValid}`);
      if (isValid) {
        employee = candidate;
        break;
      }
    }

    if (!employee) {
      // パスワード不一致の場合、停止/休職/退職の候補があるか確認してメッセージを分ける
      const suspendedCandidate = candidates.find(c => c.isSuspended || c.status === 'suspended');
      if (suspendedCandidate) {
        return NextResponse.json(
          { error: 'このアカウントは停止中です。管理者にお問い合わせください。' },
          { status: 403 }
        );
      }
      const leaveCandidate = candidates.find(c => c.status === 'leave' || c.status === 'retired');
      if (leaveCandidate) {
        return NextResponse.json(
          { error: 'このアカウントは休職中または退職済みです。管理者にお問い合わせください。' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // 平文パスワードの場合、自動的にハッシュ化して更新（遅延マイグレーション）
    if (!isPasswordHashed(employee.password)) {
      try {
        const hashed = await hashPassword(password);
        // ハッシュ化直後に検証テスト（デバッグ用）
        const verifyTest = await verifyPassword(password, hashed);
        console.log(`[Auth] 遅延ハッシュ化: "${employee.name}", hashLen=${hashed.length}, verifyTest=${verifyTest}`);
        if (verifyTest) {
          await prisma.employee.update({
            where: { id: employee.id },
            data: { password: hashed }
          });
          console.log(`[Auth] パスワードハッシュ化完了: "${employee.name}"`);
        } else {
          console.error(`[Auth] ハッシュ化後の検証失敗! ハッシュ化をスキップ: "${employee.name}"`);
        }
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
