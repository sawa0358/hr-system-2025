// Heroku本番DBに回数パターンフィールドを追加するマイグレーションスクリプト
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrate() {
  console.log('=== 回数パターンマイグレーション開始 ===')
  
  try {
    // PostgreSQL用の生SQL実行
    await prisma.$executeRawUnsafe(`
      ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countPatternLabelA" TEXT DEFAULT '回数Aパターン'
    `)
    console.log('✓ countPatternLabelA 追加')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countPatternLabelB" TEXT DEFAULT '回数Bパターン'
    `)
    console.log('✓ countPatternLabelB 追加')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countPatternLabelC" TEXT DEFAULT '回数Cパターン'
    `)
    console.log('✓ countPatternLabelC 追加')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countRateA" DOUBLE PRECISION
    `)
    console.log('✓ countRateA 追加')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countRateB" DOUBLE PRECISION
    `)
    console.log('✓ countRateB 追加')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE workclock_workers ADD COLUMN IF NOT EXISTS "countRateC" DOUBLE PRECISION
    `)
    console.log('✓ countRateC 追加')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE workclock_time_entries ADD COLUMN IF NOT EXISTS "countPattern" TEXT
    `)
    console.log('✓ countPattern 追加')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE workclock_time_entries ADD COLUMN IF NOT EXISTS "count" INTEGER
    `)
    console.log('✓ count 追加')

    console.log('')
    console.log('=== マイグレーション完了 ===')
    console.log('すべての回数パターンフィールドが正常に追加されました')
    
  } catch (error) {
    console.error('マイグレーションエラー:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate()
  .then(() => {
    console.log('マイグレーション成功')
    process.exit(0)
  })
  .catch((error) => {
    console.error('マイグレーション失敗:', error)
    process.exit(1)
  })



