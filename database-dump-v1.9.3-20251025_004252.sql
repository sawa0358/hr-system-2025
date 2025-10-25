PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
);
INSERT INTO _prisma_migrations VALUES('efc8a97b-48d7-4531-969a-cecf105f868e','f2d449136dc500ca211ebd241fc07413b89778ffe0683a6d06001c0e3920d277',1760085536081,'20251003081606_init',NULL,NULL,1760085536079,1);
INSERT INTO _prisma_migrations VALUES('475d7170-165c-4434-9112-51fe11bc06df','be96ed182ac44d33de2c9092e86a58e74ee0f977536f01a68966b3f9661d3521',1760085536083,'20251003110648_add_user_fields',NULL,NULL,1760085536082,1);
INSERT INTO _prisma_migrations VALUES('430b1a36-53d3-47d0-b978-57e7e6863eb8','2a5954f8bd7d6a7728b726e4b9335822339a9c909d5339cd8363fe46c04224fc',1760085536083,'20251003111857_add_family_members',NULL,NULL,1760085536083,1);
INSERT INTO _prisma_migrations VALUES('61908de4-a5c9-43e4-8f77-db37c62ff3ae','ff486de589b826893da3f8570df716342f191e1396268dbba679553c107d96e4',1760085536085,'20251006051247_add_show_in_org_chart',NULL,NULL,1760085536084,1);
INSERT INTO _prisma_migrations VALUES('435042fc-ad4d-40ce-9324-c84002a5675a','0c621eb23b93ccd26f4e0933426184222d0f6cc44332709cfb4eaa145e6db8f9',1760085536085,'20251006055214_add_parent_employee_id',NULL,NULL,1760085536085,1);
INSERT INTO _prisma_migrations VALUES('97a8d780-c7f7-4055-ae79-88759c4610f7','4b5f9a9ad024f14ad0bfdbe87765267e0ce483cfe4d4b8b85a7d2627009bbebf',1760085536087,'20251006115934_add_invisible_top_flag',NULL,NULL,1760085536086,1);
INSERT INTO _prisma_migrations VALUES('9a36848a-cac8-410f-a017-60426fdbabd4','5d2a3a45dc128553e5d91c1b9e9cf5ccc5cb8b8423de251528506f2518d2a6d5',1760085536088,'20251007083430_add_suspend_and_retirement_fields',NULL,NULL,1760085536087,1);
INSERT INTO _prisma_migrations VALUES('82902bdb-0c01-4b6e-825c-ca25169b26da','0d985a45a1cfc48250ab5ffb31a91c66368b0710e4907693bb0581e98b08dc85',1760085536090,'20251007202212_add_privacy_settings',NULL,NULL,1760085536088,1);
INSERT INTO _prisma_migrations VALUES('7568e3ff-06b4-4998-b07c-15cb1d06cc6e','a19cce9131cf19f7dd7e5787dd685fed25882bfae51d952edbb4ae4fc9ace0b7',1760085536090,'20251007202827_add_furigana_field',NULL,NULL,1760085536090,1);
INSERT INTO _prisma_migrations VALUES('9cd7bf0b-152e-40d5-918b-f17dd322fbb6','584f9df461223170953424444f3e258799278aeb93367c63ae5e821daf34f935',1760085536100,'20251010083856_init',NULL,NULL,1760085536099,1);
INSERT INTO _prisma_migrations VALUES('f7be6d94-72e8-4afd-a1f9-3a6ab42c1427','6d0862f72a6af7046af7cae1519c604ac7ac5a6b4c2a53527142a0db99e08a7b',1760142002843,'20251011002002_add_copy_employee_status',NULL,NULL,1760142002842,1);
INSERT INTO _prisma_migrations VALUES('7e547d40-56dd-4083-87a5-4fb2faac381a','da713a042dc903a177e754dffe9ecb181dd4a52f8c5c1a2a00da9561bbec54d9',1760148701946,'20251011021141_add_workspace_board_card_models',NULL,NULL,1760148701943,1);
INSERT INTO _prisma_migrations VALUES('beff5fbf-6775-4080-ab3f-d7796880d333','baa6776691ce60896ad8477f3d972f1a3f4961ff73ef3800d7eed4c8bb25265a',1760156480915,'20251011042120_add_card_status',NULL,NULL,1760156480913,1);
CREATE TABLE IF NOT EXISTS "evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "evaluator" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "overallScore" REAL,
    "deadline" DATETIME NOT NULL,
    "scores" JSONB,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "evaluations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "labels" JSONB,
    "checklists" JSONB,
    "members" JSONB,
    "cardColor" TEXT,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "attachments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "clockIn" DATETIME,
    "clockOut" DATETIME,
    "breakTime" INTEGER,
    "overtime" INTEGER,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "payroll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "allowances" INTEGER NOT NULL,
    "deductions" INTEGER NOT NULL,
    "overtime" INTEGER NOT NULL,
    "netPay" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "overtimeHours" INTEGER,
    "allowanceBreakdown" JSONB,
    "deductionBreakdown" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "folderId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "folderName" TEXT,
    CONSTRAINT "files_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "files_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO files VALUES('cmgllyrz200028zgun5jtah9l','1760146811677_スクリーンショット 2025-08-27 21.32.44.png','スクリーンショット 2025-08-27 21.32.44.png','/Users/ohsawa/Desktop/HR-system/uploads/cmgllvxs000018zguh20qyt8g/general/1760146811677_スクリーンショット 2025-08-27 21.32.44.png',78504,'image/png','cmgllvxs000018zguh20qyt8g','general',NULL,0,1760146811679,1760146811679,'基本情報');
