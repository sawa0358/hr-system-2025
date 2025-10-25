import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { savePayrollDataToS3 } from '@/lib/s3-client';

// PUT /api/payroll/[id] - 給与データを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-employee-id');

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { period, amount, status } = body;

    // 給与データを更新
    const updatedPayroll = await prisma.payroll.update({
      where: { id: params.id },
      data: {
        period: period || undefined,
        amount: amount || undefined,
        status: status || undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // S3への給与データ自動保存
    try {
      const payrollData = {
        payroll: updatedPayroll,
        savedAt: new Date().toISOString(),
      };
      await savePayrollDataToS3(updatedPayroll.employeeId, payrollData);
      console.log(`給与データをS3に自動保存しました: ${updatedPayroll.employeeId}`);
    } catch (error) {
      console.error('[Payroll] Failed to save to S3:', error);
      // S3保存に失敗してもレスポンスは返す
    }

    return NextResponse.json({ payroll: updatedPayroll });
  } catch (error) {
    console.error('[Payroll] Error updating payroll:', error);
    return NextResponse.json(
      { error: '給与データの更新に失敗しました' },
      { status: 500 }
    );
  }
}
