-- テスト用の通知を作成
DELETE FROM notifications WHERE userId = 'cmguh7nes00008zg3d5lknu3q';

INSERT INTO notifications (id, userId, type, status, title, message, relatedId, relatedType, createdAt)
VALUES (
    'test-notification-card-1',
    'cmguh7nes00008zg3d5lknu3q',
    'CARD_EDITED',
    'UNREAD',
    'カードが編集されました',
    'タスクカード「テスト」が編集されました。',
    'test-card-id-1',
    'card',
    datetime('now', '-1 minutes')
);

INSERT INTO notifications (id, userId, type, status, title, message, relatedId, relatedType, createdAt)
VALUES (
    'test-notification-workspace-1',
    'cmguh7nes00008zg3d5lknu3q',
    'WORKSPACE_MEMBER_ADDED',
    'UNREAD',
    'ワークスペースにメンバーが追加されました',
    'ワークスペース「会社全体ワークスペース」に新しいメンバーが追加されました。',
    'cmguhd2vt00048z21sw0wte6c',
    'workspace',
    datetime('now', '-2 minutes')
);

INSERT INTO notifications (id, userId, type, status, title, message, relatedId, relatedType, createdAt)
VALUES (
    'test-notification-board-1',
    'cmguh7nes00008zg3d5lknu3q',
    'BOARD_UPDATED',
    'UNREAD',
    'ボードが更新されました',
    'ボード「テスト」が更新されました。',
    'cmgui5ihb00078zjie8f6hpz5',
    'board',
    datetime('now', '-3 minutes')
);
