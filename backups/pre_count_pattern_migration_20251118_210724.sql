PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "task_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_members_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "leave_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "custom_folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'employee',
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "custom_folders_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO custom_folders VALUES('cmhv8mjt6000j8z6h0s3j2hhh','cmgooyh7700098zsag0i221ar','employee','契約書類',0,1762905850314,1762905850314);
INSERT INTO custom_folders VALUES('cmhv8mjt6000k8z6hrkn3xnyn','cmgooyh7700098zsag0i221ar','employee','履歴書等',1,1762905850314,1762905850314);
INSERT INTO custom_folders VALUES('cmhv8mjt6000l8z6hzqqux82f','cmgooyh7700098zsag0i221ar','employee','その他',2,1762905850314,1762905850314);
INSERT INTO custom_folders VALUES('cmhv8mtzu000r8z6h7k9h3vsk','cmgooyh7500058zsa7kxxlq5o','employee','契約書類',0,1762905863515,1762905863515);
INSERT INTO custom_folders VALUES('cmhv8mtzu000s8z6h7phofza6','cmgooyh7500058zsa7kxxlq5o','employee','履歴書等',1,1762905863515,1762905863515);
INSERT INTO custom_folders VALUES('cmhv8mtzu000t8z6hara4qxrl','cmgooyh7500058zsa7kxxlq5o','employee','その他',2,1762905863515,1762905863515);
INSERT INTO custom_folders VALUES('cmhv8n6u0000z8z6h3g9tsext','cmgooyh79000e8zsae0xdczu2','employee','契約書類',0,1762905880152,1762905880152);
INSERT INTO custom_folders VALUES('cmhv8n6u000108z6hlr2isdiv','cmgooyh79000e8zsae0xdczu2','employee','履歴書等',1,1762905880152,1762905880152);
INSERT INTO custom_folders VALUES('cmhv8n6u000118z6ha0d3xhl9','cmgooyh79000e8zsae0xdczu2','employee','その他',2,1762905880152,1762905880152);
INSERT INTO custom_folders VALUES('cmhv8nrc9001p8z6hzmzeekl2','cmgooyh7c000i8zsadh770q3z','employee','契約書類',0,1762905906729,1762905906729);
INSERT INTO custom_folders VALUES('cmhv8nrc9001q8z6hft1uh25o','cmgooyh7c000i8zsadh770q3z','employee','履歴書等',1,1762905906729,1762905906729);
INSERT INTO custom_folders VALUES('cmhv8nrc9001r8z6hizt3hgkm','cmgooyh7c000i8zsadh770q3z','employee','その他',2,1762905906729,1762905906729);
INSERT INTO custom_folders VALUES('cmhv8p8q5001w8z6hjzt5tepi','cmgooyh7a000h8zsapdc6r6vj','employee','契約書類',0,1762905975917,1762905975917);
INSERT INTO custom_folders VALUES('cmhv8p8q5001x8z6hg9ohszki','cmgooyh7a000h8zsapdc6r6vj','employee','履歴書等',1,1762905975917,1762905975917);
INSERT INTO custom_folders VALUES('cmhv8p8q5001y8z6hz4lozua5','cmgooyh7a000h8zsapdc6r6vj','employee','その他',2,1762905975917,1762905975917);
INSERT INTO custom_folders VALUES('cmhv8pfbx00258z6hprpgtsr8','cmgooyh7g000t8zsaquxtzj38','employee','契約書類',0,1762905984478,1762905984478);
INSERT INTO custom_folders VALUES('cmhv8pfbx00268z6h0no1ml9k','cmgooyh7g000t8zsaquxtzj38','employee','履歴書等',1,1762905984478,1762905984478);
INSERT INTO custom_folders VALUES('cmhv8pfbx00278z6hj3lm5udx','cmgooyh7g000t8zsaquxtzj38','employee','その他',2,1762905984478,1762905984478);
INSERT INTO custom_folders VALUES('cmhvbdax700278z89ydqfparu','cmgooyh7600088zsar06vq4lj','employee','契約書類',0,1762910457740,1762910457740);
INSERT INTO custom_folders VALUES('cmhvbdax700288z899nyi2a5j','cmgooyh7600088zsar06vq4lj','employee','履歴書等',1,1762910457740,1762910457740);
INSERT INTO custom_folders VALUES('cmhvbdax700298z89o5upqli4','cmgooyh7600088zsar06vq4lj','employee','その他',2,1762910457740,1762910457740);
INSERT INTO custom_folders VALUES('cmhvbedxd002g8z89ti9my5xq','cmhvb7og5001d8z89ho6a33di','employee','契約書類',0,1762910508289,1762910508289);
INSERT INTO custom_folders VALUES('cmhvbedxd002h8z89ohssmjoj','cmhvb7og5001d8z89ho6a33di','employee','履歴書等',1,1762910508289,1762910508289);
INSERT INTO custom_folders VALUES('cmhvbedxd002i8z89tr93mpku','cmhvb7og5001d8z89ho6a33di','employee','その他',2,1762910508289,1762910508289);
INSERT INTO custom_folders VALUES('cmhvbiwc9003m8z89kmw6i9by','cmgpa2k6n00048z8ru56ad74d','employee','契約書類',0,1762910718778,1762910718778);
INSERT INTO custom_folders VALUES('cmhvbiwc9003n8z89lbvbuix7','cmgpa2k6n00048z8ru56ad74d','employee','履歴書等',1,1762910718778,1762910718778);
INSERT INTO custom_folders VALUES('cmhvbiwc9003o8z89l94lwm1m','cmgpa2k6n00048z8ru56ad74d','employee','その他',2,1762910718778,1762910718778);
INSERT INTO custom_folders VALUES('cmhzzd5f100248z0a8l2knax7','cmhzzd5dy001p8z0anahgcb8c','employee','契約書類',0,1763192626093,1763192626093);
INSERT INTO custom_folders VALUES('cmhzzd5f100258z0als1ok5dj','cmhzzd5dy001p8z0anahgcb8c','employee','履歴書等',1,1763192626093,1763192626093);
INSERT INTO custom_folders VALUES('cmhzzd5f100268z0aeelyhva8','cmhzzd5dy001p8z0anahgcb8c','employee','その他',2,1763192626093,1763192626093);
INSERT INTO custom_folders VALUES('cmhzzdamx002b8z0a2mtfh9se','cmhzzb7tf000h8z0a3i13f2z0','employee','契約書類',0,1763192632857,1763192632857);
INSERT INTO custom_folders VALUES('cmhzzdamx002c8z0ajqfshjsy','cmhzzb7tf000h8z0a3i13f2z0','employee','履歴書等',1,1763192632857,1763192632857);
INSERT INTO custom_folders VALUES('cmhzzdamx002d8z0as35fxwfm','cmhzzb7tf000h8z0a3i13f2z0','employee','その他',2,1763192632857,1763192632857);
INSERT INTO custom_folders VALUES('cmhzzdhgd002i8z0a6ud7m7x7','cmhzzc2sv00138z0axtgg3rib','employee','契約書類',0,1763192641693,1763192641693);
INSERT INTO custom_folders VALUES('cmhzzdhgd002j8z0alihrpa4n','cmhzzc2sv00138z0axtgg3rib','employee','履歴書等',1,1763192641693,1763192641693);
INSERT INTO custom_folders VALUES('cmhzzdhgd002k8z0au81efuk7','cmhzzc2sv00138z0axtgg3rib','employee','その他',2,1763192641693,1763192641693);
INSERT INTO custom_folders VALUES('cmhzze1j900348z0arit5sr72','cmhzze1i8002p8z0a6tyddu5n','employee','契約書類',0,1763192667717,1763192667717);
INSERT INTO custom_folders VALUES('cmhzze1j900358z0aadw7t1qa','cmhzze1i8002p8z0a6tyddu5n','employee','履歴書等',1,1763192667717,1763192667717);
INSERT INTO custom_folders VALUES('cmhzze1j900368z0apxmyc7c0','cmhzze1i8002p8z0a6tyddu5n','employee','その他',2,1763192667717,1763192667717);
INSERT INTO custom_folders VALUES('cmi40gh0n00118z9bdztrlpzz','cmgooyh7f000p8zsax21pn6we','employee','契約書類',0,1763436325416,1763436325416);
INSERT INTO custom_folders VALUES('cmi40gh0n00128z9b9c85x2of','cmgooyh7f000p8zsax21pn6we','employee','履歴書等',1,1763436325416,1763436325416);
INSERT INTO custom_folders VALUES('cmi40gh0n00138z9bx4sx3jtq','cmgooyh7f000p8zsax21pn6we','employee','その他',2,1763436325416,1763436325416);
INSERT INTO custom_folders VALUES('cmi40gsor001a8z9bgs8axy3j','cmgooyh7200008zsavyswd64d','employee','契約書類',0,1763436340539,1763436340539);
INSERT INTO custom_folders VALUES('cmi40gsor001b8z9bg7pxvlxu','cmgooyh7200008zsavyswd64d','employee','履歴書等',1,1763436340539,1763436340539);
INSERT INTO custom_folders VALUES('cmi40gsor001c8z9bu33fxtxa','cmgooyh7200008zsavyswd64d','employee','その他',2,1763436340539,1763436340539);
CREATE TABLE IF NOT EXISTS "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_settings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO user_settings VALUES('cmhv8mjuw000n8z6h87rplb1t','cmgooyh7700098zsag0i221ar','password-visible','false',1762905850377,1762905850377);
INSERT INTO user_settings VALUES('cmhv8mjv5000p8z6hy4jia5c5','cmgooyh7700098zsag0i221ar','avatar-text','',1762905850386,1762905850386);
INSERT INTO user_settings VALUES('cmhv8mu1m000v8z6hpjql1nm7','cmgooyh7500058zsa7kxxlq5o','password-visible','false',1762905863579,1762905863579);
INSERT INTO user_settings VALUES('cmhv8mu1t000x8z6hsltcyw60','cmgooyh7500058zsa7kxxlq5o','avatar-text','',1762905863585,1762905863585);
INSERT INTO user_settings VALUES('cmhv8n6vr00138z6h0539dspq','cmgooyh79000e8zsae0xdczu2','password-visible','false',1762905880215,1762905880215);
INSERT INTO user_settings VALUES('cmhv8n6vz00158z6h4ebbb4ti','cmgooyh79000e8zsae0xdczu2','avatar-text','',1762905880224,1762905880224);
INSERT INTO user_settings VALUES('cmhv8ncwd001a8z6hvvckxzno','cmgooyh7f000p8zsax21pn6we','password-visible','true',1762905888013,1763436325455);
INSERT INTO user_settings VALUES('cmhv8nd0d001c8z6hcw6xnfm3','cmgooyh7f000p8zsax21pn6we','avatar-text','',1762905888157,1763436325505);
INSERT INTO user_settings VALUES('cmhv8nks0001j8z6h3t3micnb','cmgooyh7200008zsavyswd64d','password-visible','true',1762905898224,1763436340583);
INSERT INTO user_settings VALUES('cmhv8nks7001l8z6hiar1x73u','cmgooyh7200008zsavyswd64d','avatar-text','田中',1762905898231,1763436340627);
INSERT INTO user_settings VALUES('cmhv8nre1001t8z6h6jzu4lpr','cmgooyh7c000i8zsadh770q3z','password-visible','false',1762905906793,1762905906793);
INSERT INTO user_settings VALUES('cmhv8nre8001v8z6hp3thjbft','cmgooyh7c000i8zsadh770q3z','avatar-text','',1762905906801,1762905906801);
INSERT INTO user_settings VALUES('cmhv8p8rs00208z6h3odvop0g','cmgooyh7a000h8zsapdc6r6vj','password-visible','false',1762905975977,1762905975977);
INSERT INTO user_settings VALUES('cmhv8p8s500228z6h0dxj6z85','cmgooyh7a000h8zsapdc6r6vj','avatar-text','',1762905975989,1762905975989);
INSERT INTO user_settings VALUES('cmhv8pfeo00298z6hbc90qn7h','cmgooyh7g000t8zsaquxtzj38','password-visible','false',1762905984576,1762905984576);
INSERT INTO user_settings VALUES('cmhv8pfir002b8z6hxrw0dcn4','cmgooyh7g000t8zsaquxtzj38','avatar-text','',1762905984723,1762905984723);
INSERT INTO user_settings VALUES('cmhv8pn8y002g8z6hgng6vv0r','cmgooyh7600088zsar06vq4lj','password-visible','true',1762905994738,1762910457811);
INSERT INTO user_settings VALUES('cmhv8pn95002i8z6hvaqyfd2e','cmgooyh7600088zsar06vq4lj','avatar-text','',1762905994745,1762910457821);
INSERT INTO user_settings VALUES('cmhv8qdxi002n8z6hgw5xq85d','cmgpa2k6n00048z8ru56ad74d','password-visible','true',1762906029319,1762910718846);
INSERT INTO user_settings VALUES('cmhv8qdxp002p8z6hz6plsar6','cmgpa2k6n00048z8ru56ad74d','avatar-text','',1762906029325,1762910718865);
INSERT INTO user_settings VALUES('cmhvb7p4y001w8z89yzz3vflx','cmhvb7og5001d8z89ho6a33di','password-visible','false',1762910196226,1762910508354);
INSERT INTO user_settings VALUES('cmhvb7p58001y8z89azixvh3i','cmhvb7og5001d8z89ho6a33di','avatar-text','',1762910196236,1762910508369);
INSERT INTO user_settings VALUES('cmhzzb8ba00108z0a2u3fmbrx','cmhzzb7tf000h8z0a3i13f2z0','password-visible','true',1763192536534,1763192632886);
INSERT INTO user_settings VALUES('cmhzzb8c000128z0azejefdxn','cmhzzb7tf000h8z0a3i13f2z0','avatar-text','店長',1763192536560,1763192632916);
INSERT INTO user_settings VALUES('cmhzzc2uq001m8z0an5i5uo8l','cmhzzc2sv00138z0axtgg3rib','password-visible','true',1763192576115,1763192641726);
INSERT INTO user_settings VALUES('cmhzzc2vg001o8z0a8f7q86ag','cmhzzc2sv00138z0axtgg3rib','avatar-text','',1763192576141,1763192641754);
INSERT INTO user_settings VALUES('cmhzzd5fu00288z0apcqv17lf','cmhzzd5dy001p8z0anahgcb8c','password-visible','true',1763192626122,1763192626122);
INSERT INTO user_settings VALUES('cmhzzd5gl002a8z0aojijweak','cmhzzd5dy001p8z0anahgcb8c','avatar-text','マネ',1763192626149,1763192626149);
INSERT INTO user_settings VALUES('cmhzze1k000388z0amgx9rapb','cmhzze1i8002p8z0a6tyddu5n','password-visible','true',1763192667745,1763192667745);
INSERT INTO user_settings VALUES('cmhzze1kr003a8z0adndvhej2','cmhzze1i8002p8z0a6tyddu5n','avatar-text','総務',1763192667771,1763192667771);
CREATE TABLE IF NOT EXISTS "master_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "vacation_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initialGrantPeriod" INTEGER NOT NULL,
    "grantPeriod" INTEGER NOT NULL,
    "carryOverLimit" INTEGER NOT NULL,
    "validityYears" INTEGER NOT NULL,
    "minimumMandatoryDays" INTEGER NOT NULL,
    "fullTimeGrantDays" INTEGER NOT NULL,
    "partTime1DayGrant" INTEGER NOT NULL,
    "partTime2DayGrant" INTEGER NOT NULL,
    "partTime3DayGrant" INTEGER NOT NULL,
    "partTime4DayGrant" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "vacation_grant_schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceYears" REAL NOT NULL,
    "fullTimeGrantDays" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "parttime_grant_schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceDays" INTEGER NOT NULL,
    "workDaysPerWeek" INTEGER NOT NULL,
    "grantDays" INTEGER NOT NULL,
    "annualMinDays" INTEGER NOT NULL,
    "annualMaxDays" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "vacation_balances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "grantDate" DATETIME NOT NULL,
    "grantDays" INTEGER NOT NULL,
    "remainingDays" REAL NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vacation_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "vacation_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "usedDays" REAL NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vacation_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "vacation_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "balanceId" TEXT NOT NULL,
    "usedDays" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vacation_usage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "vacation_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vacation_usage_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "vacation_balances" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "alert_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alert3MonthsBefore" BOOLEAN NOT NULL DEFAULT true,
    "alert3MonthsThreshold" INTEGER NOT NULL DEFAULT 5,
    "alert2MonthsBefore" BOOLEAN NOT NULL DEFAULT true,
    "alert2MonthsThreshold" INTEGER NOT NULL DEFAULT 3,
    "alert1MonthBefore" BOOLEAN NOT NULL DEFAULT true,
    "alert1MonthThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "grant_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "grantDate" DATETIME NOT NULL,
    "daysGranted" DECIMAL NOT NULL,
    "daysRemaining" DECIMAL NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "configVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "grant_lots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO grant_lots VALUES('cmhv8r3df002r8z6hbryid2oa','cmgooyh7c000i8zsadh770q3z',1517443200000,10,10,1580428800000,'4337d56ffa133e90501c225fa639220ac904f4fc590d7500e0dbbdc4a403eb95','1.0.0',1762906062292,1762906062292);
