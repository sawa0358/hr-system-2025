const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const dummyEmployees = [
  {
    employeeId: 'EMP001',
    employeeNumber: '101',
    employeeType: 'employee',
    name: '田中太郎',
    email: 'tanaka@company.com',
    phone: '090-1234-5678',
    phoneInternal: '1234',
    phoneMobile: '090-1234-5678',
    department: '営業部',
    position: '営業部長',
    organization: '株式会社テックイノベーション',
    team: 'エンタープライズ営業',
    joinDate: new Date('2020-04-01'),
    status: 'active',
    password: 'password123',
    role: 'manager',
    myNumber: '123456789012',
    userId: 'tanaka',
    url: 'tanaka.company.com',
    address: '東京都渋谷区1-1-1',
    selfIntroduction: '営業部を統括し、新規開拓を担当しています。',
    birthDate: new Date('1985-03-15'),
    showInOrgChart: true,
    familyMembers: [
      {
        name: '田中花子',
        relationship: '妻',
        phone: '090-1234-5679',
        birthday: '1987-06-20',
        livingSeparately: false,
        address: '東京都渋谷区1-1-1',
        myNumber: '123456789013'
      },
      {
        name: '田中次郎',
        relationship: '息子',
        phone: '',
        birthday: '2010-09-10',
        livingSeparately: false,
        address: '東京都渋谷区1-1-1'
      }
    ]
  },
  {
    employeeId: 'EMP002',
    employeeNumber: '102',
    employeeType: 'employee',
    name: '佐藤花子',
    email: 'sato@company.com',
    phone: '090-2345-6789',
    phoneInternal: '2345',
    phoneMobile: '090-2345-6789',
    department: '開発部',
    position: 'シニアエンジニア',
    organization: '株式会社テックイノベーション',
    team: 'フロントエンド',
    joinDate: new Date('2019-07-01'),
    status: 'active',
    password: 'password123',
    role: 'general',
    myNumber: '234567890123',
    userId: 'sato',
    url: 'sato.company.com',
    address: '東京都新宿区2-2-2',
    selfIntroduction: 'ReactとTypeScriptを専門としています。',
    birthDate: new Date('1990-12-05'),
    showInOrgChart: true,
    familyMembers: [
      {
        name: '佐藤一郎',
        relationship: '夫',
        phone: '090-2345-6790',
        birthday: '1988-08-15',
        livingSeparately: false,
        address: '東京都新宿区2-2-2',
        myNumber: '234567890124'
      }
    ]
  },
  {
    employeeId: 'EMP003',
    employeeNumber: '103',
    employeeType: 'employee',
    name: '鈴木健太',
    email: 'suzuki@company.com',
    phone: '090-3456-7890',
    phoneInternal: '3456',
    phoneMobile: '090-3456-7890',
    department: '開発部',
    position: 'エンジニア',
    organization: '株式会社テックイノベーション',
    team: 'バックエンド',
    joinDate: new Date('2021-01-15'),
    status: 'active',
    password: 'password123',
    role: 'general',
    myNumber: '345678901234',
    userId: 'suzuki',
    url: 'suzuki.company.com',
    address: '東京都品川区3-3-3',
    selfIntroduction: 'Node.jsとPythonが得意です。',
    birthDate: new Date('1995-05-20'),
    showInOrgChart: true,
    familyMembers: []
  },
  {
    employeeId: 'EMP004',
    employeeNumber: '104',
    employeeType: 'employee',
    name: '高橋美咲',
    email: 'takahashi@company.com',
    phone: '090-4567-8901',
    phoneInternal: '4567',
    phoneMobile: '090-4567-8901',
    department: '人事部',
    position: '人事部長',
    organization: '株式会社テックイノベーション',
    team: '人事',
    joinDate: new Date('2018-03-01'),
    status: 'active',
    password: 'password123',
    role: 'hr',
    myNumber: '456789012345',
    userId: 'takahashi',
    url: 'takahashi.company.com',
    address: '東京都世田谷区4-4-4',
    selfIntroduction: '人事戦略と組織開発を担当しています。',
    birthDate: new Date('1983-11-12'),
    showInOrgChart: true,
    familyMembers: [
      {
        name: '高橋正義',
        relationship: '夫',
        phone: '090-4567-8902',
        birthday: '1980-04-25',
        livingSeparately: false,
        address: '東京都世田谷区4-4-4',
        myNumber: '456789012346'
      },
      {
        name: '高橋みどり',
        relationship: '娘',
        phone: '',
        birthday: '2015-07-08',
        livingSeparately: false,
        address: '東京都世田谷区4-4-4'
      }
    ]
  },
  {
    employeeId: 'EMP005',
    employeeNumber: '105',
    employeeType: 'employee',
    name: '山田次郎',
    email: 'yamada@company.com',
    phone: '090-5678-9012',
    phoneInternal: '5678',
    phoneMobile: '090-5678-9012',
    department: '営業部',
    position: '営業マネージャー',
    organization: '株式会社テックイノベーション',
    team: 'SMB営業',
    joinDate: new Date('2020-06-01'),
    status: 'active',
    password: 'password123',
    role: 'manager',
    myNumber: '567890123456',
    userId: 'yamada',
    url: 'yamada.company.com',
    address: '東京都目黒区5-5-5',
    selfIntroduction: '中小企業向け営業を担当しています。',
    birthDate: new Date('1987-09-30'),
    showInOrgChart: false,
    familyMembers: [
      {
        name: '山田恵子',
        relationship: '妻',
        phone: '090-5678-9013',
        birthday: '1989-01-18',
        livingSeparately: false,
        address: '東京都目黒区5-5-5',
        myNumber: '567890123457'
      }
    ]
  },
  {
    employeeId: 'EMP006',
    employeeNumber: '106',
    employeeType: 'employee',
    name: '伊藤麻衣',
    email: 'ito@company.com',
    phone: '090-6789-0123',
    phoneInternal: '6789',
    phoneMobile: '090-6789-0123',
    department: '開発部',
    position: 'デザイナー',
    organization: '株式会社テックイノベーション',
    team: 'UI/UX',
    joinDate: new Date('2021-04-01'),
    status: 'active',
    password: 'password123',
    role: 'general',
    myNumber: '678901234567',
    userId: 'ito',
    url: 'ito.company.com',
    address: '東京都中野区6-6-6',
    selfIntroduction: 'ユーザーエクスペリエンスデザインを専門としています。',
    birthDate: new Date('1992-02-14'),
    showInOrgChart: false,
    familyMembers: []
  },
  {
    employeeId: 'EMP007',
    employeeNumber: '107',
    employeeType: 'employee',
    name: '渡辺直樹',
    email: 'watanabe@company.com',
    phone: '090-7890-1234',
    phoneInternal: '7890',
    phoneMobile: '090-7890-1234',
    department: '総務部',
    position: '総務部長',
    organization: '株式会社テックイノベーション',
    team: '総務',
    joinDate: new Date('2017-08-01'),
    status: 'active',
    password: 'password123',
    role: 'hr',
    myNumber: '789012345678',
    userId: 'watanabe',
    url: 'watanabe.company.com',
    address: '東京都杉並区7-7-7',
    selfIntroduction: '会社の運営管理を担当しています。',
    birthDate: new Date('1981-06-03'),
    showInOrgChart: true,
    familyMembers: [
      {
        name: '渡辺真理',
        relationship: '妻',
        phone: '090-7890-1235',
        birthday: '1984-10-22',
        livingSeparately: false,
        address: '東京都杉並区7-7-7',
        myNumber: '789012345679'
      },
      {
        name: '渡辺拓也',
        relationship: '息子',
        phone: '',
        birthday: '2008-12-01',
        livingSeparately: false,
        address: '東京都杉並区7-7-7'
      },
      {
        name: '渡辺由香',
        relationship: '娘',
        phone: '',
        birthday: '2012-03-15',
        livingSeparately: false,
        address: '東京都杉並区7-7-7'
      }
    ]
  },
  {
    employeeId: 'EMP008',
    employeeNumber: '108',
    employeeType: 'employee',
    name: '小林智也',
    email: 'kobayashi@company.com',
    phone: '090-8901-2345',
    phoneInternal: '8901',
    phoneMobile: '090-8901-2345',
    department: '営業部',
    position: '営業',
    organization: '株式会社テックイノベーション',
    team: 'エンタープライズ営業',
    joinDate: new Date('2022-03-01'),
    status: 'active',
    password: 'password123',
    role: 'general',
    myNumber: '890123456789',
    userId: 'kobayashi',
    url: 'kobayashi.company.com',
    address: '東京都練馬区8-8-8',
    selfIntroduction: '大企業向け営業を担当しています。',
    birthDate: new Date('1994-08-17'),
    showInOrgChart: true,
    familyMembers: []
  },
  {
    employeeId: 'EMP009',
    employeeNumber: '109',
    employeeType: 'employee',
    name: '加藤由美',
    email: 'kato@company.com',
    phone: '090-9012-3456',
    phoneInternal: '9012',
    phoneMobile: '090-9012-3456',
    department: '経理部',
    position: '経理部長',
    organization: '株式会社テックイノベーション',
    team: '経理',
    joinDate: new Date('2019-01-07'),
    status: 'active',
    password: 'password123',
    role: 'manager',
    myNumber: '901234567890',
    userId: 'kato',
    url: 'kato.company.com',
    address: '東京都板橋区9-9-9',
    selfIntroduction: '財務管理と経理業務を統括しています。',
    birthDate: new Date('1986-12-28'),
    showInOrgChart: true,
    familyMembers: [
      {
        name: '加藤雄一',
        relationship: '夫',
        phone: '090-9012-3457',
        birthday: '1983-05-10',
        livingSeparately: false,
        address: '東京都板橋区9-9-9',
        myNumber: '901234567891'
      }
    ]
  },
  {
    employeeId: 'EMP010',
    employeeNumber: '110',
    employeeType: 'employee',
    name: '森田大輔',
    email: 'morita@company.com',
    phone: '090-0123-4567',
    phoneInternal: '0123',
    phoneMobile: '090-0123-4567',
    department: '開発部',
    position: 'テックリード',
    organization: '株式会社テックイノベーション',
    team: 'インフラ',
    joinDate: new Date('2018-09-01'),
    status: 'active',
    password: 'password123',
    role: 'manager',
    myNumber: '012345678901',
    userId: 'morita',
    url: 'morita.company.com',
    address: '東京都江東区10-10-10',
    selfIntroduction: 'インフラストラクチャとDevOpsを担当しています。',
    birthDate: new Date('1989-07-04'),
    showInOrgChart: false,
    familyMembers: [
      {
        name: '森田さくら',
        relationship: '妻',
        phone: '090-0123-4568',
        birthday: '1991-11-11',
        livingSeparately: false,
        address: '東京都江東区10-10-10',
        myNumber: '012345678902'
      },
      {
        name: '森田翔太',
        relationship: '息子',
        phone: '',
        birthday: '2018-04-20',
        livingSeparately: false,
        address: '東京都江東区10-10-10'
      }
    ]
  }
];

async function createDummyEmployees() {
  try {
    console.log('ダミー社員データの作成を開始します...');
    
    for (const employeeData of dummyEmployees) {
      const { familyMembers, ...employeeInfo } = employeeData;
      
      // 社員を作成
      const employee = await prisma.employee.create({
        data: employeeInfo
      });
      
      console.log(`社員を作成しました: ${employee.name} (ID: ${employee.id})`);
      
      // 家族構成を作成
      if (familyMembers && familyMembers.length > 0) {
        for (const familyData of familyMembers) {
          await prisma.familyMember.create({
            data: {
              ...familyData,
              employeeId: employee.id
            }
          });
        }
        console.log(`  - 家族構成 ${familyMembers.length}名を追加しました`);
      }
    }
    
    console.log('✅ ダミー社員データの作成が完了しました！');
    console.log(`合計 ${dummyEmployees.length} 名の社員を作成しました`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDummyEmployees();