INSERT INTO files VALUES('cmglm7y4600008zr07r3wp5jz','1760147239541_スクリーンショット 2025-08-27 21.32.44.png','スクリーンショット 2025-08-27 21.32.44.png','/Users/ohsawa/Desktop/HR-system/uploads/cmgllvxs000018zguh20qyt8g/employee/1760147239541_スクリーンショット 2025-08-27 21.32.44.png',78504,'image/png','cmgllvxs000018zguh20qyt8g','employee',NULL,0,1760147239542,1760147239542,'契約書類');
INSERT INTO files VALUES('cmglm8zr000028zr0ibj2z2ce','1760147288314_070926_4.pdf','070926_4.pdf','/Users/ohsawa/Desktop/HR-system/uploads/cmglm3pax00038zgu5t3cw5gh/employee/1760147288314_070926_4.pdf',86344,'application/pdf','cmglm3pax00038zgu5t3cw5gh','employee',NULL,0,1760147288316,1760147288316,'契約書類');
INSERT INTO files VALUES('cmglm94jy00048zr0xgobf3oh','1760147294541_070926_4.pdf','070926_4.pdf','/Users/ohsawa/Desktop/HR-system/uploads/cmglm3pax00038zgu5t3cw5gh/general/1760147294541_070926_4.pdf',86344,'application/pdf','cmglm3pax00038zgu5t3cw5gh','general',NULL,0,1760147294542,1760147294542,'2025');
INSERT INTO files VALUES('cmgltpx9k000t8zpmz7c4qelv','1760159835560_スクリーンショット 2025-08-27 21.32.44.png','スクリーンショット 2025-08-27 21.32.44.png','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/task/1760159835560_スクリーンショット 2025-08-27 21.32.44.png',78504,'image/png','cmgkljr1000008z81edjq66sl','task',NULL,0,1760159835561,1760159835561,'新フォルダ');
INSERT INTO files VALUES('cmglu4b7q001n8zpmesrtyjq6','1760160506819_スクリーンショット 2025-08-27 21.32.44.png','スクリーンショット 2025-08-27 21.32.44.png','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/task/1760160506819_スクリーンショット 2025-08-27 21.32.44.png',78504,'image/png','cmgkljr1000008z81edjq66sl','task',NULL,0,1760160506822,1760160506822,'テスト');
INSERT INTO files VALUES('cmglukgz8001w8zpmvrka0l9d','1760161260787_スクリーンショット 2025-08-27 21.32.44.png','スクリーンショット 2025-08-27 21.32.44.png','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/employee/1760161260787_スクリーンショット 2025-08-27 21.32.44.png',78504,'image/png','cmgkljr1000008z81edjq66sl','employee',NULL,0,1760161260788,1760161260788,'契約書類');
INSERT INTO files VALUES('cmglvjuns002s8zpmt973urg0','1760162911480_070926_4.pdf','070926_4.pdf','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/task/1760162911480_070926_4.pdf',86344,'application/pdf','cmgkljr1000008z81edjq66sl','task',NULL,0,1760162911481,1760162911481,'画像');
INSERT INTO files VALUES('cmglvk3h8002w8zpmtn45c8sr','1760162922908_無題のドキュメント.docx','無題のドキュメント.docx','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/task/1760162922908_無題のドキュメント.docx',11925,'application/vnd.openxmlformats-officedocument.wordprocessingml.document','cmgkljr1000008z81edjq66sl','task',NULL,0,1760162922909,1760162922909,'資料');
INSERT INTO files VALUES('cmglwsd61004t8zpmezjz6vcr','1760164988329_スクリーンショット 2025-10-11 15.26.13.png','スクリーンショット 2025-10-11 15.26.13.png','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/task/1760164988329_スクリーンショット 2025-10-11 15.26.13.png',104211,'image/png','cmgkljr1000008z81edjq66sl','task',NULL,0,1760164988330,1760164988330,'資料');
INSERT INTO files VALUES('cmglwtxk800518zpmdfd9922w','1760165061414_無題のドキュメント.docx','無題のドキュメント.docx','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/task/1760165061414_無題のドキュメント.docx',11925,'application/vnd.openxmlformats-officedocument.wordprocessingml.document','cmgkljr1000008z81edjq66sl','task',NULL,0,1760165061416,1760165061416,'資料');
INSERT INTO files VALUES('cmglx15nt005p8zpm5cqxm3yt','1760165398505_070926_4.pdf','070926_4.pdf','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/task/1760165398505_070926_4.pdf',86344,'application/pdf','cmgkljr1000008z81edjq66sl','task',NULL,0,1760165398505,1760165398505,'画像');
INSERT INTO files VALUES('cmglx1f3q005t8zpm1dv6vtde','1760165410741_スクリーンショット 2025-10-11 15.26.13.png','スクリーンショット 2025-10-11 15.26.13.png','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/task/1760165410741_スクリーンショット 2025-10-11 15.26.13.png',104211,'image/png','cmgkljr1000008z81edjq66sl','task',NULL,0,1760165410742,1760165410742,'資料');
INSERT INTO files VALUES('cmgm9t3pi000x8zigfxzc00y9','1760186857733_スクリーンショット 2025-08-27 21.32.44.png','スクリーンショット 2025-08-27 21.32.44.png','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/task/1760186857733_スクリーンショット 2025-08-27 21.32.44.png',78504,'image/png','cmgkljr1000008z81edjq66sl','task',NULL,0,1760186857735,1760186857735,'資料');
INSERT INTO files VALUES('cmgmc62tn001n8zigvfh862ny','1760190822345_スクリーンショット 2025-08-27 21.32.44.png','スクリーンショット 2025-08-27 21.32.44.png','/Users/ohsawa/Desktop/HR-system/uploads/cmgkljr1000008z81edjq66sl/task/1760190822345_スクリーンショット 2025-08-27 21.32.44.png',78504,'image/png','cmgkljr1000008z81edjq66sl','task',NULL,0,1760190822347,1760190822347,'資料');
CREATE TABLE IF NOT EXISTS "folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "employeeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "folders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "folders_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "family_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT,
    "livingSeparately" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "myNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, birthDate DATETIME,
    CONSTRAINT "family_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO family_members VALUES('cmglq9p2c001i8zsiasaa2bwd','cmgllvxs000018zguh20qyt8g','オオサワヒトシ','子','0823762008',0,'8-31-12',NULL,1760154039589,1760154039589,NULL);
