
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const requesterId = request.headers.get('x-employee-id')
        if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 権限チェック
        const requester = await prisma.employee.findUnique({
            where: { id: requesterId },
            select: { role: true }
        })
        const allowedRoles = ['admin', 'hr', 'manager']
        if (!requester || !allowedRoles.includes(requester.role || '')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { userId, date, status } = body

        if (!userId || !date || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const targetDate = new Date(date)

        const submission = await prisma.personnelEvaluationSubmission.upsert({
            where: {
                employeeId_date: {
                    employeeId: userId,
                    date: targetDate
                }
            },
            update: {
                status: status,
                updatedAt: new Date()
            },
            create: {
                employeeId: userId,
                date: targetDate,
                status: status
            }
        })

        return NextResponse.json(submission)

    } catch (error) {
        console.error('POST /api/evaluations/submissions/status error:', error)
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }
}
