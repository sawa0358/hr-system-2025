-- 既存の通知をクリア
DELETE FROM notifications WHERE userId = 'cmguh7nes00008zg3d5lknu3q';

-- テスト通知を作成
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
  'test-notification-1',
  'cmguh7nes00008zg3d5lknu3q',
  'WORKSPACE_UPDATED',
  'UNREAD',
  'ワークスペースが更新されました',
  'テストワークスペースがadminさんによって更新されました（名前変更）',
  '{"workspaceId":"test-workspace-id","workspaceName":"テストワークスペース","updatedByUserId":"cmguh7nes00008zg3d5lknu3q","updatedByUserName":"admin","changes":["名前変更"]}',
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
  'test-notification-2',
  'cmguh7nes00008zg3d5lknu3q',
  'CARD_MOVED',
  'UNREAD',
  'カードが移動されました',
  '「テストカード」が「予定リスト」から「進行中」に移動されました',
  '{"cardId":"test-card-id","cardTitle":"テストカード","fromListName":"予定リスト","toListName":"進行中","boardId":"test-board-id","boardName":"テストボード","movedByUserId":"cmguh7nes00008zg3d5lknu3q","movedByUserName":"admin"}',
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
  'test-notification-3',
  'cmguh7nes00008zg3d5lknu3q',
  'TASK_UPDATED',
  'UNREAD',
  'タスクが更新されました',
  '「テストタスク」がadminさんによって更新されました（期限変更）',
  '{"taskId":"test-task-id","taskTitle":"テストタスク","updatedByUserId":"cmguh7nes00008zg3d5lknu3q","updatedByUserName":"admin","changes":["期限変更"]}',
  'test-task-id',
  'task',
  datetime('now')
);