INSERT INTO family_members VALUES('cmglu2fuv001k8zpm3en6jlon','cmglm3pax00038zgu5t3cw5gh','大澤仁志','','0823762008',1,'呉市広古新開8-31-12',NULL,1760160419528,1760160419528,NULL);
INSERT INTO family_members VALUES('cmglviwno002r8zpmxhbikmeb','cmgkljr1000008z81edjq66sl','大澤仁志','子','0823278787',1,'呉市広文化町6-4',NULL,1760162867412,1760162867412,NULL);
INSERT INTO family_members VALUES('test-001','cmh4ijda700008zz9y63idu2s','テスト家族','子','090-1234-5678',0,'テスト住所','123456','2025-10-24 07:55:13','2025-10-24 07:55:13','2025-09-29T00:00:00.000Z');
CREATE TABLE IF NOT EXISTS "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "employeeType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "furigana" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "team" TEXT,
    "joinDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "password" TEXT NOT NULL,
    "role" TEXT,
    "myNumber" TEXT,
    "userId" TEXT,
    "url" TEXT,
    "address" TEXT,
    "selfIntroduction" TEXT,
    "phoneInternal" TEXT,
    "phoneMobile" TEXT,
    "birthDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "showInOrgChart" BOOLEAN NOT NULL DEFAULT true,
    "parentEmployeeId" TEXT,
    "isInvisibleTop" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "retirementDate" DATETIME,
    "privacyDisplayName" BOOLEAN NOT NULL DEFAULT true,
    "privacyOrganization" BOOLEAN NOT NULL DEFAULT true,
    "privacyDepartment" BOOLEAN NOT NULL DEFAULT true,
    "privacyPosition" BOOLEAN NOT NULL DEFAULT true,
    "privacyUrl" BOOLEAN NOT NULL DEFAULT true,
    "privacyAddress" BOOLEAN NOT NULL DEFAULT true,
    "privacyBio" BOOLEAN NOT NULL DEFAULT true,
    "privacyEmail" BOOLEAN NOT NULL DEFAULT true,
    "privacyWorkPhone" BOOLEAN NOT NULL DEFAULT true,
    "privacyExtension" BOOLEAN NOT NULL DEFAULT true,
    "privacyMobilePhone" BOOLEAN NOT NULL DEFAULT true,
    "privacyBirthDate" BOOLEAN NOT NULL DEFAULT false
