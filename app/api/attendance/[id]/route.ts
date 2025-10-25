import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveAttendanceDataToS3 } from '@/lib/s3-client';

// PUT /api/attendance/[id] - 勤怠データを更新
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
    const { date, clockIn, clockOut, breakStart, breakEnd, status } = body;

    // 勤怠データを更新
    const updatedAttendance = await prisma.attendance.update({
      where: { id: params.id },
      data: {
        date: date ? new Date(date) : undefined,
        clockIn: clockIn ? new Date(clockIn) : undefined,
        clockOut: clockOut ? new Date(clockOut) : undefined,
        breakStart: breakStart ? new Date(breakStart) : undefined,
        breakEnd: breakEnd ? new Date(breakEnd) : undefined,
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

    // S3への勤怠データ自動保存
    try {
      const attendanceData = {
        attendance: updatedAttendance,
        savedAt: new Date().toISOString(),
      };
      await saveAttendanceDataToS3(updatedAttendance.employeeId, attendanceData);
      console.log(`勤怠データをS3に自動保存しました: ${updatedAttendance.employeeId}`);
    } catch (error) {
      console.error('[Attendance] Failed to save to S3:', error);
      // S3保存に失敗してもレスポンスは返す
    }

    return NextResponse.json({ attendance: updatedAttendance });
  } catch (error) {
    console.error('[Attendance] Error updating attendance:', error);
    return NextResponse.json(
      { error: '勤怠データの更新に失敗しました' },
      { status: 500 }
    );
  }
}
