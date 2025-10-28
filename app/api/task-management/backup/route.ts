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

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 タスク管理全体のバックアップを開始します...');

    // 全ワークスペースのデータを取得
    const workspaces = await prisma.workspace.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                position: true,
              },
            },
          },
        },
        boards: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            lists: {
              include: {
                cards: {
                  include: {
                    creator: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                    members: {
                      include: {
                        employee: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                            department: true,
                          },
                        },
                      },
                    },
                  },
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 全タスクのデータを取得
    const tasks = await prisma.task.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        members: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📊 タスク管理データを取得しました`);
    console.log(`- ワークスペース数: ${workspaces.length}`);
    console.log(`- タスク数: ${tasks.length}`);

    // 統計情報を計算
    const totalBoards = workspaces.reduce((sum, ws) => sum + ws.boards.length, 0);
    const totalLists = workspaces.reduce((sum, ws) => 
      sum + ws.boards.reduce((boardSum, board) => boardSum + board.lists.length, 0), 0);
    const totalCards = workspaces.reduce((sum, ws) => 
      sum + ws.boards.reduce((boardSum, board) => 
        boardSum + board.lists.reduce((listSum, list) => listSum + list.cards.length, 0), 0), 0);
    const totalMembers = workspaces.reduce((sum, ws) => sum + ws.members.length, 0);

    // バックアップデータを準備
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      type: 'task_management_full_backup',
      statistics: {
        totalWorkspaces: workspaces.length,
        totalBoards: totalBoards,
        totalLists: totalLists,
        totalCards: totalCards,
        totalTasks: tasks.length,
        totalMembers: totalMembers,
      },
      workspaces: workspaces.map(workspace => ({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        createdBy: workspace.createdBy,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
        creator: workspace.creator,
        members: workspace.members.map(member => ({
          id: member.id,
          employee: member.employee,
        })),
        boards: workspace.boards.map(board => ({
          id: board.id,
          name: board.name,
          description: board.description || '',
          position: board.position,
          createdAt: board.createdAt.toISOString(),
          updatedAt: board.updatedAt.toISOString(),
          creator: board.creator,
          lists: board.lists.map(list => ({
            id: list.id,
            title: list.title,
            position: list.position,
            createdAt: list.createdAt.toISOString(),
            updatedAt: list.updatedAt.toISOString(),
            cards: list.cards.map(card => ({
              id: card.id,
              title: card.title,
              description: card.description || '',
              position: card.position,
              dueDate: card.dueDate?.toISOString() || null,
              priority: card.priority,
              status: card.status,
              cardColor: card.cardColor,
              isArchived: card.isArchived,
              attachments: card.attachments,
              labels: card.labels,
              createdAt: card.createdAt.toISOString(),
              updatedAt: card.updatedAt.toISOString(),
              creator: card.creator,
              members: card.members.map(member => ({
                id: member.id,
                employee: member.employee,
              })),
            })),
          })),
        })),
      })),
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString() || null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        employee: task.employee,
        members: task.members.map(member => ({
          id: member.id,
          employee: member.employee,
        })),
      })),
      metadata: {
        savedBy: 'system',
        saveReason: 'task_management_full_backup',
        environment: process.env.NODE_ENV || 'development',
        databaseType: 'sqlite', // または 'postgresql'
        backupVersion: '1.0'
      }
    };

    // S3に保存
    const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME環境変数が設定されていません');
    }

    const key = `task-management/full-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(backupData, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'backup-version': '1.0',
        'backup-type': 'task_management_full',
        'total-workspaces': workspaces.length.toString(),
        'total-boards': totalBoards.toString(),
        'total-cards': totalCards.toString(),
        'total-tasks': tasks.length.toString(),
        'save-timestamp': new Date().toISOString(),
      }
    });

    await s3Client.send(command);

    console.log(`✅ タスク管理全体をS3にバックアップしました: s3://${bucketName}/${key}`);

    // データベースにバックアップ履歴を記録
    await prisma.activityLog.create({
      data: {
        userId: 'system',
        action: 'task_management_full_backup',
        details: JSON.stringify({
          s3Key: key,
          totalWorkspaces: workspaces.length,
          totalBoards: totalBoards,
          totalCards: totalCards,
          totalTasks: tasks.length,
          totalMembers: totalMembers,
          timestamp: new Date().toISOString()
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'system-backup'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'タスク管理全体をS3にバックアップしました',
      data: {
        s3Key: key,
        statistics: backupData.statistics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ タスク管理バックアップエラー:', error);
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
