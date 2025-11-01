// 有給計算のデバッグ用スクリプト
// 入社日2018/02/01の社員の付与ロット生成を確認

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugVacationCalculation() {
  try {
    // 入社日2018/02/01の社員を検索
    const targetDate = new Date('2018-02-01');
    const employees = await prisma.employee.findMany({
      where: {
        joinDate: {
          gte: new Date('2018-02-01'),
          lt: new Date('2018-02-02'),
        },
      },
      select: {
        id: true,
        name: true,
        joinDate: true,
        vacationPattern: true,
        weeklyPattern: true,
        employeeType: true,
        configVersion: true,
      },
    });

    console.log(`\n=== 入社日2018/02/01の社員数: ${employees.length} ===\n`);

    for (const emp of employees) {
      console.log(`社員: ${emp.name} (ID: ${emp.id})`);
      console.log(`  入社日: ${emp.joinDate.toISOString().split('T')[0]}`);
      console.log(`  雇用形態: ${emp.employeeType}`);
      console.log(`  パターン: ${emp.vacationPattern || '未設定'}`);
      console.log(`  週勤務日数: ${emp.weeklyPattern || '未設定'}`);
      console.log(`  設定バージョン: ${emp.configVersion || '未設定'}\n`);

      // 付与ロットを取得
      const lots = await prisma.grantLot.findMany({
        where: { employeeId: emp.id },
        orderBy: { grantDate: 'asc' },
      });

      console.log(`  付与ロット数: ${lots.length}`);
      
      let totalGranted = 0;
      let totalRemaining = 0;
      
      for (const lot of lots) {
        const granted = Number(lot.daysGranted);
        const remaining = Number(lot.daysRemaining);
        totalGranted += granted;
        totalRemaining += remaining;
        
        console.log(`    ${lot.grantDate.toISOString().split('T')[0]}: 付与${granted}日, 残り${remaining}日, 期限${lot.expiryDate.toISOString().split('T')[0]}`);
      }

      console.log(`  合計付与: ${totalGranted}日`);
      console.log(`  合計残り: ${totalRemaining}日`);
      console.log(`\n`);

      // 設定を確認
      if (emp.configVersion) {
        const config = await prisma.vacationAppConfig.findUnique({
          where: { version: emp.configVersion },
        });
        if (config) {
          const cfg = JSON.parse(config.configJson);
          console.log(`  設定テーブル (パターンA):`);
          if (cfg.fullTime && cfg.fullTime.table) {
            for (const row of cfg.fullTime.table) {
              console.log(`    ${row.years}年: ${row.days}日`);
            }
          }
          console.log(`\n`);
        }
      }
    }

    // 設定テーブルの確認
    console.log(`\n=== アクティブな設定 ===\n`);
    const activeConfig = await prisma.vacationAppConfig.findFirst({
      where: { isActive: true },
    });
    if (activeConfig) {
      const cfg = JSON.parse(activeConfig.configJson);
      console.log(`バージョン: ${cfg.version}`);
      console.log(`基準ルール: ${cfg.baselineRule.kind}`);
      if (cfg.fullTime && cfg.fullTime.table) {
        console.log(`\nパターンA 付与テーブル:`);
        for (const row of cfg.fullTime.table) {
          console.log(`  ${row.years}年: ${row.days}日`);
        }
      }
    }

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugVacationCalculation();

