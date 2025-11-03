const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDummyEmployees() {
  try {
    console.log('ダミー社員データの追加を開始します...');

    // ダミー社員データ
    const dummyEmployees = [
      {
        employeeId: "EMP-2024-001",
        employeeNumber: "EMP-2024-001",
        employeeType: "正社員",
        name: "山田 太郎",
        furigana: "ヤマダ タロウ",
        email: "yamada@company.com",
        phone: "090-1234-5678",
        department: "広店",
        position: "店長",
        organization: "株式会社テックイノベーション",
        team: "店舗運営",
        joinDate: new Date("2024-01-01"),
        status: "active",
        password: "password123",
        role: "store_manager",
      },
      {
        employeeId: "EMP-2024-002",
        employeeNumber: "EMP-2024-002",
        employeeType: "正社員",
        name: "佐藤 花子",
        furigana: "サトウ ハナコ",
        email: "sato@company.com",
        phone: "090-2345-6789",
        department: "焼山店",
        position: "店長",
        organization: "株式会社テックイノベーション",
        team: "店舗運営",
        joinDate: new Date("2024-02-01"),
        status: "active",
        password: "password123",
        role: "store_manager",
      },
      {
        employeeId: "EMP-2024-003",
        employeeNumber: "EMP-2024-003",
        employeeType: "正社員",
        name: "田中 健一",
        furigana: "タナカ ケンイチ",
        email: "tanaka@company.com",
        phone: "090-3456-7890",
        department: "工務部",
        position: "工務長",
        organization: "株式会社テックイノベーション",
        team: "工務",
        joinDate: new Date("2024-03-01"),
        status: "active",
        password: "password123",
        role: "manager",
      },
      {
        employeeId: "EMP-2024-004",
        employeeNumber: "EMP-2024-004",
        employeeType: "正社員",
        name: "鈴木 美咲",
        furigana: "スズキ ミサキ",
        email: "suzuki@company.com",
        phone: "090-4567-8901",
        department: "福祉部",
        position: "福祉長",
        organization: "株式会社テックイノベーション",
        team: "福祉サービス",
        joinDate: new Date("2024-04-01"),
        status: "active",
        password: "password123",
        role: "manager",
      },
      {
        employeeId: "EMP-2024-005",
        employeeNumber: "EMP-2024-005",
        employeeType: "正社員",
        name: "高橋 一郎",
        furigana: "タカハシ イチロウ",
        email: "takahashi@company.com",
        phone: "090-5678-9012",
        department: "不動産部",
        position: "プランナー",
        organization: "株式会社テックイノベーション",
        team: "不動産企画",
        joinDate: new Date("2024-05-01"),
        status: "active",
        password: "password123",
        role: "general",
      },
      {
        employeeId: "EMP-2024-006",
        employeeNumber: "EMP-2024-006",
        employeeType: "契約社員",
        name: "伊藤 さくら",
        furigana: "イトウ サクラ",
        email: "ito@company.com",
        phone: "090-6789-0123",
        department: "チカラもち",
        position: "チームリーダー",
        organization: "株式会社テックイノベーション",
        team: "サービス",
        joinDate: new Date("2024-06-01"),
        status: "active",
        password: "password123",
        role: "general",
      },
      {
        employeeId: "EMP-2024-007",
        employeeNumber: "EMP-2024-007",
        employeeType: "パートタイム",
        name: "中村 みどり",
        furigana: "ナカムラ ミドリ",
        email: "nakamura@company.com",
        phone: "090-7890-1234",
        department: "広店",
        position: "内勤",
        organization: "株式会社テックイノベーション",
        team: "店舗運営",
        joinDate: new Date("2024-07-01"),
        status: "active",
        password: "password123",
        role: "general",
      },
      {
        employeeId: "EMP-2024-008",
        employeeNumber: "EMP-2024-008",
        employeeType: "正社員",
        name: "小林 大輔",
        furigana: "コバヤシ ダイスケ",
        email: "kobayashi@company.com",
        phone: "090-8901-2345",
        department: "執行部",
        position: "総務",
        organization: "株式会社テックイノベーション",
        team: "総務",
        joinDate: new Date("2024-08-01"),
        status: "active",
        password: "password123",
        role: "hr",
      },
      {
        employeeId: "EMP-2024-009",
        employeeNumber: "EMP-2024-009",
        employeeType: "正社員",
        name: "加藤 ゆき",
        furigana: "カトウ ユキ",
        email: "kato@company.com",
        phone: "090-9012-3456",
        department: "執行部",
        position: "経理",
        organization: "株式会社テックイノベーション",
        team: "経理",
        joinDate: new Date("2024-09-01"),
        status: "active",
        password: "password123",
        role: "general",
      },
      {
        employeeId: "EMP-2024-010",
        employeeNumber: "EMP-2024-010",
        employeeType: "派遣社員",
        name: "吉田 あきら",
        furigana: "ヨシダ アキラ",
        email: "yoshida@company.com",
        phone: "090-0123-4567",
        department: "工務部",
        position: "工務",
        organization: "株式会社テックイノベーション",
        team: "工務",
        joinDate: new Date("2024-10-01"),
        status: "active",
        password: "password123",
        role: "general",
      }
    ];

    // 既存の社員データを修正（配列形式の部署・役職を修正）
    console.log('既存の社員データを修正中...');
    const existingEmployees = await prisma.employee.findMany();
    
    for (const employee of existingEmployees) {
      // 部署データの修正
      if (employee.department && employee.department.startsWith('[')) {
        try {
          const parsed = JSON.parse(employee.department);
          if (Array.isArray(parsed) && parsed.length > 0) {
            await prisma.employee.update({
              where: { id: employee.id },
              data: { department: parsed[0] }
            });
            console.log(`社員 ${employee.name} の部署を修正: ${employee.department} → ${parsed[0]}`);
          }
        } catch (error) {
          console.warn(`社員 ${employee.name} の部署データ修正に失敗:`, error);
        }
      }
      
      // 役職データの修正
      if (employee.position && employee.position.startsWith('[')) {
        try {
          const parsed = JSON.parse(employee.position);
          if (Array.isArray(parsed) && parsed.length > 0) {
            await prisma.employee.update({
              where: { id: employee.id },
              data: { position: parsed[0] }
            });
            console.log(`社員 ${employee.name} の役職を修正: ${employee.position} → ${parsed[0]}`);
          }
        } catch (error) {
          console.warn(`社員 ${employee.name} の役職データ修正に失敗:`, error);
        }
      }
    }

    // ダミー社員データを追加
    console.log('ダミー社員データを追加中...');
    for (const employeeData of dummyEmployees) {
      const employee = await prisma.employee.create({
        data: employeeData
      });
      console.log(`社員を作成しました: ${employee.name} (${employee.role})`);
    }

    console.log('✅ ダミー社員データの追加が完了しました！');
    
    // 最終的な社員数を確認
    const totalEmployees = await prisma.employee.count();
    console.log(`📊 総社員数: ${totalEmployees}件`);

  } catch (error) {
    console.error('❌ ダミー社員データの追加に失敗しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 実行
addDummyEmployees();