INSERT INTO grant_lots VALUES('cmhv8r3dh002t8z6himz1mup9','cmgooyh7c000i8zsadh770q3z',1548979200000,11,11,1612051200000,'e814b1d1b72969f8105fa39e5067ffb27580f9a163ed4842c1bc65018df59d18','1.0.0',1762906062293,1762906062293);
INSERT INTO grant_lots VALUES('cmhv8r3dh002v8z6hboptaxk7','cmgooyh7c000i8zsadh770q3z',1580515200000,12,12,1643587200000,'df7981de8ca587d9670b21d5e73096d56bb0197050ab7e66059bc7a641d339e4','1.0.0',1762906062294,1762906062294);
INSERT INTO grant_lots VALUES('cmhv8r3dj002x8z6hnrxikjj0','cmgooyh7c000i8zsadh770q3z',1612137600000,14,14,1675123200000,'b0902f8fe2bad6840ab5a3a41e3c204099b4bcfd7b2b16b7e0217b3c06e59e9c','1.0.0',1762906062295,1762906062295);
INSERT INTO grant_lots VALUES('cmhv8r3dk002z8z6h1apoyc0w','cmgooyh7c000i8zsadh770q3z',1643673600000,16,16,1706659200000,'66fd835377263ffc63309dd4e46280f62a7b821d8df200e1c25b8d997813b540','1.0.0',1762906062296,1762906062296);
INSERT INTO grant_lots VALUES('cmhv8r3dk00318z6h00e5s9w9','cmgooyh7c000i8zsadh770q3z',1675209600000,18,18,1738281600000,'372d8dee23d454722bc711d249731c7cabfa4312069399877d30c96579c26a4c','1.0.0',1762906062297,1762906062297);
INSERT INTO grant_lots VALUES('cmhv8r3dl00338z6hl1vu5xs6','cmgooyh7c000i8zsadh770q3z',1706745600000,20,20,1769817600000,'46b81cbfa126aa28c0ac5ab0a26bf8d265aec93704a3fbd104155bab56aa7c5d','1.0.0',1762906062298,1762906062298);
INSERT INTO grant_lots VALUES('cmhv8r3dm00358z6h8wa1n5g3','cmgooyh7c000i8zsadh770q3z',1738368000000,20,20,1801353600000,'5aef194dc4cf18b3d3008434774a56ab2fdddacee09cd6ad5c45e739ebab5076','1.0.0',1762906062298,1762906062298);
INSERT INTO grant_lots VALUES('cmhv8r8db00378z6h0sezd6ta','cmgooyh7700098zsag0i221ar',1535760000000,10,10,1598832000000,'0f3c1117cfb5388d04425fa2869f16c41dae463b90b282c61d733d0b33acef0c','1.0.0',1762906068767,1762906068767);
INSERT INTO grant_lots VALUES('cmhv8r8dc00398z6hn1gykcrv','cmgooyh7700098zsag0i221ar',1567296000000,11,11,1630368000000,'ed0fd76c8962f698c3346e9b4eea14c284937ec6073f7618db3358e0cfd27cd8','1.0.0',1762906068768,1762906068768);
INSERT INTO grant_lots VALUES('cmhv8r8dd003b8z6h2qw4jpyg','cmgooyh7700098zsag0i221ar',1598918400000,12,12,1661904000000,'54feef26aa78e7ef324f39379135e98159e7389af418e3fe66be2dbb971e8093','1.0.0',1762906068770,1762906068770);
INSERT INTO grant_lots VALUES('cmhv8r8de003d8z6hnh7q73au','cmgooyh7700098zsag0i221ar',1630454400000,14,14,1693440000000,'4f4bad87c65ce6a2d237b64868b796703a9c3b0983684a68fe7a1beace43261c','1.0.0',1762906068770,1762906068770);
INSERT INTO grant_lots VALUES('cmhv8r8df003f8z6hqjcdyfhg','cmgooyh7700098zsag0i221ar',1661990400000,16,16,1725062400000,'a5dc3fdc70b232960ffbb34cb54bb85367f17bd863d020497e6ce96fce943745','1.0.0',1762906068771,1762906068771);
INSERT INTO grant_lots VALUES('cmhv8r8dg003h8z6hn8uqe5it','cmgooyh7700098zsag0i221ar',1693526400000,18,18,1756598400000,'14034f8d658b6f6f54af88a9ea0b8aeba3465d77ab062956863e792fe4578dff','1.0.0',1762906068772,1762906068772);
INSERT INTO grant_lots VALUES('cmhv8r8dh003j8z6hnm7yp14n','cmgooyh7700098zsag0i221ar',1725148800000,20,20,1788134400000,'443df2de17a766f9e2eb3cf84e1df4c39a9c36e66dab51bddd3dc4c863821b22','1.0.0',1762906068773,1762906068773);
INSERT INTO grant_lots VALUES('cmhv8r8dh003l8z6hxp07q80v','cmgooyh7700098zsag0i221ar',1756684800000,20,20,1819670400000,'486b6ae2f5333876df7ea4f81a08877606c4fcf7c1490773f8644a4354b66f5c','1.0.0',1762906068774,1762906068774);
INSERT INTO grant_lots VALUES('cmhv8rhkv003n8z6hhf1nsbvm','cmgooyh7f000p8zsax21pn6we',1661990400000,5,5,1725062400000,'68d15348c13c46c6b012a3361673a3650e9fe4540662a02583f0180968225314','1.0.0',1762906080703,1762906080703);
INSERT INTO grant_lots VALUES('cmhv8rhkw003p8z6hqwyvcsjp','cmgooyh7f000p8zsax21pn6we',1693526400000,6,6,1756598400000,'f26784301130b445afbabfea79a78e8f91c0f84023373a3149130b2a3a387a43','1.0.0',1762906080705,1762906080705);
INSERT INTO grant_lots VALUES('cmhv8rhkx003r8z6hj7ajir2q','cmgooyh7f000p8zsax21pn6we',1725148800000,6,6,1788134400000,'88c8533f51791019ca854c3c85640cd78aa8f841ba7bb42610afb03167a28e58','1.0.0',1762906080706,1762906080706);
INSERT INTO grant_lots VALUES('cmhv8rhky003t8z6h073jitq0','cmgooyh7f000p8zsax21pn6we',1756684800000,8,8,1819670400000,'47b3cbb5b4ef8d771ee3b75713437a698a75a714803cd8ff493510994c4fb971','1.0.0',1762906080707,1762906080707);
INSERT INTO grant_lots VALUES('cmhv8rofg003v8z6hypeiomf1','cmgooyh7500058zsa7kxxlq5o',1577836800000,10,10,1640908800000,'92123737aaabfead7d271557b3dd55710cd3d5882caf87b1a3986b3410a9ea89','1.0.0',1762906089581,1762906089581);
INSERT INTO grant_lots VALUES('cmhv8rofi003x8z6h1gufil2k','cmgooyh7500058zsa7kxxlq5o',1609459200000,11,11,1672444800000,'aeed1b6aef3d7195d07752f2674a7f2b356224454117e6e945f2aa89cb7c6fd3','1.0.0',1762906089582,1762906089582);
INSERT INTO grant_lots VALUES('cmhv8rofk003z8z6huc7civzk','cmgooyh7500058zsa7kxxlq5o',1640995200000,12,12,1703980800000,'00cfe71d667b30d1502ad4685c6e48ab71e3a0a0e2c6aee479c4a60548b77aeb','1.0.0',1762906089584,1762906089584);
INSERT INTO grant_lots VALUES('cmhv8rofl00418z6hr6wsrn8f','cmgooyh7500058zsa7kxxlq5o',1672531200000,14,14,1735603200000,'a58f64d5e209acd90840d9482432e92a52588ef607604e355801a8a216be752b','1.0.0',1762906089586,1762906089586);
INSERT INTO grant_lots VALUES('cmhv8rofn00438z6hx3pp88kp','cmgooyh7500058zsa7kxxlq5o',1704067200000,16,16,1767139200000,'71658e51ec5695390170083b77f60114c540b1c21e22987f5834d9e522135e2c','1.0.0',1762906089587,1762906089587);
INSERT INTO grant_lots VALUES('cmhv8rofo00458z6h19t61mwa','cmgooyh7500058zsa7kxxlq5o',1735689600000,18,18,1798675200000,'4b6e1684e29e06f6e836314682dd8881133aa34d0bfa1b4bc6d96b7e5f9b579c','1.0.0',1762906089588,1762906089588);
INSERT INTO grant_lots VALUES('cmhv8rrza00478z6hv7p48uxp','cmgooyh79000e8zsae0xdczu2',1606780800000,10,10,1669766400000,'6de0a11305f3916eafb426d21f3d0a320235351a82ab359591b82001b9199521','1.0.0',1762906094183,1762906094183);
INSERT INTO grant_lots VALUES('cmhv8rrzb00498z6h4ttryhil','cmgooyh79000e8zsae0xdczu2',1638316800000,11,11,1701302400000,'9133872921e4453e57c102388a467826a72f5d45efc84c2f17e860ebcdbb5ffe','1.0.0',1762906094184,1762906094184);
INSERT INTO grant_lots VALUES('cmhv8rrzc004b8z6hvdhkromm','cmgooyh79000e8zsae0xdczu2',1669852800000,12,12,1732924800000,'0dbd47b74bffe4a50eb6ad71bb5e6d7815cfd96e03173af21661995b23eed4d8','1.0.0',1762906094184,1762906094184);
INSERT INTO grant_lots VALUES('cmhv8rrzc004d8z6hepieop3b','cmgooyh79000e8zsae0xdczu2',1701388800000,14,14,1764460800000,'0e2c737475052160c2137261af193fbe392a144de8dd13fa0041e3456214f6d4','1.0.0',1762906094185,1762906094185);
INSERT INTO grant_lots VALUES('cmhv8rrzd004f8z6h79dej7h6','cmgooyh79000e8zsae0xdczu2',1733011200000,16,16,1795996800000,'60734680a1cbb334154c7e23446d2cb5a8d9f2f7fab6fef92577ed080ec49a74','1.0.0',1762906094186,1762906094186);
INSERT INTO grant_lots VALUES('cmhv8rwfx004h8z6h5f4urk87','cmgooyh7a000h8zsapdc6r6vj',1633046400000,7,7,1696032000000,'17da8d044814ecb07429f381da368b3674c6a6a830ad3093df99fd06e465cbe5','1.0.0',1762906099965,1762906099965);
INSERT INTO grant_lots VALUES('cmhv8rwfy004j8z6hgw5zz86z','cmgooyh7a000h8zsapdc6r6vj',1664582400000,8,8,1727654400000,'940216e029e480aaed1752e008abe42101e71477f399e30fc797c2c3f84da882','1.0.0',1762906099966,1762906099966);
INSERT INTO grant_lots VALUES('cmhv8rwfy004l8z6hx188vhrj','cmgooyh7a000h8zsapdc6r6vj',1696118400000,9,9,1759190400000,'3d7ebe2a7aa8534f9f89a17df9a998ef79b7c6cc70d8ae23d1051788c1b97ae5','1.0.0',1762906099967,1762906099967);
INSERT INTO grant_lots VALUES('cmhv8rwfz004n8z6hc4xsr9aw','cmgooyh7a000h8zsapdc6r6vj',1727740800000,10,10,1790726400000,'b5a732a35b51811a619a1ce0def44b0421fbf4ff89bd7a3d0df7bc7520dd428a','1.0.0',1762906099968,1762906099968);
INSERT INTO grant_lots VALUES('cmhv8rwg0004p8z6h5pwy9pm1','cmgooyh7a000h8zsapdc6r6vj',1759276800000,12,12,1822262400000,'b98caa9d71e2ebb159d05ca39e2d7e9ab487815173375f4ef62aa368f6dd79a6','1.0.0',1762906099968,1762906099968);
INSERT INTO grant_lots VALUES('cmhv8s61j004r8z6hp0u48ssq','cmgooyh7600088zsar06vq4lj',1626307200000,3,3,1689292800000,'a1d49dbe554cd4d8131bb498bef0153d62fe99d32505d3b1d347103c629ecaab','1.0.0',1762906112408,1762906112408);
INSERT INTO grant_lots VALUES('cmhv8s61l004t8z6hekwobn1n','cmgooyh7600088zsar06vq4lj',1657843200000,4,4,1720915200000,'7755a643fb8cd3d924985d4fae0c3c16988e110bfd2779ce7cb79d810e18bdaa','1.0.0',1762906112410,1762906112410);
INSERT INTO grant_lots VALUES('cmhv8s61n004v8z6hos4k9mdj','cmgooyh7600088zsar06vq4lj',1689379200000,4,4,1752451200000,'7efc541378c8d6e40deb411dff62ebc17d9bf74d84082bb3dbdb1f4964594b64','1.0.0',1762906112411,1762906112411);
INSERT INTO grant_lots VALUES('cmhv8s61o004x8z6h9kkn8nf7','cmgooyh7600088zsar06vq4lj',1721001600000,5,5,1783987200000,'0cb0ffd41eeb21140d123379b988def0f814483b63b1ef9d51c5ff0392ff9bf7','1.0.0',1762906112413,1762906112413);
INSERT INTO grant_lots VALUES('cmhv8s61q004z8z6hlhan1x4z','cmgooyh7600088zsar06vq4lj',1752537600000,6,6,1815523200000,'daab1b721034b2a20f04e24f26dbbedb06ee7bc7565093a99a2d0cb4b78bbf78','1.0.0',1762906112415,1762906112415);
INSERT INTO grant_lots VALUES('cmhv8sl5600518z6hw1tyk7qh','cmgooyh7g000t8zsaquxtzj38',1551398400000,10,10,1614470400000,'bc6dc7affa330eaf5be6967d786222123ba3a30972e20d3f339adf2a8bb0049e','1.0.0',1762906131978,1762906131978);
INSERT INTO grant_lots VALUES('cmhv8sl5700538z6hw9ai4h1i','cmgooyh7g000t8zsaquxtzj38',1583020800000,11,11,1646006400000,'94ff04c4c2627e9040eb54cda74665874668e548cafedb3b1ca71af82885f127','1.0.0',1762906131979,1762906131979);
INSERT INTO grant_lots VALUES('cmhv8sl5700558z6hejg4rcxx','cmgooyh7g000t8zsaquxtzj38',1614556800000,12,12,1677542400000,'17236572b31cede6e6620ff9969249ace7e60ded710ba04f7ac55315b846705f','1.0.0',1762906131980,1762906131980);
INSERT INTO grant_lots VALUES('cmhv8sl5800578z6h8812tay0','cmgooyh7g000t8zsaquxtzj38',1646092800000,14,14,1709164800000,'fcb3fa68f0631b38d4fab44f92ab86c997d7db22740363789c89277c0c41035a','1.0.0',1762906131981,1762906131981);
INSERT INTO grant_lots VALUES('cmhv8sl5900598z6hbkmt7rkg','cmgooyh7g000t8zsaquxtzj38',1677628800000,16,16,1740700800000,'17d287556e6e7a89861d3bfaa44341211ecb7a1083fcfb2b265a0e6d70b52881','1.0.0',1762906131982,1762906131982);
INSERT INTO grant_lots VALUES('cmhv8sl5a005b8z6hhnkg21kg','cmgooyh7g000t8zsaquxtzj38',1709251200000,18,18,1772236800000,'7e5a3a4ba27713468d4aa3da3b11b152b716ce192b2692360fe14651791431d9','1.0.0',1762906131982,1762906131982);
INSERT INTO grant_lots VALUES('cmhv8sl5b005d8z6hp9x16x14','cmgooyh7g000t8zsaquxtzj38',1740787200000,20,20,1803772800000,'c93ef42c713405af729161d728ba2addf76d085a63c081844b6ee14abce094fc','1.0.0',1762906131983,1762906131983);
INSERT INTO grant_lots VALUES('cmhv8sqn7005f8z6haicqo6vq','cmgpa2k6n00048z8ru56ad74d',1751328000000,5,5,1814313600000,'440039712e1e613db2051bbfeb38b9993334caed4ceb286ce4f751355d37f18d','1.0.0',1762906139108,1762906139108);
CREATE TABLE IF NOT EXISTS "consumptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "daysUsed" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consumptions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consumptions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "time_off_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consumptions_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "grant_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "time_off_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "unit" TEXT NOT NULL,
    "hoursPerDay" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" DATETIME,
    "supervisorId" TEXT,
    "approvedBy" TEXT,
    "finalizedBy" TEXT,
    "totalDays" DECIMAL,
    "breakdownJson" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "time_off_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "alert_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "referenceDate" DATETIME NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_events_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "vacation_app_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "bulletin_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'secondary',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO bulletin_categories VALUES('cmhvaxzas000o8z89dchodlnl','一般','secondary',1762909742837,1762909742837);
