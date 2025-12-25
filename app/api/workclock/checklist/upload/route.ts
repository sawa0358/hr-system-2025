
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { uploadFileToS3 } from '@/lib/s3-client'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `${crypto.randomUUID()}-${file.name}`

        // AWS_S3_BUCKET_NAMEが設定されていればS3を使用
        const useS3 = !!process.env.AWS_S3_BUCKET_NAME;

        if (useS3) {
            console.log('Using S3 for checklist photo upload');
            const result = await uploadFileToS3(
                buffer,
                filename,
                file.type,
                'checklists'
            );

            if (result.success && result.filePath) {
                return NextResponse.json({
                    success: true,
                    url: `/api/workclock/checklist/photo/${result.filePath}`
                })
            } else {
                throw new Error(result.error || 'S3 upload failed');
            }
        } else {
            // ローカル保存
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'checklists')

            try {
                await mkdir(uploadDir, { recursive: true })
            } catch (e) { }

            const filePath = path.join(uploadDir, filename)
            await writeFile(filePath, buffer)

            const relativePath = `/uploads/checklists/${filename}`

            return NextResponse.json({
                success: true,
                url: relativePath
            })
        }
    } catch (error) {
        console.error('Checklist upload error:', error)
        return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
    }
}
