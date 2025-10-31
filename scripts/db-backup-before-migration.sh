#!/bin/bash
# マイグレーション前のDBバックアップスクリプト

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_PATH="$PROJECT_ROOT/prisma/dev.db"
BACKUP_DIR="$PROJECT_ROOT/prisma"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dev-backup-$TIMESTAMP.db"

# 色付きメッセージ
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 データベースバックアップ開始...${NC}"

# DBファイルが存在するか確認
if [ ! -f "$DB_PATH" ]; then
    echo -e "${YELLOW}⚠️  DBファイルが見つかりません: $DB_PATH${NC}"
    echo -e "${YELLOW}   新しいDBが作成されます${NC}"
    exit 0
fi

# バックアップ実行
echo "DBファイル: $DB_PATH"
echo "バックアップ先: $BACKUP_FILE"

cp "$DB_PATH" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ バックアップ完了: $BACKUP_FILE${NC}"
    
    # バックアップファイルサイズを表示
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}   サイズ: $BACKUP_SIZE${NC}"
else
    echo -e "${RED}❌ バックアップに失敗しました${NC}"
    exit 1
fi

# 最新のバックアップを確認
echo -e "\n${YELLOW}📋 最新のバックアップ:${NC}"
ls -lth "$BACKUP_DIR"/dev-backup-*.db 2>/dev/null | head -5 || echo "バックアップが見つかりません"
