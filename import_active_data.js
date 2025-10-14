const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

async function importActiveData() {
  try {
    console.log('アクティブデータのインポートを開始します...');
    
    // 1. ワークスペースのインポート
    console.log('ワークスペースをインポート中...');
    const workspaces = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('active_workspaces_export.csv')
        .pipe(csv())
        .on('data', (row) => {
          workspaces.push({
            id: row.id,
            name: row.name,
            description: row.description || null,
            createdBy: row.createdBy,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // ワークスペースをクリアしてインポート
    await prisma.workspace.deleteMany();
    for (const workspace of workspaces) {
      await prisma.workspace.create({ data: workspace });
    }
    console.log(`✅ ワークスペース: ${workspaces.length}件をインポート`);
    
    // 2. ボードのインポート
    console.log('ボードをインポート中...');
    const boards = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('active_boards_export.csv')
        .pipe(csv())
        .on('data', (row) => {
          boards.push({
            id: row.id,
            name: row.name,
            description: row.description || null,
            workspaceId: row.workspaceId,
            position: parseInt(row.position) || 0,
            createdBy: row.createdBy,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    await prisma.board.deleteMany();
    for (const board of boards) {
      await prisma.board.create({ data: board });
    }
    console.log(`✅ ボード: ${boards.length}件をインポート`);
    
    // 3. ボードリストのインポート
    console.log('ボードリストをインポート中...');
    const boardLists = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('active_board_lists_export.csv')
        .pipe(csv())
        .on('data', (row) => {
          boardLists.push({
            id: row.id,
            boardId: row.boardId,
            title: row.title,
            color: row.color || '#f1f5f9',
            position: parseInt(row.position) || 0,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    await prisma.boardList.deleteMany();
    for (const boardList of boardLists) {
      await prisma.boardList.create({ data: boardList });
    }
    console.log(`✅ ボードリスト: ${boardLists.length}件をインポート`);
    
    // 4. カードのインポート
    console.log('カードをインポート中...');
    const cards = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('active_cards_export.csv')
        .pipe(csv())
        .on('data', (row) => {
          cards.push({
            id: row.id,
            boardId: row.boardId,
            listId: row.listId,
            title: row.title,
            description: row.description || null,
            position: parseInt(row.position) || 0,
            dueDate: row.dueDate ? new Date(row.dueDate) : null,
            priority: row.priority || 'medium',
            status: row.status || 'todo',
            cardColor: row.cardColor || null,
            labels: row.labels ? JSON.parse(row.labels) : null,
            checklists: row.checklists ? JSON.parse(row.checklists) : null,
            attachments: row.attachments ? JSON.parse(row.attachments) : null,
            isArchived: row.isArchived === 'true',
            createdBy: row.createdBy,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    await prisma.card.deleteMany();
    for (const card of cards) {
      await prisma.card.create({ data: card });
    }
    console.log(`✅ カード: ${cards.length}件をインポート`);
    
    // 5. アクティブ社員データで既存データを更新
    console.log('アクティブ社員データで更新中...');
    const activeEmployees = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('active_employees_export.csv')
        .pipe(csv())
        .on('data', (row) => {
          activeEmployees.push({
            id: row.id,
            name: row.name,
            status: row.status,
            showInOrgChart: row.showInOrgChart === 't',
            parentEmployeeId: row.parentEmployeeId || null
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // 既存の社員データのshowInOrgChartをfalseに設定
    await prisma.employee.updateMany({
      data: { showInOrgChart: false }
    });
    
    // アクティブ社員のshowInOrgChartをtrueに設定
    for (const emp of activeEmployees) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { 
          showInOrgChart: true,
          status: emp.status,
          parentEmployeeId: emp.parentEmployeeId
        }
      });
    }
    console.log(`✅ アクティブ社員: ${activeEmployees.length}件を更新`);
    
    console.log('\n🎉 アクティブデータのインポートが完了しました！');
    
    // 結果確認
    const employeeCount = await prisma.employee.count({ where: { showInOrgChart: true } });
    const workspaceCount = await prisma.workspace.count();
    const boardCount = await prisma.board.count();
    const boardListCount = await prisma.boardList.count();
    const cardCount = await prisma.card.count();
    
    console.log('\n📊 インポート結果:');
    console.log(`- 組織図表示社員: ${employeeCount}件`);
    console.log(`- ワークスペース: ${workspaceCount}件`);
    console.log(`- ボード: ${boardCount}件`);
    console.log(`- ボードリスト: ${boardListCount}件`);
    console.log(`- カード: ${cardCount}件`);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importActiveData();
