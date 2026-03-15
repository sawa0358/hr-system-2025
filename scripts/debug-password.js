const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function test() {
  // テスト用: 既知のパスワードでハッシュ→検証のフローを確認
  const knownPw = 'test_password_123';
  const knownHash = await bcrypt.hash(knownPw, 12);
  const knownVerify = await bcrypt.compare(knownPw, knownHash);
  console.log('=== bcrypt self-test ===');
  console.log('Hash:', knownHash);
  console.log('Verify:', knownVerify);

  // DB復元後のバックアップb051からのデータを確認
  // 最初の5人の社員パスワード状態を表示
  const employees = await prisma.employee.findMany({
    take: 5,
    select: { id: true, name: true, password: true }
  });

  console.log('\n=== Employee passwords ===');
  for (const emp of employees) {
    const pw = emp.password || '(empty)';
    const isHashed = pw.startsWith('$2');
    console.log(`${emp.name}: len=${pw.length}, hashed=${isHashed}, first7=${pw.substring(0,7)}`);

    if (isHashed) {
      // ハッシュが正しいフォーマットか
      const validFormat = /^\$2[aby]\$\d{2}\$.{53}$/.test(pw);
      console.log(`  format_valid=${validFormat}`);

      // 元のパスワード（名前と同じかもしれない）でテスト
      const nameMatch = await bcrypt.compare(emp.name, pw);
      console.log(`  name_as_pw=${nameMatch}`);
    }
  }

  await prisma.$disconnect();
}

test().catch(e => { console.error(e); process.exit(1); });
