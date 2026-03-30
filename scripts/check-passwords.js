const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emps = await prisma.employee.findMany({
    select: { id: true, name: true, password: true }
  });

  let empty = 0, hashed = 0, plain = 0;
  emps.forEach(e => {
    if (!e.password || e.password === '') {
      empty++;
      console.log('EMPTY:', e.id, e.name);
    } else if (e.password.startsWith('$2')) {
      hashed++;
    } else {
      plain++;
      console.log('PLAIN:', e.id, e.name, e.password.substring(0, 10));
    }
  });
  console.log('---');
  console.log('Total:', emps.length, '| Empty:', empty, '| Hashed:', hashed, '| Plain:', plain);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
