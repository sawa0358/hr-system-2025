const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const tables = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table'")
    console.log('tables:', tables)
  } catch (e) {
    console.error('error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()


