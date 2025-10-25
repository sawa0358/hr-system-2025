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

interface WorkspaceData {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  boards: BoardData[];
  members: WorkspaceMemberData[];
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface BoardData {
  id: string;
  name: string;
  description: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  lists: BoardListData[];
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface BoardListData {
  id: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  cards: CardData[];
}

interface CardData {
  id: string;
  title: string;
  description: string;
  position: number;
  dueDate: string | null;
  priority: string;
  status: string;
  cardColor: string | null;
  isArchived: boolean;
  attachments: any;
  labels: any;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  members: CardMemberData[];
}

interface CardMemberData {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
}

interface WorkspaceMemberData {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    position: string;
  };
}

// 利用可能なワークスペースバックアップの一覧を取得
export async function GET(request: NextRequest) {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME環境変数が設定されていません');
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'workspaces/',
      MaxKeys: 50
    });

    const response = await s3Client.send(command);
    
    const backups = (response.Contents || []).map(obj => ({
      key: obj.Key,
      lastModified: obj.LastModified,
      size: obj.Size,
      displayName: obj.Key?.replace('workspaces/workspace-', '').replace('.json', '') || ''
    })).sort((a, b) => 
      (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0)
    );

    return NextResponse.json({
      success: true,
      backups: backups
    });

  } catch (error) {
    console.error('❌ ワークスペースバックアップ一覧取得エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

// 指定されたバックアップからワークスペースを復元
export async function POST(request: NextRequest) {
  try {
    const { s3Key, targetWorkspaceId } = await request.json();
    
    if (!s3Key) {
      return NextResponse.json(
        { success: false, error: 'S3キーが指定されていません' },
        { status: 400 }
      );
    }

    console.log(`🔄 ワークスペースの復元を開始します: ${s3Key}`);

    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME環境変数が設定されていません');
    }

    // S3からワークスペースデータを取得
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });

    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();
    
    if (!body) {
      throw new Error('S3からデータを取得できませんでした');
    }

    const saveData = JSON.parse(body);
    const workspaceData: WorkspaceData = saveData.workspace;
    
    console.log(`📊 復元対象のワークスペース: ${workspaceData.name}`);
    console.log(`- ボード数: ${workspaceData.boards.length}`);
    console.log(`- メンバー数: ${workspaceData.members.length}`);

    // 現在のワークスペースデータをバックアップ
    let currentWorkspace = null;
    if (targetWorkspaceId) {
      currentWorkspace = await prisma.workspace.findUnique({
        where: { id: targetWorkspaceId },
        include: {
          boards: true,
          members: true,
        }
      });
    }

    // 現在の状態をバックアップとしてS3に保存
    if (currentWorkspace) {
      const backupData = {
        timestamp: new Date().toISOString(),
        workspace: currentWorkspace
      };

      const backupKey = `workspaces/backup-before-restore-${targetWorkspaceId}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const backupCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: backupKey,
        Body: JSON.stringify(backupData, null, 2),
        ContentType: 'application/json'
      });
      await s3Client.send(backupCommand);
      console.log(`💾 現在の状態をバックアップしました: ${backupKey}`);
    }

    // ワークスペースを復元
    const result = await prisma.$transaction(async (tx) => {
      let restoredWorkspace;
      
      if (targetWorkspaceId) {
        // 既存のワークスペースを更新
        restoredWorkspace = await tx.workspace.update({
          where: { id: targetWorkspaceId },
          data: {
            name: workspaceData.name,
            description: workspaceData.description,
          }
        });
        
        // 既存のボードとカードを削除
        await tx.card.deleteMany({
          where: {
            board: {
              workspaceId: targetWorkspaceId
            }
          }
        });
        
        await tx.boardList.deleteMany({
          where: {
            board: {
              workspaceId: targetWorkspaceId
            }
          }
        });
        
        await tx.board.deleteMany({
          where: { workspaceId: targetWorkspaceId }
        });
        
        await tx.workspaceMember.deleteMany({
          where: { workspaceId: targetWorkspaceId }
        });
      } else {
        // 新しいワークスペースを作成
        restoredWorkspace = await tx.workspace.create({
          data: {
            name: workspaceData.name,
            description: workspaceData.description,
            createdBy: workspaceData.createdBy,
          }
        });
      }

      // メンバーを復元
      for (const memberData of workspaceData.members) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: restoredWorkspace.id,
            employeeId: memberData.employee.id,
          }
        });
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

        // リストを復元
        for (const listData of boardData.lists) {
          const restoredList = await tx.boardList.create({
            data: {
              title: listData.title,
              position: listData.position,
              boardId: restoredBoard.id,
            }
          });

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

            // カードメンバーを復元
            for (const memberData of cardData.members) {
              await tx.cardMember.create({
                data: {
                  cardId: restoredCard.id,
                  employeeId: memberData.employee.id,
                }
              });
            }
          }
        }
      }

      return restoredWorkspace;
    });

    console.log(`✅ ワークスペース「${result.name}」を復元しました`);

    // 復元履歴を記録
    await prisma.activityLog.create({
      data: {
        userId: 'system',
        action: 'workspace_restored_from_s3',
        details: JSON.stringify({
          s3Key: s3Key,
          workspaceId: result.id,
          workspaceName: result.name,
          originalTimestamp: saveData.timestamp,
          restoreTimestamp: new Date().toISOString()
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'system-restore'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'ワークスペースを復元しました',
      data: {
        s3Key: s3Key,
        workspaceId: result.id,
        workspaceName: result.name,
        originalTimestamp: saveData.timestamp,
        restoreTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ワークスペース復元エラー:', error);
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
