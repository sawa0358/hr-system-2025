
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// デフォルト設定値
const DEFAULT_CONFIG = {
    thankYouSendPoints: 5,      // 送信者がもらえるpt
    thankYouReceivePoints: 10,  // 受信者がもらえるpt
    thankYouDailyLimit: 50      // 1日あたりの獲得上限pt
}

// GET: 設定値の取得
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const key = searchParams.get('key')

        if (key) {
            // 単一キーの取得
            const config = await prisma.personnelEvaluationConfig.findUnique({
                where: { key }
            })

            if (!config) {
                // デフォルト値を返す
                const defaultValue = DEFAULT_CONFIG[key as keyof typeof DEFAULT_CONFIG]
                return NextResponse.json({ key, value: defaultValue ?? null })
            }

            return NextResponse.json(config)
        }

        // 全設定を取得
        const configs = await prisma.personnelEvaluationConfig.findMany()

        // デフォルト値とマージ
        const result: Record<string, any> = { ...DEFAULT_CONFIG }
        configs.forEach(c => {
            result[c.key] = isNaN(Number(c.value)) ? c.value : Number(c.value)
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('GET /api/evaluations/settings/config error:', error)
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
    }
}

// POST: 設定値の更新
export async function POST(request: Request) {
    try {
        const requesterId = request.headers.get('x-employee-id')
        if (!requesterId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 権限チェック (adminのみ)
        const requester = await prisma.employee.findUnique({
            where: { id: requesterId },
            select: { role: true }
        })

        if (!requester || !['admin', 'hr'].includes(requester.role || '')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { key, value, description } = body

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 })
        }

        // Upsert
        const config = await prisma.personnelEvaluationConfig.upsert({
            where: { key },
            create: {
                key,
                value: String(value),
                description
            },
            update: {
                value: String(value),
                description
            }
        })

        return NextResponse.json(config)

    } catch (error) {
        console.error('POST /api/evaluations/settings/config error:', error)
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
    }
}
