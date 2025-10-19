-- 現在ログインしているユーザーの通知を作成
INSERT INTO notifications (
  id,
  userId,
  type,
  status,
  title,
  message,
  metadata,
  relatedId,
  relatedType,
  createdAt
) VALUES (
  'notif-' || substr(hex(randomblob(16)), 1, 24),
  'cmguzma95000f8ztxwag6rgyh',
  'WORKSPACE_UPDATED',
  'UNREAD',
  'ワークスペースが更新されました',
  'テストワークスペースがadminさんによって更新されました（名前変更）',
  '{"workspaceId":"test-workspace-id","workspaceName":"テストワークスペース","updatedByUserId":"cmguzma95000f8ztxwag6rgyh","updatedByUserName":"admin","changes":["名前変更"]}',
  'test-workspace-id',
  'workspace',
  datetime('now')
);

INSERT INTO notifications (
  id,
  userId,
  type,
  status,
  title,
  message,
  metadata,
  relatedId,
  relatedType,
  createdAt
) VALUES (
  'notif-' || substr(hex(randomblob(16)), 1, 24),
  'cmguzma95000f8ztxwag6rgyh',
  'CARD_MOVED',
  'UNREAD',
  'カードが移動されました',
  '「テストカード」が「予定リスト」から「進行中」に移動されました',
  '{"cardId":"test-card-id","cardTitle":"テストカード","fromListName":"予定リスト","toListName":"進行中","boardId":"test-board-id","boardName":"テストボード","movedByUserId":"cmguzma95000f8ztxwag6rgyh","movedByUserName":"admin"}',
  'test-card-id',
  'card',
  datetime('now')
);

INSERT INTO notifications (
  id,
  userId,
  type,
  status,
  title,
  message,
  metadata,
  relatedId,
  relatedType,
  createdAt
) VALUES (
  'notif-' || substr(hex(randomblob(16)), 1, 24),
  'cmguzma95000f8ztxwag6rgyh',
  'TASK_UPDATED',
  'UNREAD',
  'タスクが更新されました',
  '「テストタスク」がadminさんによって更新されました（期限変更）',
  '{"taskId":"test-task-id","taskTitle":"テストタスク","updatedByUserId":"cmguzma95000f8ztxwag6rgyh","updatedByUserName":"admin","changes":["期限変更"]}',
  'test-task-id',
  'task',
  datetime('now')
);
