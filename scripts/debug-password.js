const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function test() {
  const emp = await prisma.employee.findFirst({
    where: { name: '大澤仁志' },
    select: { id: true, name: true, password: true }
  });

  if (!emp) {
    console.log('Employee not found');
    await prisma.$disconnect();
    return;
  }

  console.log('Name:', emp.name);
  console.log('PW length:', emp.password.length);
  console.log('Starts $2:', emp.password.startsWith('$2'));
  console.log('First 10:', emp.password.substring(0, 10));

  // bcrypt hash format check
  const valid = /^\$2[aby]\$\d{2}\$.{53}$/.test(emp.password);
  console.log('Valid bcrypt format:', valid);

  // bcrypt self-test
  const h = await bcrypt.hash('test123', 12);
  const r = await bcrypt.compare('test123', h);
  console.log('bcrypt self-test:', r);

  // Check if double-hashed (hash of a hash)
  const isDoubleHashed = emp.password.startsWith('$2') && emp.password.length > 70;
  console.log('Possibly double-hashed:', isDoubleHashed);

  await prisma.$disconnect();
}

test().catch(e => { console.error(e); process.exit(1); });