INSERT INTO bulletin_categories VALUES('cmhvaxzas000p8z89alejk5y7','重要','destructive',1762909742837,1762909742837);
INSERT INTO bulletin_categories VALUES('cmhvaxzas000q8z89ekk7ol8j','人事','default',1762909742837,1762909742837);
INSERT INTO bulletin_categories VALUES('cmhvaxzas000r8z894tdq4giu','システム','outline',1762909742837,1762909742837);
INSERT INTO bulletin_categories VALUES('cmhvaxzas000s8z89j64v73uy','評価','secondary',1762909742837,1762909742837);
CREATE TABLE IF NOT EXISTS "bulletins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bulletins_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "bulletin_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO bulletins VALUES('cmhvaxzav000z8z89abp1lk0d','年末年始休暇のお知らせ','12月29日から1月3日まで年末年始休暇となります。緊急連絡先は別途メールにてご案内いたします。',1,1736294400000,'cmhvaxzas000p8z89alejk5y7',1762909742838,1762909742838);
INSERT INTO bulletins VALUES('cmhvaxzav00118z89rgwqmxx3','新人研修プログラムの開始について','1月15日より新入社員向けの研修プログラムを開始します。各部署の担当者は準備をお願いします。',0,1736035200000,'cmhvaxzas000q8z89ekk7ol8j',1762909742838,1762909742838);
INSERT INTO bulletins VALUES('cmhvaxzav00138z898xjt7psf','システムメンテナンスのお知らせ','1月12日(日) 2:00-6:00の間、システムメンテナンスを実施します。この間、一部機能がご利用いただけません。',0,1735862400000,'cmhvaxzas000r8z894tdq4giu',1762909742838,1762909742838);
INSERT INTO bulletins VALUES('cmhvaxzav00158z893x1u4yml','第4四半期の目標設定について','各部署の目標設定を1月20日までに提出してください。評価面談は2月上旬を予定しています。',0,1735776000000,'cmhvaxzas000s8z89j64v73uy',1762909742838,1762909742838);
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "clockIn" DATETIME,
    "clockOut" DATETIME,
    "breakStart" DATETIME,
    "breakEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'present',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "board_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "board_lists_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO board_lists VALUES('b085fc3d-f464-411e-883e-791160a6d2f2','常時運用タスク',0,'cmgop2je0000t8zbz7nrf94be','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('d6df5920-2b4d-4b2a-9152-7f8db07bc718','常時運用タスク',0,'cmgopbz22001n8zbzu06oby0q','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('0d63596a-0dad-49e5-af1c-9349c610bcc8','ToDo',0,'cmgopyibx00058z9syhosgcox','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('386a9dbe-2fce-4dd3-8231-79232b9fd3f5','ToDo',0,'cmgopyic5000h8z9semeqjzku','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('7ce331f2-b3ea-4f8b-87e5-374509b64a2d','ToDo',0,'cmgopyicb000t8z9swz2h4od9','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('d20095f4-ac77-4187-8bb6-7abeca238696','ToDo',0,'cmgopyici00158z9snt2vxhjc','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('589a9e61-f5b7-4f1a-a3b8-152ce928fdb1','ToDo',0,'cmgopyicu001h8z9sw2ba3815','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('b06989d6-1c78-4de8-8034-dee5df71c9c1','ToDo',0,'cmgopyid6001t8z9sez23xsot','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('fd093dcd-74c4-4262-a5d5-7c6c1f97ab78','ToDo',0,'cmgopyidj00258z9sa7b6bmkd','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('718db3c5-d4d0-445c-91ab-0fe07d0071a9','ToDo',0,'cmgopyidw002h8z9so3xfzwg2','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('6643b94d-89a6-4faa-8ea2-30c10923545b','ToDo',0,'cmgopyiea002t8z9suhd8d9dn','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('e5ecd6d8-0967-4e14-b93b-098401a45660','ToDo',0,'cmgopyiee00358z9spu141r97','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('090b6e77-34ad-4c1b-ae8f-f916fa29c775','ToDo',0,'cmgopyif3003h8z9sppfp21y5','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('7cfd4de6-abdf-4160-9f24-069b6dfa48d7','ToDo',0,'cmgopyif6003t8z9sljpiwhq9','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('cd7f398b-c0db-4b15-ab3c-e415865c48e9','ToDo',0,'cmgopyif900458z9spcr55wjg','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('1b9ad9ad-6a0d-4890-835e-5608255f0498','ToDo',0,'cmgopyifc004h8z9srxcpjb2d','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('52064e26-e546-4120-84ea-405154b6dc13','ToDo',0,'cmgopyig5004t8z9shfjkkkmg','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('56191e97-67a7-4f6a-b784-dc5ea5be9982','ToDo',0,'cmgopyigj00558z9slpb7fido','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('9f8a6709-006e-4873-a8f1-e2ff71f8efa5','ToDo',0,'cmgopyigm005h8z9slxs3e0sz','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('f5906c81-1470-4972-af6b-9609c1d81b47','常時運用タスク',0,'cmgoqn6o500218zbzvafwewj5','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('dab4c396-4479-4533-ab54-b5835bb52ea2','常時運用タスク',0,'cmgor2owk002d8zbz4pr1xdoj','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('530dd678-e9d0-4f6c-914c-5e919af7c117','常時運用タスク',0,'cmgorebfp00328zbz07wcbmm8','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('87fb1f9c-a61f-436f-b8b2-8ec77d542f63','常時運用タスク',0,'cmgorepy2003c8zbzahivczxe','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('50461dd7-1fe6-497d-a63e-df45ce1e23fd','予定リスト',1,'cmgop2je0000t8zbz7nrf94be','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('2a33ac1d-f1bd-4db4-87df-50d976bef3eb','予定リスト',1,'cmgopbz22001n8zbzu06oby0q','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('73bb56b7-f2b8-4362-848f-f686cb94bfe3','進行中',1,'cmgopyibx00058z9syhosgcox','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('8b1983ef-c4c7-4248-8924-cf6c1694006b','進行中',1,'cmgopyic5000h8z9semeqjzku','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('24c04611-53ce-4664-9882-e9489b6b14cc','進行中',1,'cmgopyicb000t8z9swz2h4od9','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('326c7fe1-a91c-4f58-861a-c34c32da5bdb','進行中',1,'cmgopyici00158z9snt2vxhjc','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('c559e08b-ed1a-48d3-be14-940bed79e553','進行中',1,'cmgopyicu001h8z9sw2ba3815','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('104fe269-58f9-4710-bbfe-f9af38e10798','進行中',1,'cmgopyid6001t8z9sez23xsot','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('f8690ac4-8ee4-4fa3-bc81-217809ce4055','進行中',1,'cmgopyidj00258z9sa7b6bmkd','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('4e17dc45-2294-47a8-b68f-28bc672b210f','進行中',1,'cmgopyidw002h8z9so3xfzwg2','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('4d1cfecd-e6a4-4cdf-b8a6-aab1f99ee02c','進行中',1,'cmgopyiea002t8z9suhd8d9dn','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('4235f37c-588e-4862-8ab2-d2892932dbd3','進行中',1,'cmgopyiee00358z9spu141r97','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('1cd15333-fbba-4c2e-a1cc-e1226840d129','進行中',1,'cmgopyif3003h8z9sppfp21y5','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('715b1d61-9f89-4017-bcae-5ea7c42eaf04','進行中',1,'cmgopyif6003t8z9sljpiwhq9','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('39a29cd9-8b6b-47b3-9501-66e86ea8dae0','進行中',1,'cmgopyif900458z9spcr55wjg','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('df2aae23-5b2b-4359-8d49-52481da43148','進行中',1,'cmgopyifc004h8z9srxcpjb2d','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('c5525fc6-0ca2-4544-9b41-d27bee886b93','進行中',1,'cmgopyig5004t8z9shfjkkkmg','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('51014ee9-67dc-47b8-9e2d-af6a9f6b7664','進行中',1,'cmgopyigj00558z9slpb7fido','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('cf710968-385a-4ccb-b7fa-7771bbd6133e','進行中',1,'cmgopyigm005h8z9slxs3e0sz','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('e4a81f86-a8bc-4aa6-8f3c-185f58bcbf59','予定リスト',1,'cmgoqn6o500218zbzvafwewj5','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('c240d600-e468-4ac6-a149-9863bef68dd2','予定リスト',1,'cmgor2owk002d8zbz4pr1xdoj','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('2d3c26ab-718b-4d59-a58f-d570e9baf488','予定リスト',1,'cmgorebfp00328zbz07wcbmm8','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('2d9d3bd3-2549-4d1c-ada9-2e9f91542909','予定リスト',1,'cmgorepy2003c8zbzahivczxe','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('002a5500-dd59-4f64-b0db-b8990fe446be','進行中',2,'cmgop2je0000t8zbz7nrf94be','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('86e7b26c-ca20-4a0a-8585-43f638cc8a0e','進行中',2,'cmgopbz22001n8zbzu06oby0q','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('97fe6bb0-d486-4191-95f3-c8f473085bd0','進行中',2,'cmgopyibx00058z9syhosgcox','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('f3eb4d6a-3f1e-4ed0-a1a8-946cfb4b10ed','進行中',2,'cmgopyic5000h8z9semeqjzku','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('a8e1beaa-8754-457b-a4d9-282510423952','進行中',2,'cmgopyicb000t8z9swz2h4od9','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('3260d303-b035-4439-a6ae-9e25cdfb3492','進行中',2,'cmgopyici00158z9snt2vxhjc','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('6ee18ad1-5730-4648-9e56-1ad115ee3f7b','進行中',2,'cmgopyicu001h8z9sw2ba3815','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('b7023390-7787-4b24-8238-42329b65e0b8','進行中',2,'cmgopyid6001t8z9sez23xsot','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('81d983f3-842f-4c5e-955a-7ac4d782cb03','進行中',2,'cmgopyidj00258z9sa7b6bmkd','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('ae4db9f7-e4c0-4542-a6ee-819793a162ff','進行中',2,'cmgopyidw002h8z9so3xfzwg2','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('5bd75f65-1c0d-45df-9149-7a809c4a5ace','進行中',2,'cmgopyiea002t8z9suhd8d9dn','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('55017c88-1837-4117-89b8-b7acf203b4f3','進行中',2,'cmgopyiee00358z9spu141r97','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('37538ee4-ad5c-4079-aa9a-afa14f7ddfab','進行中',2,'cmgopyif3003h8z9sppfp21y5','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('160a9009-6fe0-4ab2-afc9-a2a3a531649a','進行中',2,'cmgopyif6003t8z9sljpiwhq9','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('b6e9dec6-4e24-4157-ab14-f2d80660f932','進行中',2,'cmgopyif900458z9spcr55wjg','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('e578a9dc-481b-4c72-a835-b0ffc556d794','進行中',2,'cmgopyifc004h8z9srxcpjb2d','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('cf9a2bde-db66-4f38-b582-8f2ba7438cfc','進行中',2,'cmgopyig5004t8z9shfjkkkmg','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('d02303d5-9fd2-4ce7-bc9b-4109cc001f1e','進行中',2,'cmgopyigj00558z9slpb7fido','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('2d577469-a92a-406e-b171-f2fae6f324ed','進行中',2,'cmgopyigm005h8z9slxs3e0sz','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('1c5869a4-e71a-4e02-a674-2b9db0b10e4e','進行中',2,'cmgoqn6o500218zbzvafwewj5','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('2f67b811-672f-418c-9d77-23e7cf98af1d','進行中',2,'cmgor2owk002d8zbz4pr1xdoj','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('840fb41c-f9ce-4541-a887-1774e68e554c','進行中',2,'cmgorebfp00328zbz07wcbmm8','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('14110053-31db-410e-9cf0-6c8ecbf3d5b1','進行中',2,'cmgorepy2003c8zbzahivczxe','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('82309f8a-1b64-4d54-b53c-393e70f38638','完了',3,'cmgop2je0000t8zbz7nrf94be','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('bb6a506b-c170-4d13-ad39-e184d83c77d0','完了',3,'cmgopbz22001n8zbzu06oby0q','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('fdc24ae4-aac5-4d73-8063-2e494352f9f9','完了',3,'cmgopyibx00058z9syhosgcox','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('0f4530e7-8576-4b29-a9e1-27693284cdab','完了',3,'cmgopyic5000h8z9semeqjzku','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('f604ba07-adfb-4b2b-9348-955986a3d373','完了',3,'cmgopyicb000t8z9swz2h4od9','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('3f03275d-164e-4d24-847b-e84cb28b2a6f','完了',3,'cmgopyici00158z9snt2vxhjc','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('d8df29bc-021c-42f2-ab08-af79fb2e005e','完了',3,'cmgopyicu001h8z9sw2ba3815','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('0f630999-4af9-4b7d-832f-d3cd9e82d378','完了',3,'cmgopyid6001t8z9sez23xsot','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('85959513-3dad-4680-bf13-9660ca255e40','完了',3,'cmgopyidj00258z9sa7b6bmkd','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('ea67f7c9-7237-498f-a651-ffe55eda0a05','完了',3,'cmgopyidw002h8z9so3xfzwg2','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('6cdb2a38-040b-4cfc-a014-ee6f96844542','完了',3,'cmgopyiea002t8z9suhd8d9dn','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('caa6868e-d1c9-4a27-bea7-4e2bd8faac18','完了',3,'cmgopyiee00358z9spu141r97','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('093815be-42b4-4979-a5f9-172254ebe801','完了',3,'cmgopyif3003h8z9sppfp21y5','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('efe44f90-2d9e-45ea-86fb-5ba8aa2a8141','完了',3,'cmgopyif6003t8z9sljpiwhq9','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('fd94076a-edc7-4750-b7b5-316c1d38ac97','完了',3,'cmgopyif900458z9spcr55wjg','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('01a12bbc-d710-423e-950c-2d64ca97d71e','完了',3,'cmgopyifc004h8z9srxcpjb2d','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('6bbb0241-4b64-4b04-8b35-6fe75b20df6a','完了',3,'cmgopyig5004t8z9shfjkkkmg','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('dcc9a660-f983-4024-9270-c4309ecf4ccd','完了',3,'cmgopyigj00558z9slpb7fido','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('2e7e305a-e303-4d2f-a59d-008e483676cc','完了',3,'cmgopyigm005h8z9slxs3e0sz','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('6d65c56e-71e8-48df-9a8a-252d9ba635a0','完了',3,'cmgoqn6o500218zbzvafwewj5','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('803effbf-2118-4c73-a011-b82096fba1a4','完了',3,'cmgor2owk002d8zbz4pr1xdoj','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('a24ca396-ec2f-4577-b788-f1ffa5576e5a','完了',3,'cmgorebfp00328zbz07wcbmm8','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('69b0ae8b-7a31-41f0-b8de-1e83ae400fb6','完了',3,'cmgorepy2003c8zbzahivczxe','2025-10-13 06:38:05','2025-10-13 06:38:05');
