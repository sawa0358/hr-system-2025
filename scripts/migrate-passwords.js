const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function migratePasswords() {
  console.log('パスワードハッシュ化マイグレーションを開始します...');

  try {
    const employees = await prisma.employee.findMany({
      select: { id: true, name: true, password: true }
    });

    let migrated = 0;
    let alreadyHashed = 0;
    let errors = 0;

    for (const emp of employees) {
      // 既にbcryptハッシュ済みの場合はスキップ
      if (emp.password && emp.password.startsWith('$2')) {
        alreadyHashed++;
        continue;
      }

      if (!emp.password) {
        console.warn(`  ⚠ ${emp.name} (${emp.id}): パスワードが空です。スキップ。`);
        continue;
      }

      try {
        const hashed = await bcrypt.hash(emp.password, SALT_ROUNDS);
        await prisma.employee.update({
          where: { id: emp.id },
          data: { password: hashed }
        });
        migrated++;
        console.log(`  ✅ ${emp.name}: ハッシュ化完了`);
      } catch (err) {
        errors++;
        console.error(`  ❌ ${emp.name} (${emp.id}): ハッシュ化失敗:`, err.message);
      }
    }

    console.log('\n--- マイグレーション結果 ---');
    console.log(`  合計社員数: ${employees.length}`);
    console.log(`  ハッシュ化: ${migrated}`);
    console.log(`  既にハッシュ済み: ${alreadyHashed}`);
    console.log(`  エラー: ${errors}`);
    console.log('パスワードハッシュ化マイグレーション完了');
  } catch (error) {
    console.error('マイグレーションエラー:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migratePasswords();
