import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

// S3クライアントの設定
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface OrgChartNode {
  id: string;
  name: string;
  position: string;
  department: string;
  employeeNumber?: string;
  organization?: string;
  team?: string;
  parentEmployeeId?: string;
  children?: OrgChartNode[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    status: string;
  };
}

interface OrgChartData {
  version: string;
  timestamp: string;
  totalEmployees: number;
  hierarchy: OrgChartNode[];
  metadata: {
    savedBy: string;
    saveReason: string;
    environment: string;
  };
}

// 利用可能な組織図バックアップの一覧を取得
export async function GET(request: NextRequest) {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME環境変数が設定されていません');
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'organization-charts/',
      MaxKeys: 50
    });

    const response = await s3Client.send(command);
    
    const backups = (response.Contents || []).map(obj => ({
      key: obj.Key,
      lastModified: obj.LastModified,
      size: obj.Size,
      displayName: obj.Key?.replace('organization-charts/org-chart-', '').replace('.json', '') || ''
    })).sort((a, b) => 
      (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0)
    );

    return NextResponse.json({
      success: true,
      backups: backups
    });

  } catch (error) {
    console.error('❌ 組織図バックアップ一覧取得エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

// 指定されたバックアップから組織図を復元
export async function POST(request: NextRequest) {
  try {
    const { s3Key } = await request.json();
    
    if (!s3Key) {
      return NextResponse.json(
        { success: false, error: 'S3キーが指定されていません' },
        { status: 400 }
      );
    }

    console.log(`🔄 組織図の復元を開始します: ${s3Key}`);

    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME環境変数が設定されていません');
    }

    // S3から組織図データを取得
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });

    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();
    
    if (!body) {
      throw new Error('S3からデータを取得できませんでした');
    }

    const orgChartData: OrgChartData = JSON.parse(body);
    console.log(`📊 復元対象の社員数: ${orgChartData.totalEmployees}`);

    // 現在の組織図データをバックアップ
    const currentEmployees = await prisma.employee.findMany({
      where: { showInOrgChart: true },
      select: { id: true, name: true, parentEmployeeId: true }
    });

    const backupData = {
      timestamp: new Date().toISOString(),
      employees: currentEmployees
    };

    // 現在の状態をバックアップとしてS3に保存
    const backupKey = `organization-charts/backup-before-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const backupCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: backupKey,
      Body: JSON.stringify(backupData, null, 2),
      ContentType: 'application/json'
    });
    await s3Client.send(backupCommand);
    console.log(`💾 現在の状態をバックアップしました: ${backupKey}`);

    // 階層構造をフラット化してparentEmployeeIdを更新
    const flattenHierarchy = (nodes: OrgChartNode[]): { id: string; parentEmployeeId: string | null }[] => {
      const result: { id: string; parentEmployeeId: string | null }[] = [];
      
      const traverse = (node: OrgChartNode, parentId: string | null = null) => {
        result.push({
          id: node.id,
          parentEmployeeId: parentId
        });
        
        if (node.children) {
          node.children.forEach(child => traverse(child, node.id));
        }
      };
      
      nodes.forEach(node => traverse(node));
      return result;
    };

    const hierarchyUpdates = flattenHierarchy(orgChartData.hierarchy);
    console.log(`🔄 更新対象の階層関係数: ${hierarchyUpdates.length}`);

    // データベースの階層関係を更新
    let updatedCount = 0;
    for (const update of hierarchyUpdates) {
      try {
        await prisma.employee.update({
          where: { id: update.id },
          data: { parentEmployeeId: update.parentEmployeeId }
        });
        updatedCount++;
      } catch (error) {
        console.warn(`⚠️ 社員ID ${update.id} の更新に失敗:`, error);
      }
    }

    console.log(`✅ ${updatedCount}件の階層関係を更新しました`);

    // 復元履歴を記録
    await prisma.activityLog.create({
      data: {
        userId: 'system',
        action: 'organization_chart_restored_from_s3',
        details: JSON.stringify({
          s3Key: s3Key,
          backupKey: backupKey,
          updatedCount: updatedCount,
          originalTimestamp: orgChartData.timestamp,
          restoreTimestamp: new Date().toISOString()
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'system-restore'
      }
    });

    return NextResponse.json({
      success: true,
      message: '組織図を復元しました',
      data: {
        s3Key: s3Key,
        backupKey: backupKey,
        updatedCount: updatedCount,
        originalTimestamp: orgChartData.timestamp,
        restoreTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 組織図復元エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '不明なエラー',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