INSERT INTO board_lists VALUES('cmgpa2k6q000c8z8rdorhj63y','常時運用タスク',0,'cmgpa2k6q000a8z8r0enwco3o',1760368697522,1760368697522);
INSERT INTO board_lists VALUES('cmgpa2k6q000e8z8r98797v2v','予定リスト',1,'cmgpa2k6q000a8z8r0enwco3o',1760368697523,1760368697523);
INSERT INTO board_lists VALUES('cmgpa2k6r000g8z8rs6yadj6r','進行中',2,'cmgpa2k6q000a8z8r0enwco3o',1760368697523,1760368697523);
INSERT INTO board_lists VALUES('cmgpa2k6r000i8z8rpv2o8cp9','完了',3,'cmgpa2k6q000a8z8r0enwco3o',1760368697524,1760368697524);
INSERT INTO board_lists VALUES('cmgpa5wc0001m8z8rhtfb2d22','常時運用タスク',0,'cmgpa5wc0001l8z8rse7ockr6',1760368853232,1760368853232);
INSERT INTO board_lists VALUES('cmgpa5wc0001n8z8rbmlyokdp','予定リスト',1,'cmgpa5wc0001l8z8rse7ockr6',1760368853232,1760368853232);
INSERT INTO board_lists VALUES('cmgpa5wc0001o8z8r5y9sg1vc','進行中',2,'cmgpa5wc0001l8z8rse7ockr6',1760368853232,1760368853232);
INSERT INTO board_lists VALUES('cmgpa5wc0001p8z8rq2niyasw','完了',3,'cmgpa5wc0001l8z8rse7ockr6',1760368853232,1760368853232);
INSERT INTO board_lists VALUES('cmgpa5wc0001q8z8r6yscclj7','常時運用タスク',4,'cmgpa5wc0001l8z8rse7ockr6',1760368853232,1760368853232);
INSERT INTO board_lists VALUES('cmgpa5wc0001r8z8rayxtdq1t','予定リスト',5,'cmgpa5wc0001l8z8rse7ockr6',1760368853232,1760368853232);
INSERT INTO board_lists VALUES('cmgpa5wc0001s8z8r8v9oml47','進行中',6,'cmgpa5wc0001l8z8rse7ockr6',1760368853232,1760368853232);
INSERT INTO board_lists VALUES('cmgpa5wc0001t8z8r4e0nkicd','完了',7,'cmgpa5wc0001l8z8rse7ockr6',1760368853232,1760368853232);
INSERT INTO board_lists VALUES('cmgpa76s500228z8rtybdmmlo','常時運用タスク',0,'cmgpa76s200208z8r6wcm209o',1760368913429,1760368913429);
INSERT INTO board_lists VALUES('cmgpa76s700248z8rucwjpggt','予定リスト',1,'cmgpa76s200208z8r6wcm209o',1760368913431,1760368913431);
INSERT INTO board_lists VALUES('cmgpa76s800268z8rpsm7z4wu','進行中',2,'cmgpa76s200208z8r6wcm209o',1760368913432,1760368913432);
INSERT INTO board_lists VALUES('cmgpa76s800288z8rpkeejult','完了',3,'cmgpa76s200208z8r6wcm209o',1760368913433,1760368913433);
INSERT INTO board_lists VALUES('cmgpae3ed002b8z8r3e2cr1qf','常時運用タスク',0,'cmgpae3ed002a8z8rxpyjc4bg',1760369235637,1760369235637);
INSERT INTO board_lists VALUES('cmgpae3ed002c8z8rv7mgea7y','予定リスト',1,'cmgpae3ed002a8z8rxpyjc4bg',1760369235637,1760369235637);
INSERT INTO board_lists VALUES('cmgpae3ed002d8z8rngh4ta69','進行中',2,'cmgpae3ed002a8z8rxpyjc4bg',1760369235637,1760369235637);
INSERT INTO board_lists VALUES('cmgpae3ed002e8z8r2a62igs6','完了',3,'cmgpae3ed002a8z8rxpyjc4bg',1760369235637,1760369235637);
INSERT INTO board_lists VALUES('cmgpae3ed002f8z8rhx2l0hb4','常時運用タスク',4,'cmgpae3ed002a8z8rxpyjc4bg',1760369235637,1760369235637);
INSERT INTO board_lists VALUES('cmgpae3ed002g8z8rgg5ykt6a','予定リスト',5,'cmgpae3ed002a8z8rxpyjc4bg',1760369235637,1760369235637);
INSERT INTO board_lists VALUES('cmgpae3ed002h8z8rvv03vnpy','進行中',6,'cmgpae3ed002a8z8rxpyjc4bg',1760369235637,1760369235637);
INSERT INTO board_lists VALUES('cmgpae3ed002i8z8r38kq4zvq','完了',7,'cmgpae3ed002a8z8rxpyjc4bg',1760369235637,1760369235637);
INSERT INTO board_lists VALUES('cmgqnmewp000b8z7x9jtbkpqt','常時運用タスク',0,'cmgqnmewp000a8z7x2guhmaz5',1760451924986,1760451924986);
INSERT INTO board_lists VALUES('cmgqnmewp000c8z7xka590n8d','予定リスト',1,'cmgqnmewp000a8z7x2guhmaz5',1760451924986,1760451924986);
INSERT INTO board_lists VALUES('cmgqnmewp000d8z7x6p6o38bh','進行中',2,'cmgqnmewp000a8z7x2guhmaz5',1760451924986,1760451924986);
INSERT INTO board_lists VALUES('cmgqnmewp000e8z7xorha1w53','完了',3,'cmgqnmewp000a8z7x2guhmaz5',1760451924986,1760451924986);
INSERT INTO board_lists VALUES('cmhutho5x00068z6h9nhwskgb','常時運用タスク',0,'cmhutho5x00058z6hdozrc7ao',1762880428437,1762880428437);
INSERT INTO board_lists VALUES('cmhutho5x00078z6hclpnymi0','予定リスト',1,'cmhutho5x00058z6hdozrc7ao',1762880428437,1762880428437);
INSERT INTO board_lists VALUES('cmhutho5x00088z6hgb515s1y','進行中',2,'cmhutho5x00058z6hdozrc7ao',1762880428437,1762880428437);
INSERT INTO board_lists VALUES('cmhutho5x00098z6hv1k392tb','完了',3,'cmhutho5x00058z6hdozrc7ao',1762880428437,1762880428437);
INSERT INTO board_lists VALUES('cmhvb7ogb001l8z89pufyxyw4','常時運用タスク',0,'cmhvb7oga001j8z89bfpfw8hx',1762910195340,1762910195340);
INSERT INTO board_lists VALUES('cmhvb7ogd001n8z89fa23tbi1','予定リスト',1,'cmhvb7oga001j8z89bfpfw8hx',1762910195341,1762910195341);
INSERT INTO board_lists VALUES('cmhvb7oge001p8z89v9ny6vmi','進行中',2,'cmhvb7oga001j8z89bfpfw8hx',1762910195342,1762910195342);
INSERT INTO board_lists VALUES('cmhvb7oge001r8z89pubxlv3q','完了',3,'cmhvb7oga001j8z89bfpfw8hx',1762910195343,1762910195343);
INSERT INTO board_lists VALUES('cmhzzb7tk000p8z0auh8gnmt6','常時運用タスク',0,'cmhzzb7tj000n8z0aybzqsyw6',1763192535897,1763192535897);
INSERT INTO board_lists VALUES('cmhzzb7tl000r8z0aw1a91lyq','予定リスト',1,'cmhzzb7tj000n8z0aybzqsyw6',1763192535897,1763192535897);
INSERT INTO board_lists VALUES('cmhzzb7tl000t8z0ah31954b2','進行中',2,'cmhzzb7tj000n8z0aybzqsyw6',1763192535898,1763192535898);
INSERT INTO board_lists VALUES('cmhzzb7tm000v8z0atxr5gaco','完了',3,'cmhzzb7tj000n8z0aybzqsyw6',1763192535898,1763192535898);
INSERT INTO board_lists VALUES('cmhzzc2sz001b8z0av0qamdrf','常時運用タスク',0,'cmhzzc2sy00198z0aisgpmblm',1763192576051,1763192576051);
INSERT INTO board_lists VALUES('cmhzzc2t0001d8z0ajgxfwxto','予定リスト',1,'cmhzzc2sy00198z0aisgpmblm',1763192576052,1763192576052);
INSERT INTO board_lists VALUES('cmhzzc2t0001f8z0asomckmhq','進行中',2,'cmhzzc2sy00198z0aisgpmblm',1763192576053,1763192576053);
INSERT INTO board_lists VALUES('cmhzzc2t1001h8z0abqsnwqc8','完了',3,'cmhzzc2sy00198z0aisgpmblm',1763192576053,1763192576053);
INSERT INTO board_lists VALUES('cmhzzd5e3001x8z0a05p0xrv7','常時運用タスク',0,'cmhzzd5e1001v8z0avxrt4qus',1763192626059,1763192626059);
INSERT INTO board_lists VALUES('cmhzzd5e4001z8z0azc2prcqn','予定リスト',1,'cmhzzd5e1001v8z0avxrt4qus',1763192626060,1763192626060);
INSERT INTO board_lists VALUES('cmhzzd5e500218z0a3cqpiv02','進行中',2,'cmhzzd5e1001v8z0avxrt4qus',1763192626061,1763192626061);
INSERT INTO board_lists VALUES('cmhzzd5e500238z0al93qv3ez','完了',3,'cmhzzd5e1001v8z0avxrt4qus',1763192626062,1763192626062);
INSERT INTO board_lists VALUES('cmhzze1ic002x8z0ara82trit','常時運用タスク',0,'cmhzze1ib002v8z0ac5caa11s',1763192667685,1763192667685);
INSERT INTO board_lists VALUES('cmhzze1id002z8z0aqi4mk1nf','予定リスト',1,'cmhzze1ib002v8z0ac5caa11s',1763192667685,1763192667685);
INSERT INTO board_lists VALUES('cmhzze1id00318z0asa9uwap7','進行中',2,'cmhzze1ib002v8z0ac5caa11s',1763192667686,1763192667686);
INSERT INTO board_lists VALUES('cmhzze1ie00338z0a2f8vvkef','完了',3,'cmhzze1ib002v8z0ac5caa11s',1763192667686,1763192667686);
INSERT INTO board_lists VALUES('cmi45un1l001j8z9b9xvmh7mp','常時運用タスク',0,'cmi45un1l001i8z9bl0500cxk',1763445384489,1763445384489);
INSERT INTO board_lists VALUES('cmi45un1l001k8z9bg053wi66','予定リスト',1,'cmi45un1l001i8z9bl0500cxk',1763445384489,1763445384489);
INSERT INTO board_lists VALUES('cmi45un1l001l8z9boe3qeomj','進行中',2,'cmi45un1l001i8z9bl0500cxk',1763445384489,1763445384489);
INSERT INTO board_lists VALUES('cmi45un1l001m8z9b4vqbouz7','完了',3,'cmi45un1l001i8z9bl0500cxk',1763445384489,1763445384489);
CREATE TABLE IF NOT EXISTS "boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdBy" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "boards_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "boards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO boards VALUES('cmgop2je0000t8zbz7nrf94be','メインボード','メインのタスクボードです','cmgop2j75000b8zbzkegox16k','cmgooy7qa00008zn0cyentjc1',0,1760333424552,1760333424552);
INSERT INTO boards VALUES('cmgopbz22001n8zbzu06oby0q','メインボード','テキスト保存のテスト','cmgopbyv0001f8zbzmilzeztv','cmgooy7qa00008zn0cyentjc1',0,1760333864763,1760408947814);
INSERT INTO boards VALUES('cmgopyibx00058z9syhosgcox','マイボード','個人用のボードです','cmgopyibt00018z9s64s8fvb7','cmgooy7qa00008zn0cyentjc1',0,1760334916173,1760334916173);
INSERT INTO boards VALUES('cmgopyic5000h8z9semeqjzku','マイボード','個人用のボードです','cmgopyic1000d8z9sa7g5o7ui','cmgooy7qc00018zn0f0no9owt',0,1760334916181,1760334916181);
INSERT INTO boards VALUES('cmgopyicb000t8z9swz2h4od9','マイボード','個人用のボードです','cmgopyica000p8z9sdjv6fqms','cmgooy7qd00028zn0ztbkjici',0,1760334916188,1760334916188);
INSERT INTO boards VALUES('cmgopyici00158z9snt2vxhjc','マイボード','個人用のボードです','cmgopyicf00118z9sd9ve8e02','cmgooy7qe00038zn0u1nkq1ls',0,1760334916194,1760334916194);
INSERT INTO boards VALUES('cmgopyicu001h8z9sw2ba3815','マイボード','個人用のボードです','cmgopyicq001d8z9shzmpf1fo','cmgooy7qf00048zn0rzc3ekyr',0,1760334916207,1760334916207);
INSERT INTO boards VALUES('cmgopyid6001t8z9sez23xsot','マイボード','個人用のボードです','cmgopyid3001p8z9sizfcxr9w','cmgooyc3s00008zpighu6ac3f',0,1760334916218,1760334916218);
INSERT INTO boards VALUES('cmgopyidj00258z9sa7b6bmkd','マイボード','個人用のボードです','cmgopyidf00218z9s91n58h96','cmgooyh7200008zsavyswd64d',0,1760334916232,1760334916232);
INSERT INTO boards VALUES('cmgopyidw002h8z9so3xfzwg2','マイボード','個人用のボードです','cmgopyidt002d8z9slcfrapwh','cmgooyh7500058zsa7kxxlq5o',0,1760334916245,1760334916245);
INSERT INTO boards VALUES('cmgopyiea002t8z9suhd8d9dn','マイボード','個人用のボードです','cmgopyie7002p8z9s5bxsbauc','cmgooyh7600088zsar06vq4lj',0,1760334916258,1760334916258);
INSERT INTO boards VALUES('cmgopyiee00358z9spu141r97','マイボード','個人用のボードです','cmgopyiec00318z9s1hv831lc','cmgooyh7700098zsag0i221ar',0,1760334916263,1760334916263);
INSERT INTO boards VALUES('cmgopyif3003h8z9sppfp21y5','マイボード','個人用のボードです','cmgopyif2003d8z9slc2842mu','cmgooyh79000e8zsae0xdczu2',0,1760334916287,1760334916287);
INSERT INTO boards VALUES('cmgopyif6003t8z9sljpiwhq9','マイボード','個人用のボードです','cmgopyif5003p8z9s1e8edzoq','cmgooyh7a000h8zsapdc6r6vj',0,1760334916290,1760334916290);
INSERT INTO boards VALUES('cmgopyif900458z9spcr55wjg','マイボード','個人用のボードです','cmgopyif800418z9s7c5xad3e','cmgooyh7c000i8zsadh770q3z',0,1760334916293,1760334916293);
INSERT INTO boards VALUES('cmgopyifc004h8z9srxcpjb2d','マイボード','個人用のボードです','cmgopyifb004d8z9sjk4zc5p9','cmgooyh7f000p8zsax21pn6we',0,1760334916297,1760334916297);
INSERT INTO boards VALUES('cmgopyig5004t8z9shfjkkkmg','マイボード','個人用のボードです','cmgopyifp004p8z9shyrmyx6v','cmgooyh7f000q8zsasg4ehoku',0,1760334916325,1760334916325);
INSERT INTO boards VALUES('cmgopyigj00558z9slpb7fido','マイボード','個人用のボードです','cmgopyigi00518z9sv01u3x6o','cmgooyh7g000t8zsaquxtzj38',0,1760334916339,1760334916339);
INSERT INTO boards VALUES('cmgopyigm005h8z9slxs3e0sz','マイボード','個人用のボードです','cmgopyigl005d8z9stvorqia1','cmgop95gb001d8zbzi49o1beu',0,1760334916343,1760334916343);
INSERT INTO boards VALUES('cmgoqn6o500218zbzvafwewj5','テスト','','cmgop2j75000b8zbzkegox16k','cmgooy7qa00008zn0cyentjc1',1,1760336067461,1760336067461);
INSERT INTO boards VALUES('cmgor2owk002d8zbz4pr1xdoj','テスト','','cmgopyibt00018z9s64s8fvb7','cmgooy7qa00008zn0cyentjc1',1,1760336790933,1760336790933);
INSERT INTO boards VALUES('cmgorebfp00328zbz07wcbmm8','テスト','','cmgop2j75000b8zbzkegox16k','cmgooy7qa00008zn0cyentjc1',2,1760337333349,1760337333349);
INSERT INTO boards VALUES('cmgorepy2003c8zbzahivczxe','テスト2','','cmgop2j75000b8zbzkegox16k','cmgooy7qa00008zn0cyentjc1',3,1760337352155,1760337352155);
INSERT INTO boards VALUES('cmgpa2k6q000a8z8r0enwco3o','マイボード','個人用のボードです','cmgpa2k6o00068z8r10hrucr3','cmgpa2k6n00048z8ru56ad74d',0,1760368697522,1760368697522);
INSERT INTO boards VALUES('cmgpa5wc0001l8z8rse7ockr6','テストボード','テキスト表示をさせます。何文字まで入れられるかのテストをします。どこで折り返されるのか？折り返されないのかテスト。テキストテキスト','cmgpa5fkd000n8z8r20vyg9nq','cmgooy7qa00008zn0cyentjc1',1,1760368853232,1760408535858);
INSERT INTO boards VALUES('cmgpa76s200208z8r6wcm209o','マイボード','個人用のボードです','cmgpa76rz001w8z8rkerwbnyr','cmgooy7qa00008zn0cyentjc1',0,1760368913427,1762905833530);
INSERT INTO boards VALUES('cmgpae3ed002a8z8rxpyjc4bg','テスト2','','cmgpa5fkd000n8z8r20vyg9nq','cmgooy7qa00008zn0cyentjc1',2,1760369235637,1760369235637);
INSERT INTO boards VALUES('cmgqnmewp000a8z7x2guhmaz5','テストボード','','cmgop2j75000b8zbzkegox16k','cmgooy7qa00008zn0cyentjc1',4,1760451924986,1762905833530);
INSERT INTO boards VALUES('cmhutho5x00058z6hdozrc7ao','メインボード','メインのタスクボードです','cmhutho0100018z6hrwxc97pu','cmgtj2n3o00008zcwnsyk1k4n',0,1762880428437,1762880428437);
INSERT INTO boards VALUES('cmhvb7oga001j8z89bfpfw8hx','マイボード','個人用のボードです','cmhvb7og8001f8z89rpw1ualx','cmhvb7og5001d8z89ho6a33di',0,1762910195339,1762910195339);
INSERT INTO boards VALUES('cmhzzb7tj000n8z0aybzqsyw6','マイボード','個人用のボードです','cmhzzb7tg000j8z0angoteesj','cmhzzb7tf000h8z0a3i13f2z0',0,1763192535895,1763192535895);
INSERT INTO boards VALUES('cmhzzc2sy00198z0aisgpmblm','マイボード','個人用のボードです','cmhzzc2sx00158z0ac9p74vtp','cmhzzc2sv00138z0axtgg3rib',0,1763192576051,1763192576051);
INSERT INTO boards VALUES('cmhzzd5e1001v8z0avxrt4qus','マイボード','個人用のボードです','cmhzzd5e0001r8z0a72zdm9ww','cmhzzd5dy001p8z0anahgcb8c',0,1763192626058,1763192626058);
INSERT INTO boards VALUES('cmhzze1ib002v8z0ac5caa11s','マイボード','個人用のボードです','cmhzze1ia002r8z0aiz8sfkk6','cmhzze1i8002p8z0a6tyddu5n',0,1763192667684,1763192667684);
INSERT INTO boards VALUES('cmi45un1l001i8z9bl0500cxk','テスト','','cmhutho0100018z6hrwxc97pu','cmgtj2n3o00008zcwnsyk1k4n',0,1763445384489,1763445384489);
CREATE TABLE IF NOT EXISTS "card_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "card_members_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "card_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO card_members VALUES('cmgop3f0j00198zbzt6zt4wmn','cmgop2ye300178zbztpkosudl','cmgooy7qa00008zn0cyentjc1','2025-11-11 16:31:59');
INSERT INTO card_members VALUES('cmgop3f0j001a8zbzauocq4zq','cmgop2ye300178zbztpkosudl','cmgooy7qc00018zn0f0no9owt','2025-11-11 16:31:59');
INSERT INTO card_members VALUES('cmgop3f0j001b8zbzls9lqhqh','cmgop2ye300178zbztpkosudl','cmgooy7qd00028zn0ztbkjici','2025-11-11 16:31:59');
INSERT INTO card_members VALUES('cmgop3f0j001c8zbzcg4piwf2','cmgop2ye300178zbztpkosudl','cmgooy7qe00038zn0u1nkq1ls','2025-11-11 16:31:59');
INSERT INTO card_members VALUES('cmgpa3v9b000l8z8rmy9ek2ih','cmgpa3v9b000k8z8rk42bzrw6','cmgooy7qa00008zn0cyentjc1','2025-11-11 16:31:59');
INSERT INTO card_members VALUES('cmgqodw2n000p8z7xcyijnvuo','cmgpuxgty002q8z8r2bcez582','cmgooy7qa00008zn0cyentjc1','2025-11-11 16:31:59');
INSERT INTO card_members VALUES('cmgqodw2n000q8z7xm74yl7wf','cmgpuxgty002q8z8r2bcez582','cmgooy7qc00018zn0f0no9owt','2025-11-11 16:31:59');
INSERT INTO card_members VALUES('cmgqodw2n000r8z7xt06x0byx','cmgpuxgty002q8z8r2bcez582','cmgooy7qd00028zn0ztbkjici','2025-11-11 16:31:59');
INSERT INTO card_members VALUES('cmgqodw2n000s8z7xqe39ipkc','cmgpuxgty002q8z8r2bcez582','cmgooy7qe00038zn0u1nkq1ls','2025-11-11 16:31:59');
INSERT INTO card_members VALUES('cmhvaxd7q000l8z89vwp536ru','cmhvawnel000g8z89gfbhxe9d','cmgpa2k6n00048z8ru56ad74d',1762909714214);
INSERT INTO card_members VALUES('cmi1nwzur003k8z0as6june4z','cmhvccy8t004j8z89vgv5k5wv','cmgpa2k6n00048z8ru56ad74d',1763294328964);
INSERT INTO card_members VALUES('cmi1nwzur003l8z0ae1p966pk','cmhvccy8t004j8z89vgv5k5wv','cmgtj2n3o00008zcwnsyk1k4n',1763294328964);
INSERT INTO card_members VALUES('cmi1nwzur003m8z0abe6c1nsz','cmhvccy8t004j8z89vgv5k5wv','cmhvb7og5001d8z89ho6a33di',1763294328964);
CREATE TABLE IF NOT EXISTS "cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "listId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdBy" TEXT,
    "attachments" JSONB,
    "labels" JSONB,
    "checklists" JSONB,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "cardColor" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cards_listId_fkey" FOREIGN KEY ("listId") REFERENCES "board_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cards_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO cards VALUES('cmgop2ye300178zbztpkosudl','テスト1','テスト',0,'cmgop2je0000v8zbze18mgtxn','cmgop2je0000t8zbz7nrf94be','cmgooy7qa00008zn0cyentjc1','[]','[]','[]',NULL,'medium','todo',NULL,0,1760333443995,1760333465540);
