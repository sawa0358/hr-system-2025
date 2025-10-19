-- 最終テスト用の通知データを作成

-- 既存の通知をクリア
DELETE FROM notifications WHERE userId = 'cmguzma95000f8ztxwag6rgyh';

-- 新しいテスト通知を作成
INSERT INTO notifications (id, userId, type, status, title, message, relatedId, relatedType, createdAt)
VALUES (
    'notification-' || lower(hex(randomblob(16))),
    'cmguzma95000f8ztxwag6rgyh',
    'CARD_EDITED',
    'UNREAD',
    'カードが編集されました',
    'タスクカード「テスト」が編集されました。',
    'test-card-id-1',
    'card',
    datetime('now', '-2 minutes')
);

INSERT INTO notifications (id, userId, type, status, title, message, relatedId, relatedType, createdAt)
VALUES (
    'notification-' || lower(hex(randomblob(16))),
    'cmguzma95000f8ztxwag6rgyh',
    'WORKSPACE_MEMBER_ADDED',
    'UNREAD',
    'ワークスペースにメンバーが追加されました',
    'ワークスペース「会社全体ワークスペース」に新しいメンバーが追加されました。',
    'cmguhd2vt00048z21sw0wte6c',
    'workspace',
    datetime('now', '-5 minutes')
);

INSERT INTO notifications (id, userId, type, status, title, message, relatedId, relatedType, createdAt)
VALUES (
    'notification-' || lower(hex(randomblob(16))),
    'cmguzma95000f8ztxwag6rgyh',
    'BOARD_UPDATED',
    'UNREAD',
    'ボードが更新されました',
    'ボード「テスト」が更新されました。',
    'cmgui5ihb00078zjie8f6hpz5',
    'board',
    datetime('now', '-10 minutes')
);

INSERT INTO notifications (id, userId, type, status, title, message, relatedId, relatedType, createdAt)
VALUES (
    'notification-' || lower(hex(randomblob(16))),
    'cmguzma95000f8ztxwag6rgyh',
    'TASK_UPDATED',
    'UNREAD',
    'タスクが更新されました',
    'タスク「テスト22」が更新されました。',
    'test-task-id-2',
    'card',
    datetime('now', '-15 minutes')
);

-- 通知数を確認
SELECT COUNT(*) as notification_count FROM notifications WHERE userId = 'cmguzma95000f8ztxwag6rgyh';
