import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';

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

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 ワークスペースのS3保存を開始します...');

    const { workspaceId } = await request.json();
    
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'ワークスペースIDが指定されていません' },
        { status: 400 }
      );
    }

    // ワークスペースの詳細データを取得
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
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
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'ワークスペースが見つかりません' },
        { status: 404 }
      );
    }

    console.log(`📊 ワークスペース「${workspace.name}」のデータを取得しました`);
    console.log(`- ボード数: ${workspace.boards.length}`);
    console.log(`- メンバー数: ${workspace.members.length}`);

    // ワークスペースデータを準備
    const workspaceData: WorkspaceData = {
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
    };

    // 保存用データを準備
    const saveData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      totalBoards: workspace.boards.length,
      totalCards: workspace.boards.reduce((sum, board) => 
        sum + board.lists.reduce((listSum, list) => listSum + list.cards.length, 0), 0),
      totalMembers: workspace.members.length,
      workspace: workspaceData,
      metadata: {
        savedBy: 'system',
        saveReason: 'workspace_backup',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // S3に保存
    const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      // ローカル開発環境ではS3が設定されていない場合があるため、警告のみ出して成功レスポンスを返す
      console.warn('⚠️ AWS_S3_BUCKET_NAME環境変数が設定されていません。S3への保存をスキップします。');
      return NextResponse.json({
        success: true,
        message: 'ワークスペースの保存をスキップしました（S3未設定）',
        skipped: true,
        workspaceId: workspace.id,
      });
    }

    const key = `workspaces/workspace-${workspace.id}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    // S3メタデータはASCII文字のみ許可されるため、日本語名をエンコード
    const safeWorkspaceName = Buffer.from(workspace.name, 'utf-8').toString('base64');
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(saveData, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'workspace-version': '1.0',
        'workspace-id': workspace.id,
        'workspace-name': safeWorkspaceName, // Base64エンコードされたワークスペース名
        'total-boards': workspace.boards.length.toString(),
        'total-cards': saveData.totalCards.toString(),
        'save-timestamp': new Date().toISOString(),
      }
    });

    await s3Client.send(command);

    console.log(`✅ ワークスペースをS3に保存しました: s3://${bucketName}/${key}`);

    // データベースに保存履歴を記録
    try {
      await prisma.activityLog.create({
        data: {
          userId: 'system',
          userName: 'システム', // userNameフィールドを追加
          action: 'workspace_saved_to_s3',
          module: 'workspace', // moduleフィールドを追加
          details: JSON.stringify({
            s3Key: key,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            totalBoards: workspace.boards.length,
            totalCards: saveData.totalCards,
            totalMembers: workspace.members.length,
            timestamp: new Date().toISOString()
          }),
          ipAddress: '127.0.0.1',
          userAgent: 'system-backup'
        }
      });
    } catch (logError) {
      // ActivityLogの記録に失敗してもS3への保存は成功しているため、警告のみ
      console.warn('アクティビティログの記録に失敗しました:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'ワークスペースをS3に保存しました',
      data: {
        s3Key: key,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        totalBoards: workspace.boards.length,
        totalCards: saveData.totalCards,
        totalMembers: workspace.members.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ワークスペースS3保存エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '不明なエラー',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    // グローバル共有のPrismaクライアントを使用しているため、ここでの切断は不要
  }
}
