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

// 利用可能なタスク管理バックアップの一覧を取得
export async function GET(request: NextRequest) {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME環境変数が設定されていません');
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'task-management/',
      MaxKeys: 50
    });

    const response = await s3Client.send(command);
    
    const backups = (response.Contents || []).map(obj => ({
      key: obj.Key,
      lastModified: obj.LastModified,
      size: obj.Size,
      displayName: obj.Key?.replace('task-management/full-backup-', '').replace('.json', '') || ''
    })).sort((a, b) => 
      (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0)
    );

    return NextResponse.json({
      success: true,
      backups: backups
    });

  } catch (error) {
    console.error('❌ タスク管理バックアップ一覧取得エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

// 指定されたバックアップからタスク管理全体を復元
export async function POST(request: NextRequest) {
  try {
    const { s3Key, restoreMode = 'replace' } = await request.json();
    
    if (!s3Key) {
      return NextResponse.json(
        { success: false, error: 'S3キーが指定されていません' },
        { status: 400 }
      );
    }

    console.log(`🔄 タスク管理全体の復元を開始します: ${s3Key}`);
    console.log(`復元モード: ${restoreMode}`);

    const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME環境変数が設定されていません');
    }

    // S3からバックアップデータを取得
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });

    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();
    
    if (!body) {
      throw new Error('S3からデータを取得できませんでした');
    }

    const backupData = JSON.parse(body);
    
    console.log(`📊 復元対象のバックアップデータ:`);
    console.log(`- ワークスペース数: ${backupData.statistics.totalWorkspaces}`);
    console.log(`- ボード数: ${backupData.statistics.totalBoards}`);
    console.log(`- カード数: ${backupData.statistics.totalCards}`);
    console.log(`- タスク数: ${backupData.statistics.totalTasks}`);
    console.log(`- バックアップ日時: ${backupData.timestamp}`);

    // 現在のデータをバックアップ（復元前に）
    if (restoreMode === 'replace') {
      console.log('💾 現在のデータをバックアップ中...');
      
      const currentWorkspaces = await prisma.workspace.findMany({
        include: {
          boards: {
            include: {
              lists: {
                include: {
                  cards: true
                }
              }
            }
          },
          members: true
        }
      });

      const currentTasks = await prisma.task.findMany({
        include: {
          members: true
        }
      });

      const currentBackupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        type: 'pre_restore_backup',
        workspaces: currentWorkspaces,
        tasks: currentTasks,
        metadata: {
          savedBy: 'system',
          saveReason: 'pre_restore_backup',
          restoreFrom: s3Key
        }
      };

      const currentBackupKey = `task-management/pre-restore-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const currentBackupCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: currentBackupKey,
        Body: JSON.stringify(currentBackupData, null, 2),
        ContentType: 'application/json'
      });
      await s3Client.send(currentBackupCommand);
      console.log(`💾 現在のデータをバックアップしました: ${currentBackupKey}`);
    }

    // データを復元
    const result = await prisma.$transaction(async (tx) => {
      let restoredCounts = {
        workspaces: 0,
        boards: 0,
        lists: 0,
        cards: 0,
        tasks: 0,
        members: 0
      };

      if (restoreMode === 'replace') {
        // 既存のデータを削除
        console.log('🗑️ 既存のデータを削除中...');
        
        await tx.cardMember.deleteMany({});
        await tx.card.deleteMany({});
        await tx.boardList.deleteMany({});
        await tx.board.deleteMany({});
        await tx.workspaceMember.deleteMany({});
        await tx.workspace.deleteMany({});
        await tx.taskMember.deleteMany({});
        await tx.task.deleteMany({});
        
        console.log('✅ 既存のデータを削除しました');
      }

      // ワークスペースを復元
      console.log('🔄 ワークスペースを復元中...');
      for (const workspaceData of backupData.workspaces) {
        const restoredWorkspace = await tx.workspace.create({
          data: {
            name: workspaceData.name,
            description: workspaceData.description,
            createdBy: workspaceData.createdBy,
          }
        });
        restoredCounts.workspaces++;

        // ワークスペースメンバーを復元
        for (const memberData of workspaceData.members) {
          await tx.workspaceMember.create({
            data: {
              workspaceId: restoredWorkspace.id,
              employeeId: memberData.employee.id,
            }
          });
          restoredCounts.members++;
        }

        // ボードを復元
        for (const boardData of workspaceData.boards) {
          const restoredBoard = await tx.board.create({
            data: {
              name: boardData.name,
              description: boardData.description,
              position: boardData.position,
              workspaceId: restoredWorkspace.id,
              createdBy: boardData.creator.id,
            }
          });
          restoredCounts.boards++;

          // リストを復元
          for (const listData of boardData.lists) {
            const restoredList = await tx.boardList.create({
              data: {
                title: listData.title,
                position: listData.position,
                boardId: restoredBoard.id,
              }
            });
            restoredCounts.lists++;

            // カードを復元
            for (const cardData of listData.cards) {
              const restoredCard = await tx.card.create({
                data: {
                  title: cardData.title,
                  description: cardData.description,
                  position: cardData.position,
                  dueDate: cardData.dueDate ? new Date(cardData.dueDate) : null,
                  priority: cardData.priority,
                  status: cardData.status,
                  cardColor: cardData.cardColor,
                  isArchived: cardData.isArchived,
                  attachments: cardData.attachments,
                  labels: cardData.labels,
                  listId: restoredList.id,
                  boardId: restoredBoard.id,
                  createdBy: cardData.creator.id,
                }
              });
              restoredCounts.cards++;

              // カードメンバーを復元
              for (const memberData of cardData.members) {
                await tx.cardMember.create({
                  data: {
                    cardId: restoredCard.id,
                    employeeId: memberData.employee.id,
                  }
                });
                restoredCounts.members++;
              }
            }
          }
        }
      }

      // タスクを復元
      console.log('🔄 タスクを復元中...');
      for (const taskData of backupData.tasks) {
        const restoredTask = await tx.task.create({
          data: {
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            priority: taskData.priority,
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
            employeeId: taskData.employee.id,
          }
        });
        restoredCounts.tasks++;

        // タスクメンバーを復元
        for (const memberData of taskData.members) {
          await tx.taskMember.create({
            data: {
              taskId: restoredTask.id,
              employeeId: memberData.employee.id,
            }
          });
          restoredCounts.members++;
        }
      }

      return restoredCounts;
    });

    console.log(`✅ タスク管理全体を復元しました`);
    console.log(`復元結果:`, result);

    // 復元履歴を記録
    await prisma.activityLog.create({
      data: {
        userId: 'system',
        action: 'task_management_full_restore',
        details: JSON.stringify({
          s3Key: s3Key,
          restoreMode: restoreMode,
          restoredCounts: result,
          originalTimestamp: backupData.timestamp,
          restoreTimestamp: new Date().toISOString()
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'system-restore'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'タスク管理全体を復元しました',
      data: {
        s3Key: s3Key,
        restoreMode: restoreMode,
        restoredCounts: result,
        originalTimestamp: backupData.timestamp,
        restoreTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ タスク管理復元エラー:', error);
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
