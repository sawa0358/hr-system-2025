import { NextResponse } from 'next/server';

/**
 * GET /api/attendance/all-employee-id
 * 全員分ファイル保存用のemployeeIDを返す
 * 注: 給与管理と同じPAYROLL_ALL_EMPLOYEE_IDを使用します
 */
export async function GET() {
  try {
    // 勤怠管理も給与管理と同じemployeeIDを使用
    const allEmployeeOwnerId = process.env.PAYROLL_ALL_EMPLOYEE_ID;

    if (!allEmployeeOwnerId) {
      console.error('[GET /api/attendance/all-employee-id] PAYROLL_ALL_EMPLOYEE_ID が未設定です');
      return NextResponse.json(
        {
          error: 'PAYROLL_ALL_EMPLOYEE_ID is not configured',
          message: '全員分機能の設定が未完了です。管理者に環境変数 PAYROLL_ALL_EMPLOYEE_ID の設定を依頼してください。',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      employeeId: allEmployeeOwnerId,
    });
  } catch (error) {
    console.error('[GET /api/attendance/all-employee-id] エラー:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

