import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 「見えないTOP」社員の自動作成・管理（デプロイ時自動実行）
async function ensureInvisibleTopEmployee() {
  try {
    // 既存の「見えないTOP」社員を検索（新しいカラムが存在しない場合も対応）
    let invisibleTopEmployee: any
    try {
      invisibleTopEmployee = await prisma.employee.findFirst({
        where: {
          OR: [
            { name: "見えないTOP" },
            { employeeNumber: "000" },
            { isInvisibleTop: true }
          ]
        },
        select: {
          id: true,
          name: true,
          employeeNumber: true,
          isInvisibleTop: true,
        },
      });
    } catch (schemaError: any) {
      // 新しいカラムが存在しない場合は、selectで基本フィールドのみ取得
      if (schemaError?.code === 'P2022') {
        invisibleTopEmployee = await prisma.employee.findFirst({
          where: {
            OR: [
              { name: "見えないTOP" },
              { employeeNumber: "000" },
            ]
          },
          select: {
            id: true,
            name: true,
            employeeNumber: true,
            isInvisibleTop: true,
          },
        });
      } else {
        throw schemaError
      }
    }
    
    if (!invisibleTopEmployee) {
      // 新規作成
      invisibleTopEmployee = await prisma.employee.create({
        data: {
          name: "見えないTOP",
          employeeNumber: "000",
          employeeId: "EMP-TOP-000",
          department: "経営",
          position: "未設定",
          organization: "株式会社テックイノベーション",
          email: "invisible-top@company.com",
          phone: "",
          joinDate: new Date("2020-01-01"),
          status: "active",
          role: "admin",
          employeeType: "employee",
          showInOrgChart: true,
          parentEmployeeId: null,
          isInvisibleTop: true,
          password: "invisible-top-secure-password-2024"
        }
      });
      console.log('✅ 「見えないTOP」社員を自動作成しました');
    } else {
      // 既存の社員のフラグを確実に設定
      if (!invisibleTopEmployee.isInvisibleTop) {
        await prisma.employee.update({
          where: { id: invisibleTopEmployee.id },
          data: { isInvisibleTop: true }
        });
        console.log('✅ 既存の「見えないTOP」社員にフラグを設定しました');
      }
    }
  } catch (error) {
    console.error('「見えないTOP」社員の自動作成でエラー:', error);
  }
}

// アプリケーション起動時に実行（サーバーサイドのみ）
if (typeof window === 'undefined') {
  // 非同期で実行（アプリケーション起動をブロックしない）
  ensureInvisibleTopEmployee().catch(console.error);
}
