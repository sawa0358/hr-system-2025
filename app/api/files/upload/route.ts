import { NextRequest, NextResponse } from 'next/server';
import { handleFileUpload } from '@/lib/file-upload';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // クエリパラメータまたはヘッダーからemployeeIdを取得
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId') || request.headers.get('x-employee-id');
    
    if (!employeeId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const result = await handleFileUpload(request, employeeId);

    if (!result.success || !result.fileId) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // ファイル情報を取得
    const file = await prisma.file.findUnique({
      where: { id: result.fileId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'ファイル情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 勤怠管理または給与管理のフォルダにアップロードされた場合、本人へメール通知
    const folderName = result.folderName;
    const category = result.category;

    const isAttendanceOrPayroll = 
      folderName === '勤怠管理' || 
      folderName === '給与管理' ||
      category === 'attendance' ||
      category === 'payroll';

    if (isAttendanceOrPayroll && file.employee?.email) {
      const { sendMail } = await import('@/lib/mail')
      
      const folderLabel = folderName === '勤怠管理' ? '勤怠管理' : 
                         folderName === '給与管理' ? '給与管理' :
                         category === 'attendance' ? '勤怠管理' :
                         category === 'payroll' ? '給与管理' : 'あなたのフォルダ';
      
      const subject = `【${folderLabel}】新しいファイルがアップロードされました`
      
      const textBody = [
        `${file.employee.name}さん`,
        '',
        `${folderLabel}に新しいファイルがアップロードされました。`,
        `ファイル名：${file.originalName}`,
        '',
        '詳細はHRシステムで確認してください。',
        'https://hr-system-2025-33b161f586cd.herokuapp.com/employees',
      ].join('\n')
      
      const htmlBody = [
        `<p>${file.employee.name}さん</p>`,
        `<p><strong>${folderLabel}に新しいファイルがアップロードされました。</strong></p>`,
        `<p>ファイル名：${file.originalName}</p>`,
        '<p>詳細はHRシステムで確認してください。</p>',
        '<p><a href="https://hr-system-2025-33b161f586cd.herokuapp.com/employees">https://hr-system-2025-33b161f586cd.herokuapp.com/employees</a></p>',
      ].join('')
      
      const mailResult = await sendMail({
        to: file.employee.email,
        subject,
        text: textBody,
        html: htmlBody,
      })
      
      if (mailResult.success) {
        console.log('[POST /api/files/upload] ファイルアップロード通知送信成功:', file.employee.email)
      } else if (!mailResult.skipped) {
        console.error('[POST /api/files/upload] ファイルアップロード通知送信失敗:', mailResult.error)
      }
    }

    // アバター画像の場合は、ファイル表示用のURLを生成
    const url = `/api/files/${result.fileId}/download`;

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      url: url,
    });
  } catch (error) {
    console.error('ファイルアップロードAPIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