INSERT INTO cards VALUES('cmgpa3v9b000k8z8rk42bzrw6','テストカード','テスト用のカード',0,'d6df5920-2b4d-4b2a-9152-7f8db07bc718','cmgopbz22001n8zbzu06oby0q','cmgooy7qa00008zn0cyentjc1',NULL,NULL,NULL,NULL,'medium','todo',NULL,0,1760368758527,1760368758527);
INSERT INTO cards VALUES('cmgpuxgty002q8z8r2bcez582','テスト','',0,'cmgpa5wc0001n8z8rbmlyokdp','cmgpa5wc0001l8z8rse7ockr6','cmgooy7qa00008zn0cyentjc1','[{"id":"cmgqodqp0000o8z7xqquze5p8","name":"無題のドキュメント.docx","type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","uploadDate":"2025-10-14","size":"11.65 KB","folderName":"資料"}]','[{"id":"label-5","name":"改善","color":"#10b981"}]','[]',1761145200000,'medium','todo','#d7f9f7',0,1760403731831,1760453206944);
INSERT INTO cards VALUES('cmgqnmn7t000g8z7xexdi6i9q','テスト','',0,'cmgqnmewp000c8z7xka590n8d','cmgqnmewp000a8z7x2guhmaz5','cmgooy7qa00008zn0cyentjc1','[{"id":"cmgqnouho000i8z7xtfrpzzp3","name":"070926_4.pdf","type":"application/pdf","uploadDate":"2025-10-14","size":"84.32 KB","folderName":"資料"}]','[{"id":"label-3","name":"バグ","color":"#dc2626"}]','[]',1760886000000,'medium','scheduled','#f8fdd3',0,1760451935754,1762905833530);
INSERT INTO cards VALUES('cmhvawnel000g8z89gfbhxe9d','test','test',1,'cmgpa5wc0001n8z8rbmlyokdp','cmgpa5wc0001l8z8rse7ockr6','cmgpa2k6n00048z8ru56ad74d','[{"id":"cmhvax7gi000k8z89kc5nilcw","name":"workflow エクセル.xlsx","type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","uploadDate":"2025-11-12","size":"30.5 KB","folderName":"資料"},{"id":"_folders_metadata","type":"_metadata","folders":["資料","画像","参考資料"],"isMetadata":true}]','[{"id":"label-1","name":"販促関係","color":"#3b82f6"}]','[]',NULL,'B','in-progress','#e7f5fd',0,1762909680766,1762909714215);
INSERT INTO cards VALUES('cmhvccy8t004j8z89vgv5k5wv','test','teste',0,'cmhutho5x00088z6hgb515s1y','cmhutho5x00058z6hdozrc7ao','cmgtj2n3o00008zcwnsyk1k4n','[{"id":"cmhvcdgxj004n8z89a4chin6j","name":"workflow エクセル.xlsx","type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","uploadDate":"2025-11-12","size":"30.5 KB","folderName":"資料"},{"id":"_folders_metadata","type":"_metadata","folders":["資料","画像","参考資料"],"isMetadata":true}]','[{"id":"label-2","name":"求人関係","color":"#06b6d4"}]','[{"id":"checklist-1762912132547","title":"test","items":[{"id":"item-1762912135517","text":"ssssss","completed":false},{"id":"item-1762912141907","text":"44444446666","completed":true},{"id":"item-1763294325012","text":"333","completed":false}]}]',NULL,'A','scheduled','#ebeccb',0,1762912120925,1763294328965);
CREATE TABLE IF NOT EXISTS "convenience_entry_urls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "convenience_entry_urls_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "convenience_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO convenience_entry_urls VALUES('cmhuti7gr000g8z6hvafj2ris','cmhuti7gr000f8z6h1no8dkds','https://www.sooken.com/',NULL,0,1762880453451,1762880453451);
INSERT INTO convenience_entry_urls VALUES('cmhvnr9z6000i8z9r8fiavxu1','cmhvnr9z6000h8z9rqz9tfd69','https://example.com','テスト',0,1762931265091,1762931265091);
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
    "avatar" TEXT,
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
    "privacyBirthDate" BOOLEAN NOT NULL DEFAULT false,
    "orgChartLabel" TEXT,
    "description" TEXT,
    "employmentType" TEXT,
    "weeklyPattern" INTEGER,
    "configVersion" TEXT,
    "vacationPattern" TEXT
