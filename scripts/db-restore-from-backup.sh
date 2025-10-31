#!/bin/bash
# バックアップからのDB復元スクリプト

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_PATH="$PROJECT_ROOT/prisma/dev.db"
BACKUP_DIR="$PROJECT_ROOT/prisma"

# 色付きメッセージ
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 データベース復元スクリプト${NC}\n"

# バックアップファイルのリスト表示
echo -e "${BLUE}📋 利用可能なバックアップ:${NC}"
BACKUP_FILES=($(ls -t "$BACKUP_DIR"/dev-backup-*.db 2>/dev/null))

if [ ${#BACKUP_FILES[@]} -eq 0 ]; then
    echo -e "${RED}❌ バックアップファイルが見つかりません${NC}"
    exit 1
fi

# バックアップリストを表示
for i in "${!BACKUP_FILES[@]}"; do
    BACKUP_FILE="${BACKUP_FILES[$i]}"
    BACKUP_NAME=$(basename "$BACKUP_FILE")
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    BACKUP_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$BACKUP_FILE" 2>/dev/null || stat -c "%y" "$BACKUP_FILE" 2>/dev/null | cut -d' ' -f1-2)
    echo -e "  ${GREEN}[$((i+1))]${NC} $BACKUP_NAME (サイズ: $BACKUP_SIZE, 日時: $BACKUP_DATE)"
done

# 最新のバックアップをデフォルトに
LATEST_BACKUP="${BACKUP_FILES[0]}"
LATEST_NAME=$(basename "$LATEST_BACKUP")

echo ""
echo -e "${YELLOW}最新のバックアップ: $LATEST_NAME${NC}"
echo ""

# ユーザーに確認
read -p "復元しますか？ [y/N]: " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}キャンセルしました${NC}"
    exit 0
fi

# 現在のDBをバックアップ（念のため）
if [ -f "$DB_PATH" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    PRE_RESTORE_BACKUP="$BACKUP_DIR/dev-pre-restore-$TIMESTAMP.db"
    echo -e "${YELLOW}現在のDBをバックアップ中...${NC}"
    cp "$DB_PATH" "$PRE_RESTORE_BACKUP"
    echo -e "${GREEN}✅ バックアップ完了: $PRE_RESTORE_BACKUP${NC}"
fi

# 復元実行
echo -e "${YELLOW}復元中: $LATEST_BACKUP -> $DB_PATH${NC}"
cp "$LATEST_BACKUP" "$DB_PATH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 復元完了${NC}"
    
    # Prismaクライアントを再生成
    echo -e "${YELLOW}Prismaクライアントを再生成中...${NC}"
    cd "$PROJECT_ROOT"
    npx prisma generate
    
    echo -e "${GREEN}✅ 復元処理完了${NC}"
else
    echo -e "${RED}❌ 復元に失敗しました${NC}"
    exit 1
fi
