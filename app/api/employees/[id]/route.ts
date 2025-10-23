import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id }
    });
    
    // 家族データを別途取得
    const familyMembers = await prisma.familyMember.findMany({
      where: { employeeId: params.id }
    });

    if (!employee) {
      return NextResponse.json(
        { error: '社員が見つかりません' },
        { status: 404 }
      );
    }

    // 複数の組織名・部署・役職をパースして返す
    const processedEmployee = {
      ...employee,
      departments: parseJsonArray(employee.department),
      positions: parseJsonArray(employee.position),
      organizations: parseJsonArray(employee.organization),
      familyMembers: familyMembers, // 家族データを追加
    };

    return NextResponse.json(processedEmployee);
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
    // 古いIDを検出
    if (params.id.includes('cmganegqz')) {
      console.error('古いIDが検出されました:', params.id)
      return NextResponse.json(
        { error: '古いデータが検出されました。ページを再読み込みしてください。' },
        { status: 400 }
      )
    }
    
    const body = await request.json();
    console.log('PUT request body:', body);
    console.log('birthDate value:', body.birthDate);
    console.log('isSuspended value:', body.isSuspended);
    console.log('retirementDate value:', body.retirementDate);
    console.log('furigana value:', body.furigana);
    
    // 現在の社員データを取得してコピー社員かどうか確認
    const currentEmployee = await prisma.employee.findUnique({
      where: { id: params.id },
      select: { status: true }
    });
    
    const isCopyEmployee = currentEmployee?.status === 'copy';
    
    // メールアドレスの重複チェック（自分以外）
    // 空文字列やnullの場合はチェックをスキップ
    if (body.email && body.email.trim() !== '') {
      const existingEmail = await prisma.employee.findFirst({
        where: { 
          email: body.email,
          id: { not: params.id }
        }
      });
      if (existingEmail) {
        console.log('メールアドレス重複エラー:', {
          email: body.email,
          existingId: existingEmail.id,
          currentId: params.id
        });
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
      return NextResponse.json(
        { error: `無効なrole値です: ${normalizedRole}` },
        { status: 400 }
      );
    }
    
    console.log('受信したリクエストボディ:', JSON.stringify(body, null, 2))
    console.log('更新データ:', {
      name: body.name,
      furigana: body.furigana,
      email: body.email,
      parentEmployeeId: body.parentEmployeeId,
      isCopyEmployee: isCopyEmployee
    })
    console.log('furiganaフィールドの詳細:', {
      value: body.furigana,
      type: typeof body.furigana,
      isString: typeof body.furigana === 'string',
      isEmpty: body.furigana === '' || body.furigana === null || body.furigana === undefined
    })
    
    console.log('部署・役職・組織データの詳細:', {
      departments: body.departments,
      departmentsType: typeof body.departments,
      isDepartmentsArray: Array.isArray(body.departments),
      positions: body.positions,
      positionsType: typeof body.positions,
      isPositionsArray: Array.isArray(body.positions),
      organizations: body.organizations,
      organizationsType: typeof body.organizations,
      isOrganizationsArray: Array.isArray(body.organizations)
    })

    // コピー社員の場合は管理者が一部項目を更新可能
    const updateData = isCopyEmployee ? {
      name: body.name,
      furigana: (() => {
        if (!body.furigana || body.furigana === '' || body.furigana === null || body.furigana === undefined) {
          return null;
        }
        const trimmed = String(body.furigana).trim();
        return trimmed !== '' ? trimmed : null;
      })(),
      parentEmployeeId: body.parentEmployeeId || null,
      // 管理者がコピー社員の社員番号を調整できるように許可
      employeeNumber: body.employeeNumber,
    } : {
      name: body.name,
      furigana: (() => {
        if (!body.furigana || body.furigana === '' || body.furigana === null || body.furigana === undefined) {
          return null;
        }
        const trimmed = String(body.furigana).trim();
        return trimmed !== '' ? trimmed : null;
      })(),
      email: body.email && body.email.trim() !== '' ? body.email : null,
      phone: body.phone,
      department: Array.isArray(body.departments) ? JSON.stringify(body.departments) : body.department,
      position: Array.isArray(body.positions) ? JSON.stringify(body.positions) : body.position,
      organization: Array.isArray(body.organizations) ? JSON.stringify(body.organizations) : body.organization,
      team: body.team,
      joinDate: body.joinDate ? new Date(body.joinDate) : undefined,
      status: body.status,
      password: body.password,
      role: normalizedRole && normalizedRole !== '' ? normalizedRole : null,
      myNumber: body.myNumber || null,
      employeeNumber: body.employeeNumber,
      employeeType: body.employeeType,
      userId: body.userId,
      url: body.url,
      address: body.address,
      selfIntroduction: body.selfIntroduction,
      phoneInternal: body.phoneInternal,
      phoneMobile: body.phoneMobile,
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
      parentEmployeeId: body.parentEmployeeId || null,
      isSuspended: body.isSuspended !== undefined ? body.isSuspended : false,
      retirementDate: body.retirementDate ? new Date(body.retirementDate) : null,
      orgChartLabel: body.orgChartLabel !== undefined ? (body.orgChartLabel || null) : undefined,
      // 公開設定
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
    };

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: updateData
    });

    console.log('更新成功:', employee.id, employee.name, employee.furigana, employee.parentEmployeeId)

    // 家族データの保存
    if (body.familyMembers && Array.isArray(body.familyMembers)) {
      // 既存の家族データを削除
      await prisma.familyMember.deleteMany({
        where: { employeeId: params.id }
      });

      // 新しい家族データを追加
      if (body.familyMembers.length > 0) {
        await prisma.familyMember.createMany({
          data: body.familyMembers.map((member: any) => ({
            employeeId: params.id,
            name: member.name,
            relationship: member.relationship,
            // phone: member.phone || null,  // 一時的にコメントアウト
            birthDate: member.birthday ? new Date(member.birthday) : null,  // 日付文字列をDateTimeオブジェクトに変換
            // livingSeparately: member.livingSeparately || false,  // スキーマに存在しないためコメントアウト
            // address: member.address || null,  // スキーマに存在しないためコメントアウト
            // myNumber: member.myNumber || null  // スキーマに存在しないためコメントアウト
          }))
        });
      }
    }

    // 更新された社員データを取得
    const updatedEmployee = await prisma.employee.findUnique({
      where: { id: params.id }
    });
    
    // 家族データを別途取得
    const updatedFamilyMembers = await prisma.familyMember.findMany({
      where: { employeeId: params.id }
    });

    return NextResponse.json({
      success: true,
      employee: {
        ...updatedEmployee,
        familyMembers: updatedFamilyMembers
      }
    });
  } catch (error: any) {
    console.error('社員更新エラー:', error);
    console.error('エラーの詳細:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'メールアドレスが既に使用されています' },
        { status: 400 }
      );
    }
    
    // より詳細なエラー情報を提供
    const errorMessage = error.message || '社員の更新に失敗しました';
    console.error('詳細エラー:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 削除対象の社員を取得
    const employeeToDelete = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        // 関連データは必要に応じて追加
      }
    });

    if (!employeeToDelete) {
      return NextResponse.json(
        { error: '社員が見つかりません' },
        { status: 404 }
      );
    }

    // 見えないTOP社員または社員番号000の場合は削除不可
    if (employeeToDelete.isInvisibleTop || employeeToDelete.employeeNumber === '000') {
      return NextResponse.json(
        { error: 'この社員は削除できません' },
        { status: 403 }
      );
    }

    // 管理者またはHRアカウントを取得（代替の作成者として使用）
    const adminEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'hr' }
        ],
        id: { not: params.id } // 削除対象の社員以外
      }
    });

    if (!adminEmployee) {
      return NextResponse.json(
        { error: '管理者アカウントが見つかりません。社員を削除するには管理者アカウントが必要です。' },
        { status: 400 }
      );
    }

    // トランザクションで関連データを処理してから削除
    await prisma.$transaction(async (tx) => {
      // 1. ワークスペースの作成者を管理者に変更
      await tx.workspace.updateMany({
        where: { createdBy: params.id },
        data: { createdBy: adminEmployee.id }
      });

      // 2. ボードの作成者を管理者に変更
      await tx.board.updateMany({
        where: { createdBy: params.id },
        data: { createdBy: adminEmployee.id }
      });

      // 3. カードの作成者を管理者に変更
      await tx.card.updateMany({
        where: { createdBy: params.id },
        data: { createdBy: adminEmployee.id }
      });

      // 4. ワークスペースメンバーシップを削除
      await tx.workspaceMember.deleteMany({
        where: { employeeId: params.id }
      });

      // 5. カードメンバーシップを削除
      await tx.cardMember.deleteMany({
        where: { employeeId: params.id }
      });

      // 6. 最終的に社員を削除（カスケード削除される関連データ: familyMembers, evaluations, attendance, payroll, files, folders, tasks, activityLogs）
      await tx.employee.delete({
        where: { id: params.id }
      });

      console.log(`社員 ${employeeToDelete.name} を削除しました`);
    });

    return NextResponse.json({
      success: true,
      message: `社員 ${employeeToDelete.name} が削除されました。関連するワークスペース、ボード、カードの作成者は管理者に変更されました。`
    });
  } catch (error: any) {
    console.error('社員削除エラー:', error);
    
    // より詳細なエラー情報を提供
    const errorMessage = error.message || '社員の削除に失敗しました';
    console.error('詳細エラー:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    );
  }
}