, "orgChartOrder" INTEGER);
INSERT INTO employees VALUES('cmgooy7qa00008zn0cyentjc1','EMP-2015-001','EMP-2015-001','employee','admin',NULL,'admin@company.com','090-0000-0000','["総務・管理者"]','["システム管理者"]','["株式会社テックイノベーション"]','システム管理',1420070400000,'active','admin','admin',NULL,'','','','','','',NULL,NULL,1760333222819,1760429742682,0,'cmgpa76rw001u8z8rmp7qynn1',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgooy7qc00018zn0f0no9owt','EMP-2015-002','EMP-2015-002','employee','mane','マネージャー','manager@company.com','090-0000-0001','["総務・管理者"]','["管理者"]','["株式会社テックイノベーション"]','管理',1420070400000,'suspended','mane','manager',NULL,'','','','','','',NULL,NULL,1760333222821,1760429770884,0,'cmgooy7qa00008zn0cyentjc1',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgooy7qd00028zn0ztbkjici','EMP-2016-001','EMP-2016-001','employee','sub',NULL,'sub@company.com','090-0000-0002','["営業部"]','["サブマネージャー"]','["株式会社テックイノベーション"]','営業',1451606400000,'suspended','sub','sub_manager',NULL,'','','','','','',NULL,NULL,1760333222822,1760429757190,0,'cmgooy7qf00048zn0rzc3ekyr',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgooy7qe00038zn0u1nkq1ls','EMP-2017-001','EMP-2017-001','employee','ippan',NULL,'ippan@company.com','090-0000-0003','["営業部"]','["一般社員"]','["株式会社テックイノベーション"]','営業',1483228800000,'suspended','ippan','general',NULL,'','','','','','',NULL,NULL,1760333222823,1760429750227,0,'cmgooy7qc00018zn0f0no9owt',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgooy7qf00048zn0rzc3ekyr','EMP-2018-001','EMP-2018-001','employee','etsuran',NULL,'etsuran@company.com','090-0000-0004','["総務部"]','["閲覧者"]','["株式会社テックイノベーション"]','総務',1514764800000,'suspended','etsuran','viewer',NULL,'','','','','','',NULL,NULL,1760333222823,1760429730253,0,'cmgooy7qa00008zn0cyentjc1',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgooyc3s00008zpighu6ac3f','EMP-TOP-000','000','employee','見えないTOP',NULL,'invisible-top@company.com','','経営','未設定','株式会社テックイノベーション',NULL,1577836800000,'active','invisible-top-secure-password-2024','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1760333228489,1760333228489,1,NULL,1,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgooyh7200008zsavyswd64d','EMP001','101','業務委託','田中',NULL,'tanaka@company.com','090-1234-5678','["営業部"]','["営業部長"]','["株式会社テックイノベーション"]',NULL,1585699200000,'active','111','general','123456789012','tanaka','tanaka.company.com','東京都渋谷区1-1-1','営業部を統括し、新規開拓を担当しています。','1234','090-1234-5678',479692800000,NULL,1760333235086,1763436340475,1,'cmgooyh7500058zsa7kxxlq5o',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgooyh7500058zsa7kxxlq5o','EMP002','102','正社員','佐藤花子',NULL,'sato@company.com','090-2345-6789','["開発部"]','["シニアエンジニア"]','["株式会社テックイノベーション"]',NULL,1561939200000,'active','password123','general','234567890123','sato','sato.company.com','東京都新宿区2-2-2','ReactとTypeScriptを専門としています。','2345','090-2345-6789',660355200000,NULL,1760333235089,1763061375499,1,'cmgooyh79000e8zsae0xdczu2',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,'1.0.0','A',2);
INSERT INTO employees VALUES('cmgooyh7600088zsar06vq4lj','EMP003','103','パートタイム','鈴木健太',NULL,'suzuki@company.com','090-3456-7890','["開発部"]','["エンジニア"]','["株式会社テックイノベーション"]',NULL,1610668800000,'active','suzuki','general','345678901234','suzuki','suzuki.company.com','東京都品川区3-3-3','Node.jsとPythonが得意です。','3456','090-3456-7890',800928000000,NULL,1760333235090,1763061375499,1,'cmgooyh79000e8zsae0xdczu2',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO employees VALUES('cmgooyh7700098zsag0i221ar','EMP004','104','正社員','高橋美咲',NULL,'takahashi@company.com','090-4567-8901','["人事部"]','["人事部長"]','["株式会社テックイノベーション"]',NULL,1519862400000,'active','password123','hr','456789012345','takahashi','takahashi.company.com','東京都世田谷区4-4-4','人事戦略と組織開発を担当しています。','4567','090-4567-8901',437443200000,NULL,1760333235091,1763061375492,1,'cmgooyh79000e8zsae0xdczu2',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,'1.0.0','A',0);
INSERT INTO employees VALUES('cmgooyh79000e8zsae0xdczu2','EMP005','105','正社員','山田次郎',NULL,'yamada@company.com','090-5678-9012','["営業部"]','["営業マネージャー"]','["株式会社テックイノベーション"]',NULL,1590969600000,'active','password123','manager','567890123456','yamada','yamada.company.com','東京都目黒区5-5-5','中小企業向け営業を担当しています。','5678','090-5678-9012',559958400000,NULL,1760333235093,1763061273088,1,'cmgtj2n3o00008zcwnsyk1k4n',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,'1.0.0','A',0);
INSERT INTO employees VALUES('cmgooyh7a000h8zsapdc6r6vj','EMP006','106','正社員','伊藤麻衣',NULL,'ito@company.com','090-6789-0123','["開発部"]','["デザイナー"]','["株式会社テックイノベーション"]',NULL,1617235200000,'active','password123','general','678901234567','ito','ito.company.com','東京都中野区6-6-6','ユーザーエクスペリエンスデザインを専門としています。','6789','090-6789-0123',698025600000,NULL,1760333235094,1763059777230,1,'cmgq7noea00008zw1s5plsdha',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,4,'1.0.0','B-4',NULL);
INSERT INTO employees VALUES('cmgooyh7c000i8zsadh770q3z','EMP007','107','正社員','渡辺直樹',NULL,'watanabe@company.com','090-7890-1234','["総務部"]','["総務部長"]','["株式会社テックイノベーション"]',NULL,1501545600000,'active','password123','hr','789012345678','watanabe','watanabe.company.com','東京都杉並区7-7-7','会社の運営管理を担当しています。','7890','090-7890-1234',360374400000,NULL,1760333235097,1762906062290,1,'cmgq7noea00008zw1s5plsdha',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,'1.0.0','A',NULL);
INSERT INTO employees VALUES('cmgooyh7f000p8zsax21pn6we','EMP008','108','外注先','小林',NULL,'kobayashi@company.com','090-8901-2345','["営業部"]','["営業"]','["株式会社テックイノベーション"]',NULL,1646092800000,'active','111','general','890123456789','kobayashi','kobayashi.company.com','東京都練馬区8-8-8','大企業向け営業を担当しています。','8901','090-8901-2345',777081600000,NULL,1760333235099,1763436325363,1,'cmgooyh7c000i8zsadh770q3z',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgooyh7f000q8zsasg4ehoku','EMP009','109','employee','加藤由美',NULL,'kato@company.com','090-9012-3456','["経理部"]','["経理部長"]','["株式会社テックイノベーション"]','経理',1546819200000,'suspended','password123','manager','901234567890','kato','kato.company.com','東京都板橋区9-9-9','財務管理と経理業務を統括しています。','9012','090-9012-3456',536112000000,NULL,1760333235100,1760429502767,1,'cmgooy7qa00008zn0cyentjc1',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgooyh7g000t8zsaquxtzj38','EMP010','110','正社員','森田大輔',NULL,'morita@company.com','090-0123-4567','["開発部"]','["テックリード"]','["株式会社テックイノベーション"]',NULL,1535760000000,'active','password123','manager','012345678901','morita','morita.company.com','東京都江東区10-10-10','インフラストラクチャとDevOpsを担当しています。','0123','090-0123-4567',615513600000,NULL,1760333235101,1762906131976,1,'cmgooyh7c000i8zsadh770q3z',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,'1.0.0','A',NULL);
INSERT INTO employees VALUES('cmgop95gb001d8zbzi49o1beu','EMP-1760333733082','EMP-1760333733082','employee','somu','ソウム',NULL,'','["[]"]','["[]"]','["[]"]','',1760313600000,'suspended','somu','hr',NULL,'','','','','','',NULL,NULL,1760333733083,1760429764627,0,'cmgq7noea00008zw1s5plsdha',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgpa2k6n00048z8ru56ad74d','TEST-001','TEST-001','派遣社員','test',NULL,NULL,NULL,'["テスト部"]','["テスト役職"]','["テスト組織"]',NULL,1735689600000,'active','test','general',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1760368697519,1763060096303,1,'cmgooyh7600088zsar06vq4lj',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmgq7noea00008zw1s5plsdha','EMP-1760368913419-COPY-1760425110082','EMP-1760368913419-COPY-1760425110082','employee','大澤仁志','オオサワヒトシ',NULL,'0823278787','[]','[]','["株式会社オオサワ創研"]',NULL,1760368913419,'copy','sawa',NULL,NULL,NULL,NULL,'6-4',NULL,NULL,NULL,NULL,NULL,1760425110083,1763061273092,1,'cmgtj2n3o00008zcwnsyk1k4n',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,'コピー',NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO employees VALUES('cmgtj2n3o00008zcwnsyk1k4n','EMP-2015-003','001','正社員','大澤仁志','オオサワヒトシ','ohsawa1104@gmail.com','0823-27-8787','[執行部]','[代表]','[株式会社オオサワ創研]',NULL,'2015-04-01 00:00:00','active','sawa','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-11 16:07:50','2025-11-11 16:07:50',1,'cmhgfal4b00008ehyb2e26c48',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmhvb7og5001d8z89ho6a33di','EMP-1762910195332','EMP-1762910195332','パートタイム','ippan','イッパン',NULL,NULL,'["[]"]','["[]"]','["[]"]',NULL,1762905600000,'active','ippan','general',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1762910195334,1762910508144,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmhzzb7tf000h8z0a3i13f2z0','EMP-1763192535890','EMP-1763192535890','正社員','ten','テンチョウ',NULL,NULL,'["[]"]','["[]"]','["[]"]',NULL,1763164800000,'active','ten','store_manager',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1763192535891,1763192632813,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmhzzc2sv00138z0axtgg3rib','98887','98887','正社員','sub','サブ',NULL,NULL,'["[]"]','["[]"]','["[]"]',NULL,1763164800000,'active','sub','sub_manager',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1763192576048,1763192641653,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmhzzd5dy001p8z0anahgcb8c','74','74','正社員','mane','マネ',NULL,NULL,'[]','[]','[]',NULL,1763192626053,'active','mane','manager',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1763192626054,1763192626054,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmhzze1i8002p8z0a6tyddu5n','EMP-1763192667679','EMP-1763192667679','正社員','somu','ソウム',NULL,NULL,'[]','[]','[]',NULL,1763192667679,'active','somu','hr',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1763192667680,1763192667680,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE IF NOT EXISTS "evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "evaluator" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "evaluations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "family_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "birthDate" DATETIME,
    "phone" TEXT,
    "address" TEXT,
    "myNumber" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "family_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO family_members VALUES('cmgqa9ttf00028zw1zodftpl6','cmgooyh7f000q8zsasg4ehoku','加藤雄一','夫',NULL,'090-9012-3457','東京都板橋区9-9-9','901234567891',NULL,1760429502771,1760429502771);
INSERT INTO family_members VALUES('cmhv8mjmy000h8z6h6uhmnb55','cmgooyh7700098zsag0i221ar','高橋正義','夫',NULL,'090-4567-8902','東京都世田谷区4-4-4','456789012346',NULL,1762905850091,1762905850091);
INSERT INTO family_members VALUES('cmhv8mjmy000i8z6hlvgy8sod','cmgooyh7700098zsag0i221ar','高橋みどり','娘',NULL,NULL,'東京都世田谷区4-4-4',NULL,NULL,1762905850091,1762905850091);
INSERT INTO family_members VALUES('cmhv8mttv000q8z6hjfg84u1r','cmgooyh7500058zsa7kxxlq5o','佐藤一郎','夫',NULL,'090-2345-6790','東京都新宿区2-2-2','234567890124',NULL,1762905863299,1762905863299);
INSERT INTO family_members VALUES('cmhv8n6op000y8z6h4lh508wv','cmgooyh79000e8zsae0xdczu2','山田恵子','妻',NULL,'090-5678-9013','東京都目黒区5-5-5','567890123457',NULL,1762905879962,1762905879962);
INSERT INTO family_members VALUES('cmhv8nr73001m8z6h11ogh09j','cmgooyh7c000i8zsadh770q3z','渡辺真理','妻',NULL,'090-7890-1235','東京都杉並区7-7-7','789012345679',NULL,1762905906544,1762905906544);
INSERT INTO family_members VALUES('cmhv8nr73001n8z6h12nzi6sy','cmgooyh7c000i8zsadh770q3z','渡辺拓也','息子',NULL,NULL,'東京都杉並区7-7-7',NULL,NULL,1762905906544,1762905906544);
INSERT INTO family_members VALUES('cmhv8nr74001o8z6hk07h5h4r','cmgooyh7c000i8zsadh770q3z','渡辺由香','娘',NULL,NULL,'東京都杉並区7-7-7',NULL,NULL,1762905906544,1762905906544);
INSERT INTO family_members VALUES('cmhv8pf6700238z6huq84fndz','cmgooyh7g000t8zsaquxtzj38','森田さくら','妻',NULL,'090-0123-4568','東京都江東区10-10-10','012345678902',NULL,1762905984271,1762905984271);
INSERT INTO family_members VALUES('cmhv8pf6700248z6hhtgkswbu','cmgooyh7g000t8zsaquxtzj38','森田翔太','息子',NULL,NULL,'東京都江東区10-10-10',NULL,NULL,1762905984271,1762905984271);
INSERT INTO family_members VALUES('cmi40gsn100188z9bbzwesw7z','cmgooyh7200008zsavyswd64d','田中花子','妻',NULL,'090-1234-5679','東京都渋谷区1-1-1','123456789013',NULL,1763436340477,1763436340477);
INSERT INTO family_members VALUES('cmi40gsn100198z9bkqux2a2j','cmgooyh7200008zsavyswd64d','田中次郎','息子',NULL,NULL,'東京都渋谷区1-1-1',NULL,NULL,1763436340477,1763436340477);
CREATE TABLE IF NOT EXISTS "files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT,
    "s3Key" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "folderName" TEXT,
    "taskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "files_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO files VALUES('cmhvax7gi000k8z89kc5nilcw','cmgpa2k6n00048z8ru56ad74d','workflow エクセル.xlsx','1762909706565_workflow エクセル.xlsx','cmgpa2k6n00048z8ru56ad74d/task/1762909706565_workflow エクセル.xlsx',NULL,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',31229,'task','資料',NULL,1762909706754);
INSERT INTO files VALUES('cmhvb69am001a8z89btdz9rdv','cmgpa2k6n00048z8ru56ad74d','workflow エクセル.xlsx','1762910128878_workflow エクセル.xlsx','cmgpa2k6n00048z8ru56ad74d/payroll/1762910128878_workflow エクセル.xlsx',NULL,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',31229,'payroll','2025年-11月',NULL,1762910129038);
INSERT INTO files VALUES('cmhvcdgxj004n8z89a4chin6j','cmgtj2n3o00008zcwnsyk1k4n','workflow エクセル.xlsx','1762912144984_workflow エクセル.xlsx','cmgtj2n3o00008zcwnsyk1k4n/task/1762912144984_workflow エクセル.xlsx',NULL,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',31229,'task','資料',NULL,1762912145143);
CREATE TABLE IF NOT EXISTS "folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "folders_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "folders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "payroll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "employeeId" TEXT NOT NULL,
    CONSTRAINT "tasks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "workspace_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO workspace_members VALUES('cmgop2j76000d8zbz8axt7t9s','cmgop2j75000b8zbzkegox16k','cmgooy7qa00008zn0cyentjc1','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000e8zbzqctcpb1r','cmgop2j75000b8zbzkegox16k','cmgooyh7g000t8zsaquxtzj38','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000f8zbz0idywv04','cmgop2j75000b8zbzkegox16k','cmgooyh7f000q8zsasg4ehoku','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000g8zbzqibyta9r','cmgop2j75000b8zbzkegox16k','cmgooyh7f000p8zsax21pn6we','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000h8zbzbb1fzxle','cmgop2j75000b8zbzkegox16k','cmgooyh7a000h8zsapdc6r6vj','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000i8zbz5ahxeiww','cmgop2j75000b8zbzkegox16k','cmgooyh7c000i8zsadh770q3z','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000j8zbzucq0ic8u','cmgop2j75000b8zbzkegox16k','cmgooyh79000e8zsae0xdczu2','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000k8zbzv885xnpn','cmgop2j75000b8zbzkegox16k','cmgooyh7700098zsag0i221ar','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000l8zbza0pcd3n1','cmgop2j75000b8zbzkegox16k','cmgooyh7600088zsar06vq4lj','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000m8zbzdj4ain51','cmgop2j75000b8zbzkegox16k','cmgooyh7500058zsa7kxxlq5o','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000n8zbz6d5s9eqr','cmgop2j75000b8zbzkegox16k','cmgooyh7200008zsavyswd64d','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000o8zbz59c0ojfq','cmgop2j75000b8zbzkegox16k','cmgooy7qe00038zn0u1nkq1ls','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000p8zbzdb3le315','cmgop2j75000b8zbzkegox16k','cmgooy7qf00048zn0rzc3ekyr','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000q8zbzkobi8aqa','cmgop2j75000b8zbzkegox16k','cmgooy7qd00028zn0ztbkjici','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgop2j76000r8zbzxqse1u4z','cmgop2j75000b8zbzkegox16k','cmgooy7qc00018zn0f0no9owt','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopbyv0001h8zbz83j83gep','cmgopbyv0001f8zbzmilzeztv','cmgooy7qa00008zn0cyentjc1','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopbyv0001i8zbzmopr4flh','cmgopbyv0001f8zbzmilzeztv','cmgop95gb001d8zbzi49o1beu','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopbyv0001j8zbz1rdfu1t0','cmgopbyv0001f8zbzmilzeztv','cmgooy7qf00048zn0rzc3ekyr','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopbyv0001k8zbz7prj7nri','cmgopbyv0001f8zbzmilzeztv','cmgooy7qd00028zn0ztbkjici','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopbyv0001l8zbzlqx91mwj','cmgopbyv0001f8zbzmilzeztv','cmgooy7qc00018zn0f0no9owt','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyibv00038z9sbkdg6u3n','cmgopyibt00018z9s64s8fvb7','cmgooy7qa00008zn0cyentjc1','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyic3000f8z9syql2n9c8','cmgopyic1000d8z9sa7g5o7ui','cmgooy7qc00018zn0f0no9owt','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyicb000r8z9si3zugcm9','cmgopyica000p8z9sdjv6fqms','cmgooy7qd00028zn0ztbkjici','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyicg00138z9sr5fepnjb','cmgopyicf00118z9sd9ve8e02','cmgooy7qe00038zn0u1nkq1ls','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyics001f8z9s0l202gwa','cmgopyicq001d8z9shzmpf1fo','cmgooy7qf00048zn0rzc3ekyr','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyid4001r8z9sx1s5oca0','cmgopyid3001p8z9sizfcxr9w','cmgooyc3s00008zpighu6ac3f','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyidh00238z9sc0d9nwp6','cmgopyidf00218z9s91n58h96','cmgooyh7200008zsavyswd64d','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyidv002f8z9sv4shcin7','cmgopyidt002d8z9slcfrapwh','cmgooyh7500058zsa7kxxlq5o','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyie8002r8z9s05qjtb1j','cmgopyie7002p8z9s5bxsbauc','cmgooyh7600088zsar06vq4lj','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyiee00338z9sk8y1bq94','cmgopyiec00318z9s1hv831lc','cmgooyh7700098zsag0i221ar','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyif2003f8z9s49ob526s','cmgopyif2003d8z9slc2842mu','cmgooyh79000e8zsae0xdczu2','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyif5003r8z9ss2sfeug1','cmgopyif5003p8z9s1e8edzoq','cmgooyh7a000h8zsapdc6r6vj','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyif800438z9s00o5zfl6','cmgopyif800418z9s7c5xad3e','cmgooyh7c000i8zsadh770q3z','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyifc004f8z9su4hmjdah','cmgopyifb004d8z9sjk4zc5p9','cmgooyh7f000p8zsax21pn6we','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyig3004r8z9sj8db952w','cmgopyifp004p8z9shyrmyx6v','cmgooyh7f000q8zsasg4ehoku','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyigj00538z9svvhuqulm','cmgopyigi00518z9sv01u3x6o','cmgooyh7g000t8zsaquxtzj38','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgopyigm005f8z9sr3s35dy4','cmgopyigl005d8z9stvorqia1','cmgop95gb001d8zbzi49o1beu','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgoqpd4a002a8zbzul9yh31o','cmgopbyv0001f8zbzmilzeztv','cmgooyh7g000t8zsaquxtzj38','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgoqpd4a002b8zbzczxxv8ed','cmgopbyv0001f8zbzmilzeztv','cmgooyh7f000q8zsasg4ehoku','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa2k6p00088z8rq2a2alzb','cmgpa2k6o00068z8r10hrucr3','cmgpa2k6n00048z8ru56ad74d','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000p8z8rq11ycqn0','cmgpa5fkd000n8z8r20vyg9nq','cmgooy7qa00008zn0cyentjc1','workspace_admin','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000q8z8rhmwcps33','cmgpa5fkd000n8z8r20vyg9nq','cmgpa2k6n00048z8ru56ad74d','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000r8z8rx0h77f8u','cmgpa5fkd000n8z8r20vyg9nq','cmgop95gb001d8zbzi49o1beu','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000s8z8r9aabn8m9','cmgpa5fkd000n8z8r20vyg9nq','cmgooyh7g000t8zsaquxtzj38','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000t8z8rm199elzq','cmgpa5fkd000n8z8r20vyg9nq','cmgooyh7f000q8zsasg4ehoku','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000u8z8roqmrhw11','cmgpa5fkd000n8z8r20vyg9nq','cmgooy7qc00018zn0f0no9owt','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000v8z8r9q8fhru6','cmgpa5fkd000n8z8r20vyg9nq','cmgooy7qd00028zn0ztbkjici','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000w8z8r4c48kpzz','cmgpa5fkd000n8z8r20vyg9nq','cmgooy7qf00048zn0rzc3ekyr','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000x8z8rgk6u12xf','cmgpa5fkd000n8z8r20vyg9nq','cmgooy7qe00038zn0u1nkq1ls','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000y8z8r15qj0qf2','cmgpa5fkd000n8z8r20vyg9nq','cmgooyh7500058zsa7kxxlq5o','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd000z8z8rqm8e06nc','cmgpa5fkd000n8z8r20vyg9nq','cmgooyh7200008zsavyswd64d','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd00108z8rmisagh2x','cmgpa5fkd000n8z8r20vyg9nq','cmgooyh7600088zsar06vq4lj','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd00118z8rs2ek7r2a','cmgpa5fkd000n8z8r20vyg9nq','cmgooyh7700098zsag0i221ar','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd00128z8reeflx5ih','cmgpa5fkd000n8z8r20vyg9nq','cmgooyh79000e8zsae0xdczu2','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd00138z8rsj0fnak1','cmgpa5fkd000n8z8r20vyg9nq','cmgooyh7a000h8zsapdc6r6vj','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd00148z8r4zjxgt1q','cmgpa5fkd000n8z8r20vyg9nq','cmgooyh7c000i8zsadh770q3z','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmgpa5fkd00158z8rqajd4yjt','cmgpa5fkd000n8z8r20vyg9nq','cmgooyh7f000p8zsax21pn6we','workspace_member','2025-11-11 16:31:59');
INSERT INTO workspace_members VALUES('cmhutho0100038z6ha9ao42ww','cmhutho0100018z6hrwxc97pu','cmgtj2n3o00008zcwnsyk1k4n','admin',1762880428225);
INSERT INTO workspace_members VALUES('cmhvb7og9001h8z89hv4e1j4c','cmhvb7og8001f8z89rpw1ualx','cmhvb7og5001d8z89ho6a33di','workspace_admin',1762910195338);
INSERT INTO workspace_members VALUES('cmhvccs5b00458z89p96lagso','cmhutho0100018z6hrwxc97pu','cmhvb7og5001d8z89ho6a33di','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhvccs5b00468z89cax3gmzz','cmhutho0100018z6hrwxc97pu','cmgooyh7g000t8zsaquxtzj38','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhvccs5b00478z89h53yv97b','cmhutho0100018z6hrwxc97pu','cmgpa2k6n00048z8ru56ad74d','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhvccs5b00488z89lpjbaab9','cmhutho0100018z6hrwxc97pu','cmgooyh7f000p8zsax21pn6we','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhvccs5b00498z89lv8o5a74','cmhutho0100018z6hrwxc97pu','cmgooyh7c000i8zsadh770q3z','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhvccs5b004a8z895vl7sy78','cmhutho0100018z6hrwxc97pu','cmgooyh7a000h8zsapdc6r6vj','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhvccs5b004b8z89k4r2qgsj','cmhutho0100018z6hrwxc97pu','cmgooyh79000e8zsae0xdczu2','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhvccs5b004c8z89f99pmubn','cmhutho0100018z6hrwxc97pu','cmgooyh7700098zsag0i221ar','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhvccs5b004d8z892ko2z5yo','cmhutho0100018z6hrwxc97pu','cmgooyh7600088zsar06vq4lj','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhvccs5b004e8z89afm9op0f','cmhutho0100018z6hrwxc97pu','cmgooyh7500058zsa7kxxlq5o','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhvccs5b004f8z89hc87g1gn','cmhutho0100018z6hrwxc97pu','cmgooyh7200008zsavyswd64d','workspace_member',1762912113023);
INSERT INTO workspace_members VALUES('cmhzzb7ti000l8z0aqz45x7s7','cmhzzb7tg000j8z0angoteesj','cmhzzb7tf000h8z0a3i13f2z0','workspace_admin',1763192535894);
INSERT INTO workspace_members VALUES('cmhzzc2sy00178z0acfhbisym','cmhzzc2sx00158z0ac9p74vtp','cmhzzc2sv00138z0axtgg3rib','workspace_admin',1763192576050);
INSERT INTO workspace_members VALUES('cmhzzd5e1001t8z0agzjymdlg','cmhzzd5e0001r8z0a72zdm9ww','cmhzzd5dy001p8z0anahgcb8c','workspace_admin',1763192626057);
INSERT INTO workspace_members VALUES('cmhzze1ib002t8z0a5rske54y','cmhzze1ia002r8z0aiz8sfkk6','cmhzze1i8002p8z0a6tyddu5n','workspace_admin',1763192667683);
CREATE TABLE IF NOT EXISTS "workspaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workspaces_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO workspaces VALUES('cmgop2j75000b8zbzkegox16k','会社全体ワークスペース','','cmgooy7qa00008zn0cyentjc1',1760333424306,1760423920890);
INSERT INTO workspaces VALUES('cmgopbyv0001f8zbzmilzeztv','1テストワークスペース','テキスト表示保存のテストテスト','cmgooy7qa00008zn0cyentjc1',1760333864508,1760408959627);
INSERT INTO workspaces VALUES('cmgopyibt00018z9s64s8fvb7','adminのマイワークスペース','個人用のワークスペースです','cmgooy7qa00008zn0cyentjc1',1760334916169,1760334916169);
INSERT INTO workspaces VALUES('cmgopyic1000d8z9sa7g5o7ui','maneのマイワークスペース','個人用のワークスペースです','cmgooy7qc00018zn0f0no9owt',1760334916177,1760334916177);
INSERT INTO workspaces VALUES('cmgopyica000p8z9sdjv6fqms','subのマイワークスペース','個人用のワークスペースです','cmgooy7qd00028zn0ztbkjici',1760334916187,1760334916187);
INSERT INTO workspaces VALUES('cmgopyicf00118z9sd9ve8e02','ippanのマイワークスペース','個人用のワークスペースです','cmgooy7qe00038zn0u1nkq1ls',1760334916191,1760334916191);
INSERT INTO workspaces VALUES('cmgopyicq001d8z9shzmpf1fo','etsuranのマイワークスペース','個人用のワークスペースです','cmgooy7qf00048zn0rzc3ekyr',1760334916203,1760334916203);
INSERT INTO workspaces VALUES('cmgopyid3001p8z9sizfcxr9w','見えないTOPのマイワークスペース','個人用のワークスペースです','cmgooyc3s00008zpighu6ac3f',1760334916215,1760334916215);
INSERT INTO workspaces VALUES('cmgopyidf00218z9s91n58h96','田中太郎のマイワークスペース','個人用のワークスペースです','cmgooyh7200008zsavyswd64d',1760334916227,1760334916227);
INSERT INTO workspaces VALUES('cmgopyidt002d8z9slcfrapwh','佐藤花子のマイワークスペース','個人用のワークスペースです','cmgooyh7500058zsa7kxxlq5o',1760334916242,1760334916242);
INSERT INTO workspaces VALUES('cmgopyie7002p8z9s5bxsbauc','鈴木健太のマイワークスペース','個人用のワークスペースです','cmgooyh7600088zsar06vq4lj',1760334916255,1760334916255);
INSERT INTO workspaces VALUES('cmgopyiec00318z9s1hv831lc','高橋美咲のマイワークスペース','個人用のワークスペースです','cmgooyh7700098zsag0i221ar',1760334916261,1760334916261);
INSERT INTO workspaces VALUES('cmgopyif2003d8z9slc2842mu','山田次郎のマイワークスペース','個人用のワークスペースです','cmgooyh79000e8zsae0xdczu2',1760334916286,1760334916286);
INSERT INTO workspaces VALUES('cmgopyif5003p8z9s1e8edzoq','伊藤麻衣のマイワークスペース','個人用のワークスペースです','cmgooyh7a000h8zsapdc6r6vj',1760334916289,1760334916289);
INSERT INTO workspaces VALUES('cmgopyif800418z9s7c5xad3e','渡辺直樹のマイワークスペース','個人用のワークスペースです','cmgooyh7c000i8zsadh770q3z',1760334916292,1760334916292);
INSERT INTO workspaces VALUES('cmgopyifb004d8z9sjk4zc5p9','小林智也のマイワークスペース','個人用のワークスペースです','cmgooyh7f000p8zsax21pn6we',1760334916295,1760334916295);
INSERT INTO workspaces VALUES('cmgopyifp004p8z9shyrmyx6v','加藤由美のマイワークスペース','個人用のワークスペースです','cmgooyh7f000q8zsasg4ehoku',1760334916309,1760334916309);
INSERT INTO workspaces VALUES('cmgopyigi00518z9sv01u3x6o','森田大輔のマイワークスペース','個人用のワークスペースです','cmgooyh7g000t8zsaquxtzj38',1760334916338,1760334916338);
INSERT INTO workspaces VALUES('cmgopyigl005d8z9stvorqia1','somuのマイワークスペース','個人用のワークスペースです','cmgop95gb001d8zbzi49o1beu',1760334916342,1760334916342);
INSERT INTO workspaces VALUES('cmgpa2k6o00068z8r10hrucr3','テスト社員のマイワークスペース','個人用のワークスペースです','cmgpa2k6n00048z8ru56ad74d',1760368697521,1760368697521);
INSERT INTO workspaces VALUES('cmgpa5fkd000n8z8r20vyg9nq','テスト',replace('説明欄のテキスト表示\nテスト','\n',char(10)),'cmgooy7qa00008zn0cyentjc1',1760368831501,1760408466195);
INSERT INTO workspaces VALUES('cmgpa76rz001w8z8rkerwbnyr','大澤仁志のマイワークスペース','個人用のワークスペースです','cmgooy7qa00008zn0cyentjc1',1760368913423,1762905833529);
INSERT INTO workspaces VALUES('cmhutho0100018z6hrwxc97pu','test','tess','cmgtj2n3o00008zcwnsyk1k4n',1762880428225,1762912113024);
INSERT INTO workspaces VALUES('cmhvb7og8001f8z89rpw1ualx','ippanのマイワークスペース','個人用のワークスペースです','cmhvb7og5001d8z89ho6a33di',1762910195336,1762910195336);
INSERT INTO workspaces VALUES('cmhzzb7tg000j8z0angoteesj','tenのマイワークスペース','個人用のワークスペースです','cmhzzb7tf000h8z0a3i13f2z0',1763192535893,1763192535893);
INSERT INTO workspaces VALUES('cmhzzc2sx00158z0ac9p74vtp','subのマイワークスペース','個人用のワークスペースです','cmhzzc2sv00138z0axtgg3rib',1763192576049,1763192576049);
INSERT INTO workspaces VALUES('cmhzzd5e0001r8z0a72zdm9ww','maneのマイワークスペース','個人用のワークスペースです','cmhzzd5dy001p8z0anahgcb8c',1763192626056,1763192626056);
INSERT INTO workspaces VALUES('cmhzze1ia002r8z0aiz8sfkk6','somuのマイワークスペース','個人用のワークスペースです','cmhzze1i8002p8z0a6tyddu5n',1763192667682,1763192667682);
CREATE TABLE IF NOT EXISTS "convenience_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isAdminOnly" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "convenience_categories_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "convenience_categories_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO convenience_categories VALUES('cmhuthwta000d8z6hmjpvracw',NULL,'test',0,0,0,NULL,1762880439647,1762880439647,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
INSERT INTO convenience_categories VALUES('cmhvaozn6005h8z6h8dx0bluc',NULL,'テストカテゴリ',1,0,0,NULL,1762909323379,1762909323379,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
INSERT INTO convenience_categories VALUES('cmhvaqvsm00038z899ardz86d',NULL,'test',2,1,0,1762984271926,1762909411703,1762984271928,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
INSERT INTO convenience_categories VALUES('cmhwjwf2x00018z4eb6cfeslp',NULL,'test',2,1,0,1762985646866,1762985252697,1762985646867,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
INSERT INTO convenience_categories VALUES('cmi46235f00018zzerz33g5mk',NULL,'test',2,0,0,NULL,1763445731956,1763445731956,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
CREATE TABLE IF NOT EXISTS "convenience_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isAdminOnly" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "convenience_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "convenience_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "convenience_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "convenience_entries_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO convenience_entries VALUES('cmhuti7gr000f8z6h1no8dkds','cmhuthwta000d8z6hmjpvracw','test',replace('layout-74eb33b1b2be4d12.js:1 [Sidebar] 有給管理メニュー: currentUserが存在しません\n3767-663aaaeb1cf9e9cc.js:1  GET https://hr-system-2025-33b161f586cd.herokuapp.com/_vercel/insights/script.js net::ERR_ABORTED 404 (Not Found)\n(anonymous) @ 3767-663aaaeb1cf9e9cc.js:1\n(anonymous) @ 3767-663aaaeb1cf9e9cc.js:1\naW @ fd9d1056-b0be330f100f9234.js:1\noe @ fd9d1056-b0be330f100f9234.js:1\ne @ fd9d1056-b0be330f100f9234.js:1\ne @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nor @ fd9d1056-b0be330f100f9234.js:1\nol @ fd9d1056-b0be330f100f9234.js:1\nid @ fd9d1056-b0be330f100f9234.js:1\nnb @ fd9d1056-b0be330f100f9234.js:1\n(anonymous) @ fd9d1056-b0be330f100f9234.js:1\nis @ fd9d1056-b0be330f100f9234.js:1\no1 @ fd9d1056-b0be330f100f9234.js:1\noZ @ fd9d1056-b0be330f100f9234.js:1\nT @ 2117-e739f0e58025c198.js:1\n3767-663aaaeb1cf9e9cc.js:1 [Vercel Web Analytics] Failed to load script from /_vercel/insights/script.js. Be sure to enable Web Analytics for your project and deploy again. See https://vercel.com/docs/analytics/quickstart for more information.\ncontent.js:10 Mapify:warn Element not found for selector: ''mapify-window''\nlog @ content.js:10\n_log @ content.js:4\no @ content.js:4\n_logFn @ content.js:4\n(anonymous) @ content.js:1\n_e @ content.js:10\nLS @ content.js:103\n(anonymous) @ content.js:103\nsetInterval\nu @ content.js:32\nLo @ content.js:32\nmain @ content.js:103\n(anonymous) @ content.js:103\n(anonymous) @ content.js:103\n(anonymous) @ content.js:103\nconvenience:1 The resource https://hr-system-2025-33b161f586cd.herokuapp.com/_next/static/media/5b01f339abf2f1a5.p.woff2 was preloaded using link preload but not used within a few seconds from the window''s load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.\nconvenience:1 The resource https://hr-system-2025-33b161f586cd.herokuapp.com/_next/static/media/028c0d39d2e8f589-s.p.woff2 was preloaded using link preload but not used within a few seconds from the window''s load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.\nlayout-74eb33b1b2be4d12.js:1 Fetching employees from API...\nlayout-74eb33b1b2be4d12.js:1 API response status: 200\nlayout-74eb33b1b2be4d12.js:1 Found employees: 49\nlayout-74eb33b1b2be4d12.js:1 Found employee: 大澤仁志 (ID: cmgtj2n3o00008zcwnsyk1k4n, Role: admin)\n8618-68583913790046ed.js:1 AuthContext - Login: 大澤仁志 ID: cmgtj2n3o00008zcwnsyk1k4n RememberMe: true\n8618-68583913790046ed.js:1 AuthContext - Cleared workspace and board cache for new user\n8618-68583913790046ed.js:1 AuthContext - Saved user to localStorage (long-term)\n8618-68583913790046ed.js:1 [v0] Activity logged: {id: ''1762874896394'', timestamp: Wed Nov 12 2025 00:28:16 GMT+0900 (日本標準時), userId: ''cmgtj2n3o00008zcwnsyk1k4n'', userName: ''大澤仁志'', action: ''ログイン'', …}\nlayout-74eb33b1b2be4d12.js:1 [Sidebar] 有給管理メニュー: 表示します {employeeType: ''正社員''}\npage-fb71d70c305c647a.js:1 TasksPage - currentUser: {id: ''cmgtj2n3o00008zcwnsyk1k4n'', employeeId: ''EMP-2015-003'', employeeNumber: ''001'', employeeType: ''正社員'', name: ''大澤仁志'', …}\npage-fb71d70c305c647a.js:1 TasksPage - permissions: {viewDashboard: true, viewDashboardStats: true, manageAnnouncements: true, viewConvenience: true, manageConvenience: true, …}\npage-fb71d70c305c647a.js:1 TasksPage - isMobile: false window.innerWidth: 633\npage-fb71d70c305c647a.js:1 Loading initial data for user: cmgtj2n3o00008zcwnsyk1k4n\npage-fb71d70c305c647a.js:1 Fetching employees from /api/employees\npage-fb71d70c305c647a.js:1 Fetching workspaces for user: cmgtj2n3o00008zcwnsyk1k4n retry: 0\npage-fb71d70c305c647a.js:1 TasksPage - currentUser: {id: ''cmgtj2n3o00008zcwnsyk1k4n'', employeeId: ''EMP-2015-003'', employeeNumber: ''001'', employeeType: ''正社員'', name: ''大澤仁志'', …}\npage-fb71d70c305c647a.js:1 TasksPage - permissions: {viewDashboard: true, viewDashboardStats: true, manageAnnouncements: true, viewConvenience: true, manageConvenience: true, …}\npage-fb71d70c305c647a.js:1 TasksPage - isMobile: true window.innerWidth: 633\npage-fb71d70c305c647a.js:1 Response status: 200 Response ok: true\npage-fb71d70c305c647a.js:1 Fetched workspaces: 3\npage-fb71d70c305c647a.js:1 TasksPage - currentUser: {id: ''cmgtj2n3o00008zcwnsyk1k4n'', employeeId: ''EMP-2015-003'', employeeNumber: ''001'', employeeType: ''正社員'', name: ''大澤仁志'', …}\npage-fb71d70c305c647a.js:1 TasksPage - permissions: {viewDashboard: true, viewDashboardStats: true, manageAnnouncements: true, viewConvenience: true, manageConvenience: true, …}\npage-fb71d70c305c647a.js:1 TasksPage - isMobile: true window.innerWidth: 633\npage-fb71d70c305c647a.js:1 Setting first workspace: cmhnj6gpj0027290lrnm40kti\npage-fb71d70c305c647a.js:1 Fetching boards for workspace: cmhnj6gpj0027290lrnm40kti user: cmgtj2n3o00008zcwnsyk1k4n\npage-fb71d70c305c647a.js:1 Fetched boards: 1\npage-fb71d70c305c647a.js:1 Auto-selected board: 練習ボード from workspace: cmhnj6gpj0027290lrnm40kti\npage-fb71d70c305c647a.js:1 TasksPage - currentUser: {id: ''cmgtj2n3o00008zcwnsyk1k4n'', employeeId: ''EMP-2015-003'', employeeNumber: ''001'', employeeType: ''正社員'', name: ''大澤仁志'', …}\npage-fb71d70c305c647a.js:1 TasksPage - permissions: {viewDashboard: true, viewDashboardStats: true, manageAnnouncements: true, viewConvenience: true, manageConvenience: true, …}\npage-fb71d70c305c647a.js:1 TasksPage - isMobile: true window.innerWidth: 633\npage-fb71d70c305c647a.js:1 Fetching board data for: cmhnj6h0j002b290lqwqegnqo\npage-fb71d70c305c647a.js:1 TasksPage - currentUser: {id: ''cmgtj2n3o00008zcwnsyk1k4n'', employeeId: ''EMP-2015-003'', employeeNumber: ''001'', employeeType: ''正社員'', name: ''大澤仁志'', …}\npage-fb71d70c305c647a.js:1 TasksPage - permissions: {viewDashboard: true, viewDashboardStats: true, manageAnnouncements: true, viewConvenience: true, manageConvenience: true, …}\npage-fb71d70c305c647a.js:1 TasksPage - isMobile: true window.innerWidth: 633\npage-fb71d70c305c647a.js:1 Board data received: {board: {…}}\npage-fb71d70c305c647a.js:1 Current board data set: {id: ''cmhnj6h0j002b290lqwqegnqo'', name: ''練習ボード'', description: ''練習のタスクボードです'', workspaceId: ''cmhnj6gpj0027290lrnm40kti'', createdBy: ''cmgtj2n3o00008zcwnsyk1k4n'', …}\npage-fb71d70c305c647a.js:1 TasksPage - currentUser: {id: ''cmgtj2n3o00008zcwnsyk1k4n'', employeeId: ''EMP-2015-003'', employeeNumber: ''001'', employeeType: ''正社員'', name: ''大澤仁志'', …}\npage-fb71d70c305c647a.js:1 TasksPage - permissions: {viewDashboard: true, viewDashboardStats: true, manageAnnouncements: true, viewConvenience: true, manageConvenience: true, …}\npage-fb71d70c305c647a.js:1 TasksPage - isMobile: true window.innerWidth: 633\npage-fb71d70c305c647a.js:1 Raw response data: (49) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]\npage-fb71d70c305c647a.js:1 Employees fetched successfully: 49 employees\npage-fb71d70c305c647a.js:1 TasksPage - currentUser: {id: ''cmgtj2n3o00008zcwnsyk1k4n'', employeeId: ''EMP-2015-003'', employeeNumber: ''001'', employeeType: ''正社員'', name: ''大澤仁志'', …}\npage-fb71d70c305c647a.js:1 TasksPage - permissions: {viewDashboard: true, viewDashboardStats: true, manageAnnouncements: true, viewConvenience: true, manageConvenience: true, …}\npage-fb71d70c305c647a.js:1 TasksPage - isMobile: true window.innerWidth: 633\npage-fb71d70c305c647a.js:1 generateListsFromBoardData - boardData.lists: (4) [{…}, {…}, {…}, {…}]\npage-fb71d70c305c647a.js:1 generateListsFromBoardData - generatedLists: (4) [{…}, {…}, {…}, {…}]\npage-fb71d70c305c647a.js:1 Dialog state changed: {dialogOpen: false, selectedTask: undefined, selectedTaskTitle: undefined}\npage-fb71d70c305c647a.js:1 KanbanBoard - Updating with board data: {id: ''cmhnj6h0j002b290lqwqegnqo'', name: ''練習ボード'', description: ''練習のタスクボードです'', workspaceId: ''cmhnj6gpj0027290lrnm40kti'', createdBy: ''cmgtj2n3o00008zcwnsyk1k4n'', …}\npage-fb71d70c305c647a.js:1 KanbanBoard - showArchived: false\npage-fb71d70c305c647a.js:1 KanbanBoard - dateFrom:  dateTo: \npage-fb71d70c305c647a.js:1 KanbanBoard - freeWord:  member: all\npage-fb71d70c305c647a.js:1 generateListsFromBoardData - boardData.lists: (4) [{…}, {…}, {…}, {…}]\npage-fb71d70c305c647a.js:1 generateListsFromBoardData - generatedLists: (4) [{…}, {…}, {…}, {…}]\npage-fb71d70c305c647a.js:1 generateListsFromBoardData - boardData.lists: (4) [{…}, {…}, {…}, {…}]\npage-fb71d70c305c647a.js:1 generateListsFromBoardData - generatedLists: (4) [{…}, {…}, {…}, {…}]\ntasks:1 The resource https://hr-system-2025-33b161f586cd.herokuapp.com/_next/static/media/5b01f339abf2f1a5.p.woff2 was preloaded using link preload but not used within a few seconds from the window''s load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.\ntasks:1 The resource https://hr-system-2025-33b161f586cd.herokuapp.com/_next/static/media/028c0d39d2e8f589-s.p.woff2 was preloaded using link preload but not used within a few seconds from the window''s load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.\npage-fb71d70c305c647a.js:1 TasksPage - currentUser: {id: ''cmgtj2n3o00008zcwnsyk1k4n'', employeeId: ''EMP-2015-003'', employeeNumber: ''001'', employeeType: ''正社員'', name: ''大澤仁志'', …}\npage-fb71d70c305c647a.js:1 TasksPage - permissions: {viewDashboard: true, viewDashboardStats: true, manageAnnouncements: true, viewConvenience: true, manageConvenience: true, …}\npage-fb71d70c305c647a.js:1 TasksPage - isMobile: true window.innerWidth: 633\npage-fb71d70c305c647a.js:1 generateListsFromBoardData - boardData.lists: (4) [{…}, {…}, {…}, {…}]\npage-fb71d70c305c647a.js:1 generateListsFromBoardData - generatedLists: (4) [{…}, {…}, {…}, {…}]','\n',char(10)),0,0,0,NULL,1762880453451,1762880453451,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
INSERT INTO convenience_entries VALUES('cmhvnmgvs00018zikvv50pd5a','cmhuthwta000d8z6hmjpvracw','nodeテスト','メモ',0,0,1,NULL,1762931040759,1762987242995,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
INSERT INTO convenience_entries VALUES('cmhvnr9z6000h8z9rqz9tfd69','cmhuthwta000d8z6hmjpvracw','curlテスト4','APIテスト',1,0,0,NULL,1762931265091,1762931265091,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
INSERT INTO convenience_entries VALUES('cmhwjwwgj00038z4ewocktbh4','cmhwjwf2x00018z4eb6cfeslp','test','testetestests',0,1,1,1762985646866,1762985275219,1762985646867,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
INSERT INTO convenience_entries VALUES('cmhwk6e2t00018znajv5p0jel','cmhvaozn6005h8z6h8dx0bluc','test',NULL,0,0,1,NULL,1762985717958,1762986493119,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
INSERT INTO convenience_entries VALUES('cmi4628pv00038zze84qsdgsh','cmhvaozn6005h8z6h8dx0bluc','testesstss',NULL,1,0,0,NULL,1763445739172,1763445739172,'cmgtj2n3o00008zcwnsyk1k4n','cmgtj2n3o00008zcwnsyk1k4n');
CREATE TABLE IF NOT EXISTS "workclock_time_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "wagePattern" TEXT NOT NULL DEFAULT 'A',
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workclock_time_entries_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workclock_workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO workclock_time_entries VALUES('cmhyuz0ql00018z0a5ul4378p','cmhyn8wk400018zies0xe8ctd',1762646400000,'A','00:00','04:00',60,'',1763124782205,1763124782205);
INSERT INTO workclock_time_entries VALUES('cmhyuz8fe00038z0au8sdqoke','cmhyn8wk400018zies0xe8ctd',1762646400000,'A','02:00','03:00',0,'teste',1763124792171,1763124792171);
INSERT INTO workclock_time_entries VALUES('cmhyx33x500058z0a62d1xtl6','cmhyn8wk400018zies0xe8ctd',1762732800000,'A','01:00','02:00',0,'testess',1763128332186,1763128332186);
INSERT INTO workclock_time_entries VALUES('cmi1wr0yz003w8z0a646bt4kt','cmhyn8wk400018zies0xe8ctd',1763424000000,'A','14:00','16:00',15,'testtest',1763309167019,1763309167019);
INSERT INTO workclock_time_entries VALUES('cmi1xazbu003y8z0ap25myq3t','cmhyn8wk400018zies0xe8ctd',1763596800000,'A','09:00','18:00',0,replace('aaaaaaaaaaaaaaas\nddddddddddddddddddddd\ndddddddddddddddddddddddddddddddddddddddddd\n\ndddddddddddddd\nddddddddddd\n\nddddddddddddd','\n',char(10)),1763310098010,1763310098010);
INSERT INTO workclock_time_entries VALUES('cmi20qbnn00428z0a7wxgk0w7','cmhzx9x24000g8z0aarczhrev',1763424000000,'A','09:00','18:00',0,'testeetes',1763315852675,1763315852675);
INSERT INTO workclock_time_entries VALUES('cmi21kd7w00488z0abb8vqtzb','cmhzx9x24000g8z0aarczhrev',1763596800000,'A','09:00','18:00',0,'test',1763317254381,1763317254381);
INSERT INTO workclock_time_entries VALUES('cmi21kmjd004a8z0avklvvx5o','cmhzx9x24000g8z0aarczhrev',1763337600000,'A','04:30','06:00',0,'testestetasete',1763317266457,1763317266457);
INSERT INTO workclock_time_entries VALUES('cmi2ohuqh00018z8wsu9a1l1m','cmhzx9x24000g8z0aarczhrev',1763424000000,'A','02:00','03:00',0,'sawa',1763355768282,1763355768282);
INSERT INTO workclock_time_entries VALUES('cmi2ou8pt00038z8wmqf5s9os','cmhzx9x24000g8z0aarczhrev',1763510400000,'A','03:00','04:30',0,'test',1763356346274,1763356346274);
INSERT INTO workclock_time_entries VALUES('cmi2qqwx300018z9bkck7r1mh','cmhzx9x24000g8z0aarczhrev',1763683200000,'A','09:00','18:00',0,'テスト',1763359550248,1763359550248);
INSERT INTO workclock_time_entries VALUES('cmi2qvx8700038z9b6tzw3k7t','cmhzx9x24000g8z0aarczhrev',1763251200000,'A','04:30','06:00',0,'test',1763359783927,1763359783927);
INSERT INTO workclock_time_entries VALUES('cmi2r26hs00058z9ba3oww20b','cmhzx9x24000g8z0aarczhrev',1763769600000,'B','09:00','18:00',0,'Bパターンテスト',1763360075872,1763360075872);
INSERT INTO workclock_time_entries VALUES('cmi2r4twx00078z9bbzx5pw9g','cmhzx9x24000g8z0aarczhrev',1763942400000,'C','09:00','18:00',0,'C：資料',1763360199538,1763360199538);
INSERT INTO workclock_time_entries VALUES('cmi2rb67d00098z9bhjw1gfwi','cmhzx9x24000g8z0aarczhrev',1764115200000,'A','09:00','18:00',0,'月額固定内の仕事',1763360495402,1763360495402);
INSERT INTO workclock_time_entries VALUES('cmi2tm0yg000b8z9bl2q8iubp','cmhzx9x24000g8z0aarczhrev',1763424000000,'C','07:00','08:00',0,'テスト',1763364361048,1763364361048);
CREATE TABLE IF NOT EXISTS "workclock_workers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "companyName" TEXT,
    "qualifiedInvoiceNumber" TEXT,
    "chatworkId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "hourlyRate" REAL NOT NULL,
    "wagePatternLabelA" TEXT DEFAULT 'Aパターン',
    "wagePatternLabelB" TEXT DEFAULT 'Bパターン',
    "wagePatternLabelC" TEXT DEFAULT 'Cパターン',
    "hourlyRateB" REAL,
    "hourlyRateC" REAL,
    "monthlyFixedAmount" INTEGER,
    "monthlyFixedEnabled" BOOLEAN NOT NULL DEFAULT false,
    "teams" TEXT,
    "role" TEXT NOT NULL DEFAULT 'worker',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workclock_workers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO workclock_workers VALUES('cmhyn8wk400018zies0xe8ctd','cmgooyh7200008zsavyswd64d','田中太郎','111','オオサワペイント',NULL,NULL,'tanaka@company.com',NULL,NULL,2500.0,'A：福祉','B：入札','C：SNS',1500.0,NULL,NULL,0,'["福祉","入札"]','admin',NULL,1763111806420,1763370440520);
INSERT INTO workclock_workers VALUES('cmhzx9x24000g8z0aarczhrev','cmgooyh7f000p8zsax21pn6we','小林智也','111','s',NULL,'ssssssssssss','kobayashi@company.com','090-1234-5678','呉市広文化町6-4sssssss',0.0,'A：月額固定','B：SNS','C：資料',1300.0,2000.0,30000,1,'["福祉","SNS"]','worker',replace('てsつぇえtesteteseertest\nedddddtesteesstes','\n',char(10)),1763189116060,1763360466437);
CREATE UNIQUE INDEX "card_members_cardId_employeeId_key" ON "card_members"("cardId", "employeeId");
CREATE INDEX "convenience_entry_urls_entryId_position_idx" ON "convenience_entry_urls"("entryId", "position");
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");
CREATE UNIQUE INDEX "employees_employeeNumber_key" ON "employees"("employeeNumber");
CREATE UNIQUE INDEX "workspace_members_workspaceId_employeeId_key" ON "workspace_members"("workspaceId", "employeeId");
CREATE UNIQUE INDEX "task_members_taskId_employeeId_key" ON "task_members"("taskId", "employeeId");
CREATE UNIQUE INDEX "user_settings_employeeId_key_key" ON "user_settings"("employeeId", "key");
CREATE UNIQUE INDEX "master_data_type_value_key" ON "master_data"("type", "value");
CREATE UNIQUE INDEX "parttime_grant_schedule_serviceDays_workDaysPerWeek_key" ON "parttime_grant_schedule"("serviceDays", "workDaysPerWeek");
CREATE INDEX "vacation_balances_employeeId_grantDate_idx" ON "vacation_balances"("employeeId", "grantDate");
CREATE UNIQUE INDEX "grant_lots_dedupKey_key" ON "grant_lots"("dedupKey");
CREATE INDEX "grant_lots_employeeId_grantDate_idx" ON "grant_lots"("employeeId", "grantDate");
CREATE INDEX "consumptions_employeeId_date_idx" ON "consumptions"("employeeId", "date");
CREATE INDEX "consumptions_lotId_idx" ON "consumptions"("lotId");
CREATE INDEX "consumptions_requestId_idx" ON "consumptions"("requestId");
CREATE INDEX "time_off_requests_employeeId_idx" ON "time_off_requests"("employeeId");
CREATE INDEX "time_off_requests_supervisorId_idx" ON "time_off_requests"("supervisorId");
CREATE INDEX "alert_events_employeeId_idx" ON "alert_events"("employeeId");
CREATE UNIQUE INDEX "alert_events_employeeId_kind_referenceDate_key" ON "alert_events"("employeeId", "kind", "referenceDate");
CREATE INDEX "audit_logs_employeeId_idx" ON "audit_logs"("employeeId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE UNIQUE INDEX "vacation_app_configs_version_key" ON "vacation_app_configs"("version");
CREATE UNIQUE INDEX "bulletin_categories_name_key" ON "bulletin_categories"("name");
CREATE INDEX "bulletins_publishedAt_idx" ON "bulletins"("publishedAt");
CREATE INDEX "convenience_categories_tenantId_position_idx" ON "convenience_categories"("tenantId", "position");
CREATE INDEX "convenience_entries_categoryId_position_idx" ON "convenience_entries"("categoryId", "position");
CREATE INDEX "workclock_time_entries_workerId_date_idx" ON "workclock_time_entries"("workerId", "date");
CREATE UNIQUE INDEX "workclock_workers_employeeId_key" ON "workclock_workers"("employeeId");
COMMIT;
