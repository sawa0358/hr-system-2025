import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // 元の社員を取得
    const originalEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!originalEmployee) {
      return NextResponse.json(
        { error: '社員が見つかりません' },
        { status: 404 }
      );
    }

    // コピー社員は作成できない
    if (originalEmployee.status === 'copy') {
      return NextResponse.json(
        { error: 'コピー社員は再度コピーできません' },
        { status: 400 }
      );
    }

    // 新しい社員番号を生成（元の番号 + "-COPY-" + timestamp）
    const timestamp = Date.now();
    const copyEmployeeNumber = `${originalEmployee.employeeNumber}-COPY-${timestamp}`;
    const copyEmployeeId = `${originalEmployee.employeeId}-COPY-${timestamp}`;

    // コピー社員を作成
    const copyEmployee = await prisma.employee.create({
      data: {
        employeeId: copyEmployeeId,
        employeeNumber: copyEmployeeNumber,
        employeeType: originalEmployee.employeeType,
        name: originalEmployee.name,
        furigana: originalEmployee.furigana,
        email: null, // メールアドレスは重複を避けるためnull
        phone: originalEmployee.phone,
        department: originalEmployee.department,
        position: originalEmployee.position,
        organization: originalEmployee.organization,
        team: originalEmployee.team,
        joinDate: originalEmployee.joinDate,
        status: 'copy', // コピー社員ステータス
        password: originalEmployee.password,
        role: null, // システム使用権限はコピーしない
        myNumber: originalEmployee.myNumber,
        userId: originalEmployee.userId,
        url: originalEmployee.url,
        address: originalEmployee.address,
        selfIntroduction: originalEmployee.selfIntroduction,
        phoneInternal: originalEmployee.phoneInternal,
        phoneMobile: originalEmployee.phoneMobile,
        birthDate: originalEmployee.birthDate,
        showInOrgChart: originalEmployee.showInOrgChart,
        parentEmployeeId: originalEmployee.parentEmployeeId,
        isInvisibleTop: false,
        isSuspended: false,
        retirementDate: null,
        privacyDisplayName: originalEmployee.privacyDisplayName,
        privacyOrganization: originalEmployee.privacyOrganization,
        privacyDepartment: originalEmployee.privacyDepartment,
        privacyPosition: originalEmployee.privacyPosition,
        privacyUrl: originalEmployee.privacyUrl,
        privacyAddress: originalEmployee.privacyAddress,
        privacyBio: originalEmployee.privacyBio,
        privacyEmail: originalEmployee.privacyEmail,
        privacyWorkPhone: originalEmployee.privacyWorkPhone,
        privacyExtension: originalEmployee.privacyExtension,
        privacyMobilePhone: originalEmployee.privacyMobilePhone,
        privacyBirthDate: originalEmployee.privacyBirthDate
      }
    });

    console.log('コピー社員作成成功:', copyEmployee);

    return NextResponse.json({
      success: true,
      employee: copyEmployee
    });
  } catch (error: any) {
    console.error('コピー社員作成エラー:', error);
    
    return NextResponse.json(
      { error: 'コピー社員の作成に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}

