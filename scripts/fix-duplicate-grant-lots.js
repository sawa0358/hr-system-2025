// 重複付与ロットの修正スクリプト
// 同じ付与日で複数のロットがある場合、最新の設定バージョンのみを残す

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicateGrantLots() {
  try {
    console.log('重複ロットの修正を開始...\n');

    // すべての社員を取得
    const employees = await prisma.employee.findMany({
      where: {
        status: { not: 'copy' },
      },
      select: {
        id: true,
        name: true,
      },
    });

    let totalFixed = 0;

    for (const emp of employees) {
      // 各社員の付与ロットを取得
      const lots = await prisma.grantLot.findMany({
        where: { employeeId: emp.id },
        orderBy: [
          { grantDate: 'asc' },
          { configVersion: 'desc' }, // 新しい設定バージョンを優先
        ],
      });

      // 付与日ごとにグループ化
      const lotsByDate = new Map();
      for (const lot of lots) {
        const dateKey = lot.grantDate.toISOString().split('T')[0];
        if (!lotsByDate.has(dateKey)) {
          lotsByDate.set(dateKey, []);
        }
        lotsByDate.get(dateKey).push(lot);
      }

      // 同じ付与日で複数のロットがある場合、最新の設定バージョンのみを残す
      for (const [dateKey, dateLots] of lotsByDate.entries()) {
        if (dateLots.length > 1) {
          console.log(`社員: ${emp.name} (ID: ${emp.id})`);
          console.log(`  付与日: ${dateKey} のロット数: ${dateLots.length}`);

          // 設定バージョンでソート（新しいものを優先）
          dateLots.sort((a, b) => {
            if (a.configVersion && b.configVersion) {
              return b.configVersion.localeCompare(a.configVersion);
            }
            return (b.configVersion || '').localeCompare(a.configVersion || '');
          });

          const keepLot = dateLots[0]; // 最新の設定バージョンのロットを保持
          const deleteLots = dateLots.slice(1); // 残りは削除対象

          for (const deleteLot of deleteLots) {
            // 消費済みがあるかチェック
            const consumptions = await prisma.consumption.findMany({
              where: { lotId: deleteLot.id },
            });

            if (consumptions.length > 0) {
              // 消費済みがある場合は削除せず、残日数を0にして無効化
              console.log(`    ロット ${deleteLot.id} (設定: ${deleteLot.configVersion}): 消費済みがあるため無効化`);
              await prisma.grantLot.update({
                where: { id: deleteLot.id },
                data: { daysRemaining: 0 },
              });
            } else {
              // 未使用の場合は削除
              console.log(`    ロット ${deleteLot.id} (設定: ${deleteLot.configVersion}): 削除`);
              await prisma.grantLot.delete({
                where: { id: deleteLot.id },
              });
            }
            totalFixed++;
          }

          console.log(`  保持するロット: ${keepLot.id} (設定: ${keepLot.configVersion})\n`);
        }
      }
    }

    console.log(`\n修正完了: ${totalFixed}件の重複ロットを処理しました`);
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateGrantLots();

