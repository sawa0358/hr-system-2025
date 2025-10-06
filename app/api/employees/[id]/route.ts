import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        familyMembers: true
      }
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
    
    // メールアドレスの重複チェック（自分以外）
    if (body.email) {
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
        role: body.role && body.role !== '' ? body.role : null,
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
      }
    });

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
            phone: member.phone || null,
            birthday: member.birthday || null,
            livingSeparately: member.livingSeparately || false,
            address: member.address || null,
            myNumber: member.myNumber || null
          }))
        });
      }
    }

    // 更新された社員データを家族情報と一緒に取得
    const updatedEmployee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        familyMembers: true
      }
    });

    return NextResponse.json({
      success: true,
      employee: updatedEmployee
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
