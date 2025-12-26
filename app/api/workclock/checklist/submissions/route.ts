
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workclock/checklist/submissions
export async function GET(request: Request) {
    try {
        let userId = (request.headers.get('x-employee-id') || (request as any).headers?.get?.('x-employee-id'))

        const { searchParams } = new URL(request.url)
        const workerId = searchParams.get('workerId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // 認証IDがない場合でも、workerIdが指定されていれば許可する（打刻機モードなどの考慮）
        if (!userId && workerId) {
            userId = workerId
        }

        if (!userId) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const where: any = {}
        if (workerId) where.workerId = workerId
        if (startDate || endDate) {
            where.date = {}
            if (startDate) {
                const parts = startDate.split('-').map(Number);
                where.date.gte = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
            }
            if (endDate) {
                const parts = endDate.split('-').map(Number);
                where.date.lte = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
            }
        }

        const submissions = await (prisma as any).workClockChecklistSubmission.findMany({
            where,
            include: {
                worker: {
                    select: { name: true, teams: true, role: true, companyName: true }
                },
                items: true,
                photos: true,
            },
            orderBy: { date: 'desc' }, // 日付順
        })

        return NextResponse.json({ submissions })
    } catch (error) {
        console.error('GET /api/workclock/checklist/submissions error:', error)
        return NextResponse.json({ error: '報告の取得に失敗しました' }, { status: 500 })
    }
}

// POST /api/workclock/checklist/submissions
export async function POST(request: Request) {
    try {
        let userId = (request.headers.get('x-employee-id') || (request as any).headers?.get?.('x-employee-id'))

        const body = await request.json()
        const { workerId, date, memo, photoUrl, photos, hasPhoto, isSafetyAlert, items } = body

        // 認証IDがない場合でも、workerIdが指定されていれば許可する
        if (!userId && workerId) {
            userId = workerId
        }

        if (!userId) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        if (!workerId || !date || !items || !Array.isArray(items)) {
            return NextResponse.json({ message: '必須項目が不足しています' }, { status: 400 })
        }

        // ワーカーの存在確認
        const worker = await (prisma as any).workClockWorker.findUnique({
            where: { id: workerId }
        })
        if (!worker) {
            return NextResponse.json({ message: `指定されたワーカー(ID: ${workerId})が見つかりません。有効なワーカーを選択してください。` }, { status: 400 })
        }

        // 日付を正規化 (yyyy-mm-dd形式の文字列から直接年月日を抽出することで、タイムゾーンのズレを防ぐ)
        const dateParts = date.split('-').map(Number);
        const startOfDay = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0, 0);
        const endOfDay = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 23, 59, 59, 999);

        // デバッグログ
        console.log(`Processing submission for worker: ${workerId}, date: ${date} -> Range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

        // 同じ日の既存の提出をすべて検索して削除（重複防止の徹底）
        const existingSubmissions = await (prisma as any).workClockChecklistSubmission.findMany({
            where: {
                workerId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            select: { id: true },
        })

        if (existingSubmissions.length > 0) {
            const ids = existingSubmissions.map((s: any) => s.id)
            // 既存の項目を一括削除
            await (prisma as any).workClockChecklistSubmissionItem.deleteMany({
                where: { submissionId: { in: ids } },
            })
            // 既存の写真も一括削除（カスケード設定はあるが念のため）
            await (prisma as any).workClockChecklistPhoto.deleteMany({
                where: { submissionId: { in: ids } },
            })
            // 既存の提出本体を一括削除
            await (prisma as any).workClockChecklistSubmission.deleteMany({
                where: { id: { in: ids } },
            })
            console.log(`Deleted ${ids.length} existing submissions for worker ${workerId} on ${date}`)
        }

        // 写真データの準備
        // レガシー互換性: photoUrlがあればそれもphotos配列に加える（重複なければ）
        const photoUrls: string[] = Array.isArray(photos) ? photos : [];
        if (photoUrl && !photoUrls.includes(photoUrl)) {
            photoUrls.unshift(photoUrl);
        }

        // 新規作成
        const submission = await (prisma as any).workClockChecklistSubmission.create({
            data: {
                workerId,
                date: startOfDay,
                memo,
                photoUrl: photoUrls.length > 0 ? photoUrls[0] : null, // 互換性のため最初の1枚を入れる
                hasPhoto: photoUrls.length > 0,
                isSafetyAlert: !!isSafetyAlert,
                items: {
                    create: items.map((item: any) => ({
                        title: item.title,
                        reward: Number(item.reward) || 0,
                        isMandatory: !!item.isMandatory,
                        isChecked: !!item.isChecked,
                        isFreeText: !!item.isFreeText,
                        freeTextValue: item.freeTextValue || null,
                        category: item.category,
                    }))
                },
                photos: {
                    create: photoUrls.map((url: string) => ({
                        url: url
                    }))
                }
            },
            include: {
                items: true,
                photos: true
            }
        })

        return NextResponse.json({ submission })
    } catch (error) {
        console.error('POST /api/workclock/checklist/submissions error full:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json({
            message: `報告の提出に失敗しました: ${errorMessage}`,
            error: errorMessage
        }, { status: 500 })
    }
}
