
import { NextRequest, NextResponse } from 'next/server';
import { getSignedDownloadUrl } from '@/lib/s3-client';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const filePath = params.path.join('/');

        // AWS_S3_BUCKET_NAMEが設定されていればS3から取得
        const useS3 = !!process.env.AWS_S3_BUCKET_NAME;

        if (useS3) {
            const downloadResult = await getSignedDownloadUrl(filePath, 3600);
            if (downloadResult.success && downloadResult.url) {
                const fileResponse = await fetch(downloadResult.url);
                if (fileResponse.ok) {
                    const fileBuffer = await fileResponse.arrayBuffer();
                    const contentType = fileResponse.headers.get('Content-Type') || 'image/jpeg';

                    return new NextResponse(new Uint8Array(fileBuffer), {
                        headers: {
                            'Content-Type': contentType,
                            'Cache-Control': 'public, max-age=3600'
                        }
                    });
                }
            }
        }

        // ローカルフォールバック
        const filename = params.path[params.path.length - 1];
        const localPath = path.join(process.cwd(), 'public', 'uploads', 'checklists', filename);

        try {
            await fs.access(localPath);
            const fileBuffer = await fs.readFile(localPath);
            const ext = path.extname(filename).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

            return new NextResponse(new Uint8Array(fileBuffer), {
                headers: {
                    'Content-Type': mimeType,
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        } catch (e) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Checklist photo fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
