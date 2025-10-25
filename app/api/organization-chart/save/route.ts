import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 組織図のS3保存を開始します...');

    // 組織図に表示される社員を取得
    const employees = await prisma.employee.findMany({
      where: {
        showInOrgChart: true,
        status: {
          in: ['active', 'copy']
        }
      },
      select: {
        id: true,
        name: true,
        position: true,
        department: true,
        employeeNumber: true,
        organization: true,
        team: true,
        parentEmployeeId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        employeeNumber: 'asc'
      }
    });

    console.log(`📊 取得した社員数: ${employees.length}`);

    // 階層構造を構築
    const buildHierarchy = (employees: any[]): OrgChartNode[] => {
      const nodeMap = new Map<string, OrgChartNode>();
      const rootNodes: OrgChartNode[] = [];

      // 全社員をノードマップに追加
      employees.forEach(emp => {
        const node: OrgChartNode = {
          id: emp.id,
          name: emp.name,
          position: emp.position,
          department: emp.department,
          employeeNumber: emp.employeeNumber,
          organization: emp.organization,
          team: emp.team,
          parentEmployeeId: emp.parentEmployeeId,
          metadata: {
            createdAt: emp.createdAt.toISOString(),
            updatedAt: emp.updatedAt.toISOString(),
            status: emp.status,
          }
        };
        nodeMap.set(emp.id, node);
      });

      // 階層関係を構築
      employees.forEach(emp => {
        const node = nodeMap.get(emp.id)!;
        
        if (emp.parentEmployeeId) {
          const parentNode = nodeMap.get(emp.parentEmployeeId);
          if (parentNode) {
            if (!parentNode.children) {
              parentNode.children = [];
            }
            parentNode.children.push(node);
          } else {
            // 親が見つからない場合はルートノードとして追加
            rootNodes.push(node);
          }
        } else {
          // 親がいない場合はルートノードとして追加
          rootNodes.push(node);
        }
      });

      return rootNodes;
    };

    const hierarchy = buildHierarchy(employees);

    // 組織図データを準備
    const orgChartData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      totalEmployees: employees.length,
      hierarchy: hierarchy,
      metadata: {
        savedBy: 'system',
        saveReason: 'organization_chart_backup',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // S3に保存
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME環境変数が設定されていません');
    }

    const key = `organization-charts/org-chart-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(orgChartData, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'org-chart-version': '1.0',
        'total-employees': employees.length.toString(),
        'save-timestamp': new Date().toISOString(),
      }
    });

    await s3Client.send(command);

    console.log(`✅ 組織図をS3に保存しました: s3://${bucketName}/${key}`);

    // データベースに保存履歴を記録
    await prisma.activityLog.create({
      data: {
        userId: 'system',
        action: 'organization_chart_saved_to_s3',
        details: JSON.stringify({
          s3Key: key,
          totalEmployees: employees.length,
          timestamp: new Date().toISOString()
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'system-backup'
      }
    });

    return NextResponse.json({
      success: true,
      message: '組織図をS3に保存しました',
      data: {
        s3Key: key,
        totalEmployees: employees.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 組織図S3保存エラー:', error);
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
