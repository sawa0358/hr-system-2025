PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
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
COMMIT;