, "originalEmployeeId" TEXT);
INSERT INTO employees VALUES('cmgmww1c100008z88sn8uk2y3','EMP-2015-001','001','employee','admin',NULL,'admin@company.com','090-0000-0000','["総務・管理者"]','["システム管理者"]','["株式会社テックイノベーション"]','システム管理',1420070400000,'active','admin','admin',NULL,'','','','','','',NULL,1760085644436,1760162867410,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgkljr1100018z81od9gdvtu','EMP-2015-002','003','employee','mane','マネージャー','manager@company.com','090-0000-0001','["執行部","広店"]','["統括店長"]','["株式会社テックイノベーション"]','管理',1420070400000,'active','mane','manager',NULL,'','','','','','',NULL,1760085644437,1760146486030,1,'cmgkljr1000008z81edjq66sl',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgkljr1100028z81k6te3z1b','EMP-2016-001','EMP-2016-001','employee','sub',NULL,'sub@company.com','090-0000-0002','["総務・管理者"]','["サブ管理者"]','["株式会社テックイノベーション"]','サブ管理',1451606400000,'active','sub','sub_manager',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1760085644438,1760141785026,1,'cmgkljr1500088z81tapu1w1v',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgkljr1200038z81w0b4pk89','EMP-2017-001','EMP-2017-001','employee','ippan',NULL,'ippan@company.com','090-0000-0003','["営業"]','["一般社員"]','["株式会社テックイノベーション"]','営業',1483228800000,'active','ippan','general',NULL,'','','','','','',NULL,1760085644438,1760145264841,1,'cmgkljr1100018z81od9gdvtu',0,0,1759708800000,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgkljr1300048z81o4uq0cqi','EMP-2018-001','EMP-2018-001','employee','etsuran',NULL,'etsuran@company.com','090-0000-0004','["営業"]','["閲覧のみ"]','["株式会社テックイノベーション"]','営業',1514764800000,'active','etsuran','viewer',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1760085644439,1760085705324,1,'cmgkljr1200038z81w0b4pk89',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgkljr1300058z815jdy9o0v','EMP-2021-001','EMP-2021-001','employee','田中 太郎',NULL,'tanaka@company.com','090-1234-5678','["エンジニアリング"]','["シニアエンジニア"]','["株式会社テックイノベーション"]','バックエンドチーム',1617235200000,'active','pass1234','general',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1760085644440,1760085731377,1,'cmgkljr1400078z81jvms1wu2',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgkljr1400068z81kg6le73y','EMP-2020-015','EMP-2020-015','employee','佐藤 花子',NULL,NULL,'','["焼山店"]','["アドバイザー"]','["株式会社オオサワ創研"]','エンタープライズ営業',1594771200000,'active','','general',NULL,'','','','','','',NULL,1760085644440,1760145696469,1,'cmgkljr1400078z81jvms1wu2',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgkljr1400078z81jvms1wu2','EMP-2022-032','EMP-2022-032','employee','鈴木 一郎',NULL,NULL,'','["[\"マーケティング\"]"]','["[\"マーケティングスペシャリスト\"]"]','["[\"株式会社テックイノベーション\"]"]','デジタルマーケティング',1641772800000,'active','','general',NULL,'','','','','','',NULL,1760085644441,1760154012871,1,'cmgkljr1100018z81od9gdvtu',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgkljr1500088z81tapu1w1v','EMP-2019-008','EMP-2019-008','employee','高橋 美咲',NULL,'takahashi@company.com','090-4567-8901','["人事"]','["人事部長"]','["株式会社テックイノベーション"]','人事企画',1553040000000,'active','pass1234','hr',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1760085644442,1760153946392,1,'cmgkljr1600098z81l5eaoe6h',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgkljr1600098z81l5eaoe6h','EMP-2023-045','EMP-2023-045','employee','伊藤 健太',NULL,'ito@company.com','090-5678-9012','["エンジニアリング"]','["ジュニアエンジニア"]','["株式会社テックイノベーション"]','フロントエンドチーム',1680307200000,'active','pass1234','general',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1760085644442,1760154044429,1,'cmglq8jj4001g8zsid9ljudtm',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgklkuqy00018z2wxmumb2ta','EMP-TOP-000','000','employee','見えないTOP',NULL,'invisible-top@company.com','','経営','未設定','株式会社テックイノベーション',NULL,1577836800000,'active','invisible-top-secure-password-2024','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1760085695914,1760085695914,1,NULL,1,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmgllvxs000018zguh20qyt8g','EMP-1760146679231','002','employee','somu','ソウム','oswskn02@gmail.com','0823278787','["執行部","広店"]','["総務"]','["株式会社オオサワ創研"]','',1760140800000,'active','somu','hr',NULL,'','','呉市広文化町6-4','','0823762008','09082454762',NULL,1760146679232,1760154039585,1,'cmglq8jj4001g8zsid9ljudtm',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmglm3pax00038zgu5t3cw5gh','EMP-1760147041496','004','employee','ten','テンチョウ',NULL,'0823278787','["執行部"]','["焼山店店長"]','["株式会社オオサワ創研"]','',1760140800000,'active','ten','store_manager',NULL,'','','呉市広文化町6-4','','0823762008','09082454762',NULL,1760147041497,1760160419525,1,'cmgkljr1000008z81edjq66sl',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL);
INSERT INTO employees VALUES('cmglq8jj4001g8zsid9ljudtm','EMP-2015-001-COPY-1760153985759','001-COPY-1760153985759','employee','admin',NULL,NULL,'090-0000-0000','["総務・管理者"]','["システム管理者"]','["株式会社テックイノベーション"]','システム管理',1420070400000,'copy','admin',NULL,NULL,'','','','','','',NULL,1760153985760,1760154000718,1,'cmgkljr1000008z81edjq66sl',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,'cmgkljr1000008z81edjq66sl');
CREATE TABLE IF NOT EXISTS "workspaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workspaces_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO workspaces VALUES('cmglwg9va00348zpmbf0t4y52','会社全体ワークスペース','','cmgkljr1000008z81edjq66sl',1760164424182,1760169974023);
INSERT INTO workspaces VALUES('cmglwhno700488zpmrd4l8kh3','テストボード','','cmgkljr1000008z81edjq66sl',1760164488727,1760169900547);
INSERT INTO workspaces VALUES('cmglzrlu8006t8zpm98tp7flz','福祉部','','cmgkljr1000008z81edjq66sl',1760169991760,1760169991760);
CREATE TABLE IF NOT EXISTS "workspace_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO workspace_members VALUES('cmglwg9va00368zpmo6nxah05','cmglwg9va00348zpmbf0t4y52','cmgkljr1000008z81edjq66sl','workspace_admin',1760164424182);
INSERT INTO workspace_members VALUES('cmglwg9va00378zpmgx3wn2jn','cmglwg9va00348zpmbf0t4y52','cmgkljr1100018z81od9gdvtu','workspace_member',1760164424182);
INSERT INTO workspace_members VALUES('cmglwg9va00388zpmw6vezfke','cmglwg9va00348zpmbf0t4y52','cmgkljr1100028z81k6te3z1b','workspace_member',1760164424182);
INSERT INTO workspace_members VALUES('cmglwg9va00398zpmn2zlz0z9','cmglwg9va00348zpmbf0t4y52','cmgkljr1200038z81w0b4pk89','workspace_member',1760164424182);
INSERT INTO workspace_members VALUES('cmglwg9va003a8zpmke4mgjve','cmglwg9va00348zpmbf0t4y52','cmgkljr1300048z81o4uq0cqi','workspace_member',1760164424182);
INSERT INTO workspace_members VALUES('cmglwhno7004a8zpmlcaay1u7','cmglwhno700488zpmrd4l8kh3','cmgkljr1000008z81edjq66sl','workspace_admin',1760164488727);
INSERT INTO workspace_members VALUES('cmglzrlu8006v8zpmy495v55z','cmglzrlu8006t8zpm98tp7flz','cmgkljr1000008z81edjq66sl','workspace_admin',1760169991760);
INSERT INTO workspace_members VALUES('cmglzrlu8006w8zpm6vxj1yge','cmglzrlu8006t8zpm98tp7flz','cmgkljr1100018z81od9gdvtu','workspace_member',1760169991760);
INSERT INTO workspace_members VALUES('cmglzrlu8006x8zpmrpeqtsu1','cmglzrlu8006t8zpm98tp7flz','cmgkljr1100028z81k6te3z1b','workspace_member',1760169991760);
INSERT INTO workspace_members VALUES('cmglzrlu8006y8zpm6ddohj9z','cmglzrlu8006t8zpm98tp7flz','cmgkljr1200038z81w0b4pk89','workspace_member',1760169991760);
INSERT INTO workspace_members VALUES('cmglzrlu8006z8zpmbixprfjb','cmglzrlu8006t8zpm98tp7flz','cmgkljr1300048z81o4uq0cqi','workspace_member',1760169991760);
CREATE TABLE IF NOT EXISTS "boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workspaceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "boards_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "boards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO boards VALUES('cmglwga1t003c8zpmkq6ttxh0','メインボード','メインのタスクボードです','cmglwg9va00348zpmbf0t4y52',0,'cmgkljr1000008z81edjq66sl',1760164424417,1760164424417);
INSERT INTO boards VALUES('cmglwhnot004c8zpmhi25q0d8','テストボード','','cmglwhno700488zpmrd4l8kh3',0,'cmgkljr1000008z81edjq66sl',1760164488749,1760168792567);
INSERT INTO boards VALUES('cmglzrm0s00718zpmluznqm3d','メインボード','メインのタスクボードです','cmglzrlu8006t8zpm98tp7flz',0,'cmgkljr1000008z81edjq66sl',1760169991996,1760169991996);
INSERT INTO boards VALUES('cmgmaq9nh00168zigfqsw3euy','プライベートボード','自分のボード','cmglzrlu8006t8zpm98tp7flz',1,'cmgkljr1000008z81edjq66sl',1760188405085,1760188405085);
CREATE TABLE IF NOT EXISTS "board_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "color" TEXT DEFAULT '#f1f5f9',
    CONSTRAINT "board_lists_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO board_lists VALUES('cmglwga1t003d8zpm3db2r110','cmglwga1t003c8zpmkq6ttxh0','未着手',0,1760164424417,1760164424417,'#f1f5f9');
INSERT INTO board_lists VALUES('cmglwga1t003e8zpmhzgx7f3x','cmglwga1t003c8zpmkq6ttxh0','進行中',1,1760164424417,1760164424417,'#f1f5f9');
INSERT INTO board_lists VALUES('cmglwga1t003f8zpmy8ywgdlf','cmglwga1t003c8zpmkq6ttxh0','レビュー',2,1760164424417,1760164424417,'#f1f5f9');
INSERT INTO board_lists VALUES('cmglwga1t003g8zpm0wgxgpux','cmglwga1t003c8zpmkq6ttxh0','完了',3,1760164424417,1760164424417,'#f1f5f9');
INSERT INTO board_lists VALUES('cmglwga9m003i8zpmjm56op8b','cmglwga1t003c8zpmkq6ttxh0','未着手',4,1760164424699,1760164424699,'#f1f5f9');
INSERT INTO board_lists VALUES('cmglwga9u003k8zpmoit4q1yx','cmglwga1t003c8zpmkq6ttxh0','進行中',5,1760164424707,1760164424707,'#f1f5f9');
INSERT INTO board_lists VALUES('cmglwgaa0003m8zpmwjvcksy9','cmglwga1t003c8zpmkq6ttxh0','レビュー',6,1760164424713,1760164424713,'#f1f5f9');
INSERT INTO board_lists VALUES('cmglwgaa5003o8zpmpx30sp42','cmglwga1t003c8zpmkq6ttxh0','完了',7,1760164424718,1760164424718,'#f1f5f9');
INSERT INTO board_lists VALUES('cmglwhnot004d8zpmlkfniw7w','cmglwhnot004c8zpmhi25q0d8','予定リスト',0,1760164488749,1760176299029,'rgba(234, 179, 8, 0.15)');
INSERT INTO board_lists VALUES('cmglwhnot004f8zpmi53zmw0x','cmglwhnot004c8zpmhi25q0d8','レビュー',2,1760164488749,1760164488749,'#f1f5f9');
INSERT INTO board_lists VALUES('cmglwhnot004g8zpmxyp6813e','cmglwhnot004c8zpmhi25q0d8','完了',3,1760164488749,1760164488749,'#f1f5f9');
INSERT INTO board_lists VALUES('cmglzrm0s00728zpmovzzduap','cmglzrm0s00718zpmluznqm3d','予定リスト',1,1760169991996,1760195281057,'rgba(249, 115, 22, 0.15)');
INSERT INTO board_lists VALUES('cmglzrm0s00738zpmiu3graa0','cmglzrm0s00718zpmluznqm3d','進行中',2,1760169991996,1760188062172,'rgba(244, 63, 94, 0.15)');
INSERT INTO board_lists VALUES('cmglzrm0s00758zpm2so1kuoq','cmglzrm0s00718zpmluznqm3d','完了',3,1760169991996,1760188062172,'#e5e7eb');
INSERT INTO board_lists VALUES('cmgmaab0m00118zig098qyk3j','cmglzrm0s00718zpmluznqm3d','常時タスク',0,1760187660358,1760188062172,'rgba(99, 102, 241, 0.15)');
INSERT INTO board_lists VALUES('cmgmaq9nh00178zig7yo6ayeq','cmgmaq9nh00168zigfqsw3euy','常時タスク',0,1760188405085,1760188405085,'rgba(99, 102, 241, 0.15)');
INSERT INTO board_lists VALUES('cmgmaq9nh00188zigrnpdhzij','cmgmaq9nh00168zigfqsw3euy','予定リスト',1,1760188405085,1760188405085,'#ffffff');
INSERT INTO board_lists VALUES('cmgmaq9nh00198zig1x1kv8m9','cmgmaq9nh00168zigfqsw3euy','進行中',2,1760188405085,1760188405085,'rgba(244, 63, 94, 0.15)');
INSERT INTO board_lists VALUES('cmgmaq9nh001a8zight60dpq3','cmgmaq9nh00168zigfqsw3euy','完了',3,1760188405085,1760188405085,'#e5e7eb');
CREATE TABLE IF NOT EXISTS "card_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "card_members_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "card_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "card_members_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO card_members VALUES('cmgm2lfqg00068zke0xr1j3dl','cmgm0ux5w007l8zpm1lamexwi','cmgkljr1000008z81edjq66sl','cmgkljr1000008z81edjq66sl',1760174742761);
INSERT INTO card_members VALUES('cmgm2lfqg00078zke6sx33p19','cmgm0ux5w007l8zpm1lamexwi','cmgkljr1100018z81od9gdvtu','cmgkljr1000008z81edjq66sl',1760174742761);
INSERT INTO card_members VALUES('cmgm5b5sr00088zkeece71ykm','cmglwv6w900598zpmw9bum281','cmgkljr1000008z81edjq66sl','cmgkljr1000008z81edjq66sl',1760179302172);
INSERT INTO card_members VALUES('cmgm5b5sr00098zkelvym4rnn','cmglwv6w900598zpmw9bum281','cmgkljr1100018z81od9gdvtu','cmgkljr1000008z81edjq66sl',1760179302172);
INSERT INTO card_members VALUES('cmgm5b5sr000a8zkecdbl0a1c','cmglwv6w900598zpmw9bum281','cmgkljr1100028z81k6te3z1b','cmgkljr1000008z81edjq66sl',1760179302172);
INSERT INTO card_members VALUES('cmgm8opjb000m8zigxsxtqh8l','cmgm8opja000l8zigw78szqh0','cmgkljr1000008z81edjq66sl','cmgkljr1000008z81edjq66sl',1760184973127);
INSERT INTO card_members VALUES('cmgmbavli001c8zigl4gtc6pl','cmgmabuik00138zigqdrn8c8m','cmgkljr1000008z81edjq66sl','cmgkljr1000008z81edjq66sl',1760189366646);
INSERT INTO card_members VALUES('cmgmbavli001d8zigkwne32la','cmgmabuik00138zigqdrn8c8m','cmgkljr1100018z81od9gdvtu','cmgkljr1000008z81edjq66sl',1760189366646);
INSERT INTO card_members VALUES('cmgmbavli001e8zigoh7ybtah','cmgmabuik00138zigqdrn8c8m','cmgkljr1100028z81k6te3z1b','cmgkljr1000008z81edjq66sl',1760189366646);
INSERT INTO card_members VALUES('cmgmc3u1h001k8zig6570jpwz','cmgmbgrlb001g8zig4z6upx8x','cmgkljr1000008z81edjq66sl','cmgkljr1000008z81edjq66sl',1760190717654);
INSERT INTO card_members VALUES('cmgmc989g001q8zigydwaekre','cmgm7j5ho00058zigev0hbts0','cmgkljr1000008z81edjq66sl','cmgkljr1000008z81edjq66sl',1760190969365);
INSERT INTO card_members VALUES('cmgmc989g001r8zigzqbnbvmu','cmgm7j5ho00058zigev0hbts0','cmgkljr1100018z81od9gdvtu','cmgkljr1000008z81edjq66sl',1760190969365);
INSERT INTO card_members VALUES('cmgmfvfys00038zhnjvafj50b','cmgmfv40k00018zhncf5mntju','cmgkljr1000008z81edjq66sl','cmgkljr1000008z81edjq66sl',1760197044629);
CREATE TABLE IF NOT EXISTS "cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "cardColor" TEXT,
    "labels" JSONB,
    "checklists" JSONB,
    "attachments" JSONB,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cards_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cards_listId_fkey" FOREIGN KEY ("listId") REFERENCES "board_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO cards VALUES('cmglwv6w900598zpmw9bum281','cmglwhnot004c8zpmhi25q0d8','cmglwhnot004d8zpmlkfniw7w','テストテスト','tesutotestste',1,1760454000000,'a1','todo','#dbfbd5','[{"id":"label-1","name":"緊急","color":"#ef4444"}]','[{"id":"checklist-1760170584822","title":"テスト","items":[{"id":"item-1760170591241","text":"111","completed":false},{"id":"item-1760170595592","text":"2222","completed":false}]}]','[{"id":"cmglx1f3q005t8zpm1dv6vtde","name":"スクリーンショット 2025-10-11 15.26.13.png","type":"image/png","uploadDate":"2025-10-11","size":"101.77 KB","folderName":"資料"}]',0,'cmgkljr1000008z81edjq66sl',1760165120170,1760179650912);
INSERT INTO cards VALUES('cmgm0ux5w007l8zpm1lamexwi','cmglzrm0s00718zpmluznqm3d','cmglzrm0s00728zpmovzzduap','五十嵐さん書類作成確認','連携して確認する',2,1760454000000,'medium','todo','#feffcc','[{"id":"label-1760171910193","name":"固定📌","color":"#3b82f6"}]','[{"id":"checklist-1760171848934","title":"書類確認","items":[{"id":"item-1760171862356","text":"勤怠表","completed":false},{"id":"item-1760171869392","text":"給付金請求","completed":false}]}]','[]',0,'cmgkljr1000008z81edjq66sl',1760171826020,1760197237660);
INSERT INTO cards VALUES('cmgm7j5ho00058zigev0hbts0','cmglzrm0s00718zpmluznqm3d','cmglzrm0s00738zpmiu3graa0','アーカイブテスト案件','テスト',1,1761663600000,'high','cmglzrm0s00728zpmovzzduap','#f9eedd','[]','[]','[{"id":"cmgmc62tn001n8zigvfh862ny","name":"スクリーンショット 2025-08-27 21.32.44.png","type":"image/png","uploadDate":"2025-10-11","size":"76.66 KB","folderName":"資料"}]',0,'cmgkljr1000008z81edjq66sl',1760183034253,1760197249440);
INSERT INTO cards VALUES('cmgm8opja000l8zigw78szqh0','cmglzrm0s00718zpmluznqm3d','cmglzrm0s00728zpmovzzduap','テスト','テストテスト',3,NULL,'high','todo',NULL,NULL,NULL,NULL,1,'cmgkljr1000008z81edjq66sl',1760184973127,1760184986683);
INSERT INTO cards VALUES('cmgm8ox5c000o8zig4rxiqp9p','cmglzrm0s00718zpmluznqm3d','cmglzrm0s00738zpmiu3graa0','アーカイブテスト','test',1,1759849200000,'b1','cmglzrm0s00728zpmovzzduap','#fbe9e9','[{"id":"label-1","name":"緊急","color":"#ef4444"}]','[]','[{"id":"cmgm9t3pi000x8zigfxzc00y9","name":"スクリーンショット 2025-08-27 21.32.44.png","type":"image/png","uploadDate":"2025-10-11","size":"76.66 KB","folderName":"資料"}]',0,'cmgkljr1000008z81edjq66sl',1760184982992,1760193255451);
INSERT INTO cards VALUES('cmgm8yuev000r8zighbfrwe9h','cmglzrm0s00718zpmluznqm3d','cmglzrm0s00738zpmiu3graa0','11アーカイブ用','',5,NULL,'medium','scheduled',NULL,'[]','[]','[]',1,'cmgkljr1000008z81edjq66sl',1760185446007,1760197129985);
INSERT INTO cards VALUES('cmgm9hma7000u8zig5muedpog','cmglzrm0s00718zpmluznqm3d','cmglzrm0s00728zpmovzzduap','テスト','ツト',6,1760281200000,'medium','todo','#fde3e3','[]','[]','[]',1,'cmgkljr1000008z81edjq66sl',1760186321936,1760186485817);
INSERT INTO cards VALUES('cmgmabuik00138zigqdrn8c8m','cmglzrm0s00718zpmluznqm3d','cmglzrm0s00728zpmovzzduap','広告作成','チラシとHPの連動',1,1761145200000,'a2','todo','#d3fddc','[{"id":"label-1760189278089","name":"チラシ準備","color":"#3b82f6"}]','[{"id":"checklist-1760189301384","title":"チラシ作成","items":[{"id":"item-1760189315934","text":"初稿","completed":false},{"id":"item-1760189329674","text":"校了","completed":false}]}]','[]',0,'cmgkljr1000008z81edjq66sl',1760187732284,1760196348439);
INSERT INTO cards VALUES('cmgmbgrlb001g8zig4z6upx8x','cmglzrm0s00718zpmluznqm3d','cmgmaab0m00118zig098qyk3j','📌広告作成','チラシとHPの連動',0,NULL,'a2','todo',NULL,'[]','[]','[]',0,'cmgkljr1000008z81edjq66sl',1760189641392,1760190717655);
INSERT INTO cards VALUES('cmgmfv40k00018zhncf5mntju','cmglzrm0s00718zpmluznqm3d','cmglzrm0s00728zpmovzzduap','test','testtest',2,NULL,'low','in-progress','#f9d7d7','[]','[]','[]',0,'cmgkljr1000008z81edjq66sl',1760197029140,1760197251366);
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");
CREATE UNIQUE INDEX "employees_employeeNumber_key" ON "employees"("employeeNumber");
CREATE UNIQUE INDEX "workspace_members_workspaceId_employeeId_key" ON "workspace_members"("workspaceId", "employeeId");
CREATE UNIQUE INDEX "card_members_cardId_employeeId_key" ON "card_members"("cardId", "employeeId");
COMMIT;
