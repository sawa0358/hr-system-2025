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
CREATE TABLE IF NOT EXISTS "workspace_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO workspace_members VALUES('cmh6dnaqk000r8zt5jbkh8699','cmh6dnaqi000p8zt5p5q792t5','cmh6dnaqf000n8zt5kbecf42f','workspace_admin',1761402628892);
INSERT INTO workspace_members VALUES('cmhauuk0200038zuf4wt4cvtl','cmhauuk0200018zufgrigol4l','cmh6dnaqf000n8zt5kbecf42f','admin',1761673385666);
INSERT INTO workspace_members VALUES('cmhauuv49000a8zufdr91x9d9','cmhauuk0200018zufgrigol4l','cmh61yv6u00078ztfoxvldr6k','workspace_member',1761673400074);
INSERT INTO workspace_members VALUES('cmhauuv49000b8zuflnn3hh3k','cmhauuk0200018zufgrigol4l','cmh61yv6s00058ztf3mnhrvuh','workspace_member',1761673400074);
INSERT INTO workspace_members VALUES('cmhauuv49000c8zufewor8qqn','cmhauuk0200018zufgrigol4l','cmh61yv6t00068ztfehik701k','workspace_member',1761673400074);
INSERT INTO workspace_members VALUES('cmhauuv49000d8zuf8tc4i8vg','cmhauuk0200018zufgrigol4l','cmh61yv6r00038ztfb6fy1a0o','workspace_member',1761673400074);
INSERT INTO workspace_members VALUES('cmhauuv49000e8zufabc32ltd','cmhauuk0200018zufgrigol4l','cmh61yv6s00048ztfz0yoonl9','workspace_member',1761673400074);
INSERT INTO workspace_members VALUES('cmhauuv49000f8zufwop2ximd','cmhauuk0200018zufgrigol4l','cmh61yv6q00028ztf6bx7j764','workspace_member',1761673400074);
INSERT INTO workspace_members VALUES('cmhauuv49000g8zufysmy8bb4','cmhauuk0200018zufgrigol4l','cmh61yv6o00008ztfctj0dso0','workspace_member',1761673400074);
INSERT INTO workspace_members VALUES('cmhauuv49000h8zufbgby36tf','cmhauuk0200018zufgrigol4l','cmh61yv6p00018ztf678g4tuj','workspace_member',1761673400074);
INSERT INTO workspace_members VALUES('cmhauy7ja00038zbj1j095noa','cmhauy7j900018zbj4yvm0xfd','cmh61yv6p00018ztf678g4tuj','workspace_admin',1761673556135);
INSERT INTO workspace_members VALUES('cmhauy7je000h8zbjipi8voz4','cmhauy7je000f8zbj3mgdfzej','cmh61yv6q00028ztf6bx7j764','workspace_admin',1761673556139);
INSERT INTO workspace_members VALUES('cmhauy7ji000v8zbjqptc4znv','cmhauy7jh000t8zbjpb9d5tyn','cmh61yv6r00038ztfb6fy1a0o','workspace_admin',1761673556142);
INSERT INTO workspace_members VALUES('cmhauy7jk00198zbjqklqn7ob','cmhauy7jk00178zbjch0s83qz','cmh61yv6s00048ztfz0yoonl9','workspace_admin',1761673556144);
INSERT INTO workspace_members VALUES('cmhauy7jm001n8zbj6j4h5yix','cmhauy7jm001l8zbjtdo6quaa','cmh61yv6s00058ztf3mnhrvuh','workspace_admin',1761673556147);
INSERT INTO workspace_members VALUES('cmhauy7jp00218zbjn5rm8t17','cmhauy7jo001z8zbjbxo1i43b','cmh61yv6t00068ztfehik701k','workspace_admin',1761673556149);
INSERT INTO workspace_members VALUES('cmhauy7jr002f8zbjxj4ab3fe','cmhauy7jr002d8zbj7sqjj4ki','cmh61yv6u00078ztfoxvldr6k','workspace_admin',1761673556152);
INSERT INTO workspace_members VALUES('cmhauy7ju002t8zbjwl6s3dak','cmhauy7jt002r8zbjqc9c0pzc','cmh66jij900008zuvym8k16wm','workspace_admin',1761673556154);
INSERT INTO workspace_members VALUES('cmhauy7jw00378zbjc66yg6g4','cmhauy7jw00358zbjnoo4wzk8','cmh6bxkb000008zrcnaoftjor','workspace_admin',1761673556157);
INSERT INTO workspace_members VALUES('cmhawbiwp00068zu0mh1us01y','cmhawbiwj00048zu0aytdwr3d','cmhawbiwd00028zu09znbrma6','workspace_admin',1761675857017);
INSERT INTO workspace_members VALUES('cmhb4b37n000e8z4bdpq9cikp','cmhb4b37k000c8z4bsqz5h0wa','cmhb4b37g000a8z4bhilfigpa','workspace_admin',1761689273603);
INSERT INTO workspace_members VALUES('cmhoy1lug000f8z0cvmnt3112','cmhoy1luf000d8z0ch02go854','cmhoy1lud000b8z0cibsqrpaj','workspace_admin',1762525279961);
INSERT INTO workspace_members VALUES('cmi8caign00068zo4qbrp3san','cmi8caigm00048zo4r3wb8g3q','cmi8caigj00028zo432ixktrr','workspace_admin',1763698067447);
INSERT INTO workspace_members VALUES('cmi8cb5x5000p8zo4qojubep3','cmi8cb5x4000n8zo4x9p9pxig','cmi8cb5x2000l8zo4lepmbdc8','workspace_admin',1763698097849);
INSERT INTO workspace_members VALUES('cmi8cbmk3001b8zo4qoezkqst','cmi8cbmk200198zo4x5mayllv','cmi8cbmk000178zo4pdk0ie7f','workspace_admin',1763698119411);
INSERT INTO workspace_members VALUES('cmi8ccal3001x8zo40r5gg9q5','cmi8ccal3001v8zo47ovqwqbk','cmi8ccal1001t8zo41oyzgmu0','workspace_admin',1763698150552);
CREATE TABLE IF NOT EXISTS "board_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "board_lists_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO board_lists VALUES('cmh66sv9z00088zh54ys7wo2n','常時運用タスク',0,'cmh66sv9z00068zh5jh0avkyu',1761391131480,1761391131480);
INSERT INTO board_lists VALUES('cmh66sva0000a8zh5j2rvkz9i','予定リスト',1,'cmh66sv9z00068zh5jh0avkyu',1761391131480,1761391131480);
INSERT INTO board_lists VALUES('cmh66sva0000c8zh5gznyvd8s','進行中',2,'cmh66sv9z00068zh5jh0avkyu',1761391131481,1761391131481);
INSERT INTO board_lists VALUES('cmh66sva1000e8zh52scjrzic','完了',3,'cmh66sv9z00068zh5jh0avkyu',1761391131481,1761391131481);
INSERT INTO board_lists VALUES('cmh6dnaqm000v8zt51wr4s9ya','常時運用タスク',0,'cmh6dnaql000t8zt5lgttywoy',1761402628894,1761679234337);
INSERT INTO board_lists VALUES('cmh6dnaqn000x8zt57c48y320','予定リスト',1,'cmh6dnaql000t8zt5lgttywoy',1761402628895,1761679234337);
INSERT INTO board_lists VALUES('cmh6dnaqn000z8zt56g8luog0','進行中',2,'cmh6dnaql000t8zt5lgttywoy',1761402628895,1761679234337);
INSERT INTO board_lists VALUES('cmh6dnaqn00118zt5szrrs7co','完了',4,'cmh6dnaql000t8zt5lgttywoy',1761402628896,1761679234337);
INSERT INTO board_lists VALUES('cmhauukh800068zufmkeh9tia','常時運用タスク',0,'cmhauukh800058zufpqxyny9b',1761673386285,1761673386285);
INSERT INTO board_lists VALUES('cmhauukh800078zuf8x7w88wy','予定リスト',1,'cmhauukh800058zufpqxyny9b',1761673386285,1761673386285);
INSERT INTO board_lists VALUES('cmhauukh800088zufmizfae2a','進行中',2,'cmhauukh800058zufpqxyny9b',1761673386285,1761673386285);
INSERT INTO board_lists VALUES('cmhauukh800098zuf8s984xyb','完了',3,'cmhauukh800058zufpqxyny9b',1761673386285,1761673386285);
INSERT INTO board_lists VALUES('cmhauy7jc00078zbjjd7tg75l','常時運用タスク',0,'cmhauy7jb00058zbjehm3sw8q',1761673556136,1761673556136);
INSERT INTO board_lists VALUES('cmhauy7jc00098zbjmo7acb32','予定リスト',1,'cmhauy7jb00058zbjehm3sw8q',1761673556136,1761673556136);
INSERT INTO board_lists VALUES('cmhauy7jc000b8zbjogqiytqv','進行中',2,'cmhauy7jb00058zbjehm3sw8q',1761673556137,1761673556137);
INSERT INTO board_lists VALUES('cmhauy7jd000d8zbj8uca8dlw','完了',3,'cmhauy7jb00058zbjehm3sw8q',1761673556137,1761673556137);
INSERT INTO board_lists VALUES('cmhauy7jf000l8zbjj9s31hqw','常時運用タスク',0,'cmhauy7jf000j8zbjhy9plg48',1761673556140,1761673556140);
INSERT INTO board_lists VALUES('cmhauy7jg000n8zbj6tgd2es9','予定リスト',1,'cmhauy7jf000j8zbjhy9plg48',1761673556140,1761673556140);
INSERT INTO board_lists VALUES('cmhauy7jg000p8zbjk05xwz5t','進行中',2,'cmhauy7jf000j8zbjhy9plg48',1761673556141,1761673556141);
INSERT INTO board_lists VALUES('cmhauy7jh000r8zbjyhvaj6x8','完了',3,'cmhauy7jf000j8zbjhy9plg48',1761673556141,1761673556141);
INSERT INTO board_lists VALUES('cmhauy7ji000z8zbjyki5hzlx','常時運用タスク',0,'cmhauy7ji000x8zbjwgntqi0p',1761673556143,1761673556143);
INSERT INTO board_lists VALUES('cmhauy7jj00118zbj20l3l1a4','予定リスト',1,'cmhauy7ji000x8zbjwgntqi0p',1761673556143,1761673556143);
INSERT INTO board_lists VALUES('cmhauy7jj00138zbjqfmihi64','進行中',2,'cmhauy7ji000x8zbjwgntqi0p',1761673556143,1761673556143);
INSERT INTO board_lists VALUES('cmhauy7jj00158zbjynxsahn6','完了',3,'cmhauy7ji000x8zbjwgntqi0p',1761673556144,1761673556144);
INSERT INTO board_lists VALUES('cmhauy7jl001d8zbjhwck4x7n','常時運用タスク',0,'cmhauy7jk001b8zbjy7j0e13j',1761673556145,1761673556145);
INSERT INTO board_lists VALUES('cmhauy7jl001f8zbjrp1o2jz7','予定リスト',1,'cmhauy7jk001b8zbjy7j0e13j',1761673556145,1761673556145);
INSERT INTO board_lists VALUES('cmhauy7jl001h8zbj0iq7a1gr','進行中',2,'cmhauy7jk001b8zbjy7j0e13j',1761673556146,1761673556146);
INSERT INTO board_lists VALUES('cmhauy7jm001j8zbj9uycpw5d','完了',3,'cmhauy7jk001b8zbjy7j0e13j',1761673556146,1761673556146);
INSERT INTO board_lists VALUES('cmhauy7jn001r8zbj1rgefu65','常時運用タスク',0,'cmhauy7jn001p8zbjle21brqn',1761673556148,1761673556148);
INSERT INTO board_lists VALUES('cmhauy7jn001t8zbjm7gbpjj3','予定リスト',1,'cmhauy7jn001p8zbjle21brqn',1761673556148,1761673556148);
INSERT INTO board_lists VALUES('cmhauy7jo001v8zbj0uiqzf4u','進行中',2,'cmhauy7jn001p8zbjle21brqn',1761673556148,1761673556148);
INSERT INTO board_lists VALUES('cmhauy7jo001x8zbjfzjg49i4','完了',3,'cmhauy7jn001p8zbjle21brqn',1761673556148,1761673556148);
INSERT INTO board_lists VALUES('cmhauy7jp00258zbjkzs59pc9','常時運用タスク',0,'cmhauy7jp00238zbjehjs6bou',1761673556150,1761673556150);
INSERT INTO board_lists VALUES('cmhauy7jq00278zbjvw8lwd95','予定リスト',1,'cmhauy7jp00238zbjehjs6bou',1761673556150,1761673556150);
INSERT INTO board_lists VALUES('cmhauy7jq00298zbji0acpr44','進行中',2,'cmhauy7jp00238zbjehjs6bou',1761673556151,1761673556151);
INSERT INTO board_lists VALUES('cmhauy7jq002b8zbjbfli0j10','完了',3,'cmhauy7jp00238zbjehjs6bou',1761673556151,1761673556151);
INSERT INTO board_lists VALUES('cmhauy7js002j8zbj1d1z1zq2','常時運用タスク',0,'cmhauy7js002h8zbjng2efdbl',1761673556153,1761673556153);
INSERT INTO board_lists VALUES('cmhauy7js002l8zbjjwbjn1z8','予定リスト',1,'cmhauy7js002h8zbjng2efdbl',1761673556153,1761673556153);
INSERT INTO board_lists VALUES('cmhauy7jt002n8zbji0drb4ba','進行中',2,'cmhauy7js002h8zbjng2efdbl',1761673556153,1761673556153);
INSERT INTO board_lists VALUES('cmhauy7jt002p8zbj0h0twcdk','完了',3,'cmhauy7js002h8zbjng2efdbl',1761673556153,1761673556153);
INSERT INTO board_lists VALUES('cmhauy7ju002x8zbjwd6wfslc','常時運用タスク',0,'cmhauy7ju002v8zbj19tp72bi',1761673556155,1761673556155);
INSERT INTO board_lists VALUES('cmhauy7jv002z8zbj18dy9kct','予定リスト',1,'cmhauy7ju002v8zbj19tp72bi',1761673556155,1761673556155);
INSERT INTO board_lists VALUES('cmhauy7jv00318zbjc7le9a4d','進行中',2,'cmhauy7ju002v8zbj19tp72bi',1761673556156,1761673556156);
INSERT INTO board_lists VALUES('cmhauy7jv00338zbj8ts7baw7','完了',3,'cmhauy7ju002v8zbj19tp72bi',1761673556156,1761673556156);
INSERT INTO board_lists VALUES('cmhauy7jx003b8zbj0uxjswwq','常時運用タスク',0,'cmhauy7jx00398zbjalzghxc5',1761673556158,1761673556158);
INSERT INTO board_lists VALUES('cmhauy7jx003d8zbjlx8fbq7y','予定リスト',1,'cmhauy7jx00398zbjalzghxc5',1761673556158,1761673556158);
INSERT INTO board_lists VALUES('cmhauy7jy003f8zbjwk5j1q80','進行中',2,'cmhauy7jx00398zbjalzghxc5',1761673556158,1761673556158);
INSERT INTO board_lists VALUES('cmhauy7jy003h8zbjatn4gpi4','完了',3,'cmhauy7jx00398zbjalzghxc5',1761673556159,1761673556159);
INSERT INTO board_lists VALUES('cmhawbiwt000a8zu0bx3lp7o4','常時運用タスク',0,'cmhawbiwq00088zu0td8ywvnu',1761675857021,1761675857021);
INSERT INTO board_lists VALUES('cmhawbiwu000c8zu08cwn28f1','予定リスト',1,'cmhawbiwq00088zu0td8ywvnu',1761675857023,1761675857023);
INSERT INTO board_lists VALUES('cmhawbiwv000e8zu0f7dlismn','進行中',2,'cmhawbiwq00088zu0td8ywvnu',1761675857023,1761675857023);
INSERT INTO board_lists VALUES('cmhawbiww000g8zu0t79lq9qh','完了',3,'cmhawbiwq00088zu0td8ywvnu',1761675857024,1761675857024);
INSERT INTO board_lists VALUES('cmhaxkjvx00078zmltehh2gjz','常時運用タスク',0,'cmhaxkjvx00068zmlaqapp2sq',1761677957805,1761684379936);
INSERT INTO board_lists VALUES('cmhaxkjvx00088zmlslh1plf1','111',1,'cmhaxkjvx00068zmlaqapp2sq',1761677957805,1761684379936);
INSERT INTO board_lists VALUES('cmhaxkjvx00098zmlu691q4np','222',3,'cmhaxkjvx00068zmlaqapp2sq',1761677957805,1761684379936);
INSERT INTO board_lists VALUES('cmhaxkjvx000a8zmlpg476xg1','333',4,'cmhaxkjvx00068zmlaqapp2sq',1761677957805,1761684379936);
INSERT INTO board_lists VALUES('cmhaxpwt6000e8zmlezk10a29','テスト',3,'cmh6dnaql000t8zt5lgttywoy',1761678207835,1761679234337);
INSERT INTO board_lists VALUES('cmhb1e4th000e8zz2xc73n1ue','555',2,'cmhaxkjvx00068zmlaqapp2sq',1761684376806,1761684379936);
INSERT INTO board_lists VALUES('cmhb4b37p000i8z4b9gyib3iz','常時運用タスク',0,'cmhb4b37o000g8z4biqgn4soy',1761689273606,1761689273606);
INSERT INTO board_lists VALUES('cmhb4b37q000k8z4bfrcyp52j','予定リスト',1,'cmhb4b37o000g8z4biqgn4soy',1761689273607,1761689273607);
INSERT INTO board_lists VALUES('cmhb4b37s000m8z4bftw7afx5','進行中',2,'cmhb4b37o000g8z4biqgn4soy',1761689273609,1761689273609);
INSERT INTO board_lists VALUES('cmhb4b37t000o8z4bsamsb9po','完了',3,'cmhb4b37o000g8z4biqgn4soy',1761689273610,1761689273610);
INSERT INTO board_lists VALUES('cmhoy1lui000j8z0ceo79dwt2','常時運用タスク',0,'cmhoy1luh000h8z0ct5xz6hsh',1762525279962,1762525279962);
INSERT INTO board_lists VALUES('cmhoy1lui000l8z0cwlrbz1bu','予定リスト',1,'cmhoy1luh000h8z0ct5xz6hsh',1762525279963,1762525279963);
INSERT INTO board_lists VALUES('cmhoy1luj000n8z0c8o6azzwu','進行中',2,'cmhoy1luh000h8z0ct5xz6hsh',1762525279963,1762525279963);
INSERT INTO board_lists VALUES('cmhoy1luj000p8z0cqsxsug1y','完了',3,'cmhoy1luh000h8z0ct5xz6hsh',1762525279964,1762525279964);
INSERT INTO board_lists VALUES('cmi8caigp000a8zo4hj05jq6k','常時運用タスク',0,'cmi8caigo00088zo4aqm9ixwn',1763698067449,1763698067449);
INSERT INTO board_lists VALUES('cmi8caigq000c8zo4k8fogwb7','予定リスト',1,'cmi8caigo00088zo4aqm9ixwn',1763698067450,1763698067450);
INSERT INTO board_lists VALUES('cmi8caigq000e8zo4bvl87k8u','進行中',2,'cmi8caigo00088zo4aqm9ixwn',1763698067451,1763698067451);
INSERT INTO board_lists VALUES('cmi8caigr000g8zo48ispiu0k','完了',3,'cmi8caigo00088zo4aqm9ixwn',1763698067451,1763698067451);
INSERT INTO board_lists VALUES('cmi8cb5x7000t8zo4h1esyh8g','常時運用タスク',0,'cmi8cb5x6000r8zo4aviahasj',1763698097851,1763698097851);
INSERT INTO board_lists VALUES('cmi8cb5x8000v8zo47qvqzyut','予定リスト',1,'cmi8cb5x6000r8zo4aviahasj',1763698097852,1763698097852);
INSERT INTO board_lists VALUES('cmi8cb5x8000x8zo4d6mwp8jy','進行中',2,'cmi8cb5x6000r8zo4aviahasj',1763698097853,1763698097853);
INSERT INTO board_lists VALUES('cmi8cb5x9000z8zo43lb0abx9','完了',3,'cmi8cb5x6000r8zo4aviahasj',1763698097853,1763698097853);
INSERT INTO board_lists VALUES('cmi8cbmk4001f8zo462ods7ih','常時運用タスク',0,'cmi8cbmk4001d8zo4sehfv5v0',1763698119413,1763698119413);
INSERT INTO board_lists VALUES('cmi8cbmk5001h8zo41xdl89wr','予定リスト',1,'cmi8cbmk4001d8zo4sehfv5v0',1763698119414,1763698119414);
INSERT INTO board_lists VALUES('cmi8cbmk6001j8zo4hb7f0jpz','進行中',2,'cmi8cbmk4001d8zo4sehfv5v0',1763698119415,1763698119415);
INSERT INTO board_lists VALUES('cmi8cbmk7001l8zo4h93fhygc','完了',3,'cmi8cbmk4001d8zo4sehfv5v0',1763698119415,1763698119415);
INSERT INTO board_lists VALUES('cmi8ccal700218zo4l00o9ati','常時運用タスク',0,'cmi8ccal5001z8zo4rdg59yqh',1763698150555,1763698150555);
INSERT INTO board_lists VALUES('cmi8ccal900238zo4bmm6fi0t','予定リスト',1,'cmi8ccal5001z8zo4rdg59yqh',1763698150558,1763698150558);
INSERT INTO board_lists VALUES('cmi8ccalb00258zo4veiiweyq','進行中',2,'cmi8ccal5001z8zo4rdg59yqh',1763698150559,1763698150559);
INSERT INTO board_lists VALUES('cmi8ccalb00278zo488yvocxi','完了',3,'cmi8ccal5001z8zo4rdg59yqh',1763698150560,1763698150560);
CREATE TABLE IF NOT EXISTS "card_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "card_members_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "card_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO card_members VALUES('cmhawwoar00038z1j5qzm6n54','cmhawvpmu00018z1jzdqxlfmm','cmh61yv6p00018ztf678g4tuj',1761676843779);
INSERT INTO card_members VALUES('cmhblf17m000v8zjd2ktqdhb4','cmhblf17k000u8zjdq1wav902','cmh6dnaqf000n8zt5kbecf42f',1761718011106);
INSERT INTO card_members VALUES('cmhblwt2i000p8zds4c4g9045','cmhaxg8au00038zmlspqsw140','cmh6dnaqf000n8zt5kbecf42f',1761718840362);
INSERT INTO card_members VALUES('cmhifqakq002f8zq8634p3rvm','cmhifqakp002e8zq8u09i1e03','cmh61yv6r00038ztfb6fy1a0o',1762131721994);
INSERT INTO card_members VALUES('cmhig4kkb003u8zq8ggbwj1sf','cmhig10pb002p8zq8igzr9x9p','cmh61yv6o00008ztfctj0dso0',1762132388124);
INSERT INTO card_members VALUES('cmhig4kkb003v8zq84hb8wfed','cmhig10pb002p8zq8igzr9x9p','cmh61yv6p00018ztf678g4tuj',1762132388124);
INSERT INTO card_members VALUES('cmhig4kkb003w8zq85sv8yo1x','cmhig10pb002p8zq8igzr9x9p','cmh61yv6q00028ztf6bx7j764',1762132388124);
INSERT INTO card_members VALUES('cmhig4kkb003x8zq8h1brv1z6','cmhig10pb002p8zq8igzr9x9p','cmh61yv6r00038ztfb6fy1a0o',1762132388124);
INSERT INTO card_members VALUES('cmhig4kkb003y8zq8nqf0uqh6','cmhig10pb002p8zq8igzr9x9p','cmh61yv6s00048ztfz0yoonl9',1762132388124);
INSERT INTO card_members VALUES('cmhig4kkb003z8zq83kf8fc7v','cmhig10pb002p8zq8igzr9x9p','cmh61yv6s00058ztf3mnhrvuh',1762132388124);
INSERT INTO card_members VALUES('cmhig4kkb00408zq8n1t079yk','cmhig10pb002p8zq8igzr9x9p','cmh61yv6t00068ztfehik701k',1762132388124);
INSERT INTO card_members VALUES('cmhig4kkb00418zq83x7rflvz','cmhig10pb002p8zq8igzr9x9p','cmh61yv6u00078ztfoxvldr6k',1762132388124);
INSERT INTO card_members VALUES('cmhig4kkb00428zq8edfsl672','cmhig10pb002p8zq8igzr9x9p','cmh6dnaqf000n8zt5kbecf42f',1762132388124);
INSERT INTO card_members VALUES('cmhk8jkq800068z2bd1p3tt5h','cmhk8jkq800058z2bunzhmddf','cmh6dnaqf000n8zt5kbecf42f',1762240583601);
INSERT INTO card_members VALUES('cmhmp9ji100278ziwz0gajc82','cmhavoygy00018z2kdb9y9jqq','cmh6dnaqf000n8zt5kbecf42f',1762389601273);
INSERT INTO card_members VALUES('cmhsj7h7h000c8ztfxqs2y7t2','cmhblewxf000r8zjdfguzlsyy','cmh6dnaqf000n8zt5kbecf42f',1762742224349);
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
INSERT INTO custom_folders VALUES('cmhbpyk8a00488zdsxhwarmoq','cmhawbiwd00028zu09znbrma6','employee','契約書類',0,1761725640682,1761725640682);
INSERT INTO custom_folders VALUES('cmhbpyk8a00498zdsc9dxp0v9','cmhawbiwd00028zu09znbrma6','employee','履歴書等',1,1761725640682,1761725640682);
INSERT INTO custom_folders VALUES('cmhbpyk8a004a8zdsczwytoh1','cmhawbiwd00028zu09znbrma6','employee','その他',2,1761725640682,1761725640682);
INSERT INTO custom_folders VALUES('cmhbpyq6r004h8zds71nvhnul','cmhb4b37g000a8z4bhilfigpa','employee','契約書類',0,1761725648404,1761725648404);
INSERT INTO custom_folders VALUES('cmhbpyq6r004i8zdsn8rtwqwc','cmhb4b37g000a8z4bhilfigpa','employee','履歴書等',1,1761725648404,1761725648404);
INSERT INTO custom_folders VALUES('cmhbpyq6r004j8zdsvn2yu9gp','cmhb4b37g000a8z4bhilfigpa','employee','その他',2,1761725648404,1761725648404);
INSERT INTO custom_folders VALUES('cmhltybfs000l8ziwc9n9bpy1','cmh61yv6s00048ztfz0yoonl9','employee','契約書類',0,1762337009512,1762337009512);
INSERT INTO custom_folders VALUES('cmhltybfs000m8ziws09ktjim','cmh61yv6s00048ztfz0yoonl9','employee','履歴書等',1,1762337009512,1762337009512);
INSERT INTO custom_folders VALUES('cmhltybfs000n8ziwwmgm4j65','cmh61yv6s00048ztfz0yoonl9','employee','事前資料',2,1762337009512,1762337009512);
INSERT INTO custom_folders VALUES('cmhltybfs000o8ziwkk2a3us8','cmh61yv6s00048ztfz0yoonl9','employee','テスト22',3,1762337009512,1762337009512);
INSERT INTO custom_folders VALUES('cmhoxy1de00038z0cvis0c0l4','cmh61yv6r00038ztfb6fy1a0o','employee','契約書類',0,1762525113459,1762525113459);
INSERT INTO custom_folders VALUES('cmhoxy1df00048z0ch3ernzn2','cmh61yv6r00038ztfb6fy1a0o','employee','履歴書等',1,1762525113459,1762525113459);
INSERT INTO custom_folders VALUES('cmhoxy1df00058z0c3bc7w9al','cmh61yv6r00038ztfb6fy1a0o','employee','事前資料',2,1762525113459,1762525113459);
INSERT INTO custom_folders VALUES('cmhoxy1df00068z0c7p13le7p','cmh61yv6r00038ztfb6fy1a0o','employee','test',3,1762525113459,1762525113459);
INSERT INTO custom_folders VALUES('cmhoy1m4v000q8z0cgildbljd','cmhoy1lud000b8z0cibsqrpaj','employee','契約書類',0,1762525280335,1762525280335);
INSERT INTO custom_folders VALUES('cmhoy1m4v000r8z0c6o6yqzic','cmhoy1lud000b8z0cibsqrpaj','employee','履歴書等',1,1762525280335,1762525280335);
INSERT INTO custom_folders VALUES('cmhoy1m4v000s8z0cocv9vd5a','cmhoy1lud000b8z0cibsqrpaj','employee','その他',2,1762525280335,1762525280335);
INSERT INTO custom_folders VALUES('cmi4jvsq800008zau9n3d2db9','cmh61yv6u00078ztfoxvldr6k','employee','契約書類',0,1763468953137,1763468953137);
INSERT INTO custom_folders VALUES('cmi4jvsq800018zaudf6dfgel','cmh61yv6u00078ztfoxvldr6k','employee','履歴書等',1,1763468953137,1763468953137);
INSERT INTO custom_folders VALUES('cmi4jvsq800028zauob98pdpc','cmh61yv6u00078ztfoxvldr6k','employee','その他',2,1763468953137,1763468953137);
INSERT INTO custom_folders VALUES('cmi8cb64000108zo4uwojq5jm','cmi8cb5x2000l8zo4lepmbdc8','employee','契約書類',0,1763698098097,1763698098097);
INSERT INTO custom_folders VALUES('cmi8cb64000118zo4wbnksahp','cmi8cb5x2000l8zo4lepmbdc8','employee','履歴書等',1,1763698098097,1763698098097);
INSERT INTO custom_folders VALUES('cmi8cb64000128zo4ajwch47y','cmi8cb5x2000l8zo4lepmbdc8','employee','その他',2,1763698098097,1763698098097);
INSERT INTO custom_folders VALUES('cmi8cbmko001m8zo4p0qv1rpl','cmi8cbmk000178zo4pdk0ie7f','employee','契約書類',0,1763698119433,1763698119433);
INSERT INTO custom_folders VALUES('cmi8cbmko001n8zo4c9jxkqiv','cmi8cbmk000178zo4pdk0ie7f','employee','履歴書等',1,1763698119433,1763698119433);
INSERT INTO custom_folders VALUES('cmi8cbmko001o8zo4fgntw3gn','cmi8cbmk000178zo4pdk0ie7f','employee','その他',2,1763698119433,1763698119433);
INSERT INTO custom_folders VALUES('cmi8ccalw00288zo40pgj1sgf','cmi8ccal1001t8zo41oyzgmu0','employee','契約書類',0,1763698150581,1763698150581);
INSERT INTO custom_folders VALUES('cmi8ccalw00298zo4r5d8nuuh','cmi8ccal1001t8zo41oyzgmu0','employee','履歴書等',1,1763698150581,1763698150581);
INSERT INTO custom_folders VALUES('cmi8ccalw002a8zo4vrbngrn3','cmi8ccal1001t8zo41oyzgmu0','employee','その他',2,1763698150581,1763698150581);
INSERT INTO custom_folders VALUES('cmi8cckfu002h8zo46gaphm14','cmi8caigj00028zo432ixktrr','employee','契約書類',0,1763698163322,1763698163322);
INSERT INTO custom_folders VALUES('cmi8cckfu002i8zo4srtwnju6','cmi8caigj00028zo432ixktrr','employee','履歴書等',1,1763698163322,1763698163322);
INSERT INTO custom_folders VALUES('cmi8cckfu002j8zo4g659uhip','cmi8caigj00028zo432ixktrr','employee','その他',2,1763698163322,1763698163322);
INSERT INTO custom_folders VALUES('cmichnloe000m8zmyac5m95e2','cmh6dnaqf000n8zt5kbecf42f','employee','契約書類',0,1763948940927,1763948940927);
INSERT INTO custom_folders VALUES('cmichnloe000n8zmyshb0w48t','cmh6dnaqf000n8zt5kbecf42f','employee','履歴書等',1,1763948940927,1763948940927);
INSERT INTO custom_folders VALUES('cmichnloe000o8zmyv0qcik9g','cmh6dnaqf000n8zt5kbecf42f','employee','事前資料',2,1763948940927,1763948940927);
INSERT INTO custom_folders VALUES('cmichnloe000p8zmyrrzxt5o0','cmh6dnaqf000n8zt5kbecf42f','employee','test',3,1763948940927,1763948940927);
CREATE TABLE IF NOT EXISTS "master_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO master_data VALUES('cmhbmtgds00148zds29um8gvj','department','テスト','テスト',0,1761720363569,1761720363569);
INSERT INTO master_data VALUES('cmhbmtgds00158zdscee5z58i','department','不動産部','不動産部',1,1761720363569,1761720363569);
INSERT INTO master_data VALUES('cmhbmtgdv00168zds8mulhhgu','position','店長','店長',0,1761720363571,1761720363571);
INSERT INTO master_data VALUES('cmhbmtgdv00178zds4iratwh1','position','アドバイザー','アドバイザー',1,1761720363571,1761720363571);
INSERT INTO master_data VALUES('cmhbmtgdv00188zdsz5uvknbg','position','代表','代表',2,1761720363571,1761720363571);
INSERT INTO master_data VALUES('cmhbmtgdx00198zdsaqwllb8r','employeeType','正社員','正社員',0,1761720363574,1761720363574);
INSERT INTO master_data VALUES('cmhbmtgdx001a8zdsjgndcc3s','employeeType','契約社員','契約社員',1,1761720363574,1761720363574);
INSERT INTO master_data VALUES('cmhbmtgdx001b8zdshl6s0ojz','employeeType','パートタイム','パートタイム',2,1761720363574,1761720363574);
INSERT INTO master_data VALUES('cmhbmtgdx001c8zdsyfcdid1v','employeeType','派遣社員','派遣社員',3,1761720363574,1761720363574);
INSERT INTO master_data VALUES('cmhbmtgdx001d8zdslm4rrkhx','employeeType','業務委託','業務委託',4,1761720363574,1761720363574);
INSERT INTO master_data VALUES('cmhbmtgdx001e8zdsnj0lsvwx','employeeType','外注先','外注先',5,1761720363574,1761720363574);
INSERT INTO master_data VALUES('cmhbmtgdx001f8zdsnvk7ahqn','employeeType','custom_g0x7d6_1761706049688','テスト雇用',6,1761720363574,1761720363574);
INSERT INTO master_data VALUES('cmicedttr000c8zmyvic77zac','workclock_tax','standard_rate','10',0,1763943446079,1763943446079);
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
    "privacyBirthDate" BOOLEAN NOT NULL DEFAULT false,
    "orgChartLabel" TEXT,
    "description" TEXT
, "avatar" TEXT, "configVersion" TEXT, "employmentType" TEXT, "vacationPattern" TEXT, "weeklyPattern" INTEGER, "orgChartOrder" INTEGER);
INSERT INTO employees VALUES('cmh61yv6o00008ztfctj0dso0','EMP-001','EMP-001','正社員','admin','カンリシャ','admin@example.com','090-1234-5678','["執行部"]','["管理者"]','["株式会社オオサワ創研"]',NULL,1577836800000,'active','admin','admin','123456789012','admin001','https://example.com','東京都渋谷区','システム管理者です。','03-1234-5678','090-1234-5678',484963200000,1761383013216,1761998072614,1,'cmh61yv6t00068ztfehik701k',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,'1.0.1761889323744',NULL,'B-2',2,NULL);
INSERT INTO employees VALUES('cmh61yv6p00018ztf678g4tuj','EMP-002','EMP-002','正社員','somu','ソウムタントウ','hr@example.com','090-2345-6789','["総務部"]','["総務担当"]','["株式会社オオサワ創研"]',NULL,1617235200000,'active','somu','hr','234567890123','hr001','https://hr.example.com','東京都新宿区','人事・総務を担当しています。','03-2345-6789','090-2345-6789',651110400000,1761383013218,1761998072630,1,'cmh6bxkb000008zrcnaoftjor',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,'1.0.1761889323744',NULL,'B-1',1,NULL);
INSERT INTO employees VALUES('cmh61yv6q00028ztf6bx7j764','EMP-003','EMP-003','正社員','mane','マネージャー','manager@example.com','090-3456-7890','["営業部"]','["マネージャー"]','["株式会社オオサワ創研"]',NULL,1559347200000,'active','mane','manager','345678901234','manager001','https://manager.example.com','東京都港区','営業部のマネージャーです。','03-3456-7890','090-3456-7890',597715200000,1761383013219,1761998309923,1,'cmh6dnaqf000n8zt5kbecf42f',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,'1.0.1761889323744',NULL,'A',NULL,NULL);
INSERT INTO employees VALUES('cmh61yv6r00038ztfb6fy1a0o','EMP-004','EMP-004','正社員','ippan','イッパン','general1@example.com','090-4567-8901','["テスト"]','["店長"]','["株式会社オオサワ創研"]',NULL,1646870400000,'active','ippan','general','456789012345','general001','https://general1.example.com','東京都品川区','営業部で働いています。','03-4567-8901','090-4567-8901',796089600000,1761383013220,1762525113257,1,'cmh61yv6q00028ztf6bx7j764',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,'testest',NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmh61yv6s00048ztfz0yoonl9','EMP-005','EMP-005','業務委託','ippanb','イッパンシャインビー','general2@example.com','090-5678-9012','["広店"]','["アドバイザー"]','["株式会社オオサワ創研"]',NULL,1673740800000,'active','ippan','general','567890123456','general002','https://general2.example.com','東京都目黒区','開発部でエンジニアをしています。','03-5678-9012','090-5678-9012',710553600000,1761383013220,1762337009284,1,'cmh61yv6q00028ztf6bx7j764',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,'test',NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmh61yv6s00058ztf3mnhrvuh','EMP-006','EMP-006','正社員','sab','サブマネージャー','submanager@example.com','090-6789-0123','["開発部"]','["サブマネージャー"]','["株式会社オオサワ創研"]',NULL,1598918400000,'active','sab','sub_manager','678901234567','submanager001','https://submanager.example.com','東京都世田谷区','開発部のサブマネージャーです。','03-6789-0123','090-6789-0123',565228800000,1761383013221,1761998072621,1,'cmh61yv6o00008ztfctj0dso0',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,'1.0.1761889323744',NULL,'B-3',3,NULL);
INSERT INTO employees VALUES('cmh61yv6t00068ztfehik701k','EMP-007','EMP-007','正社員','店舗マネージャー','テンポマネージャー','storemanager@example.com','090-7890-1234','["店舗部"]','["店舗マネージャー"]','["株式会社オオサワ創研"]',NULL,1517443200000,'active','storemanager123','store_manager','789012345678','storemanager001','https://storemanager.example.com','東京都渋谷区','店舗運営を担当しています。','03-7890-1234','090-7890-1234',419472000000,1761383013221,1761998072598,1,'cmh6dnaqf000n8zt5kbecf42f',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,'1.0.1761889323744',NULL,'A',NULL,NULL);
INSERT INTO employees VALUES('cmh61yv6u00078ztfoxvldr6k','EMP-008','EMP-008','外注先','閲覧者','エツランシャ','viewer@example.com','090-8901-2345','["管理部"]','["閲覧者"]','["株式会社オオサワ創研"]',NULL,1704067200000,'active','etsu','general','890123456789','viewer001','https://viewer.example.com','東京都千代田区','システムの閲覧のみ可能です。','03-8901-2345','090-8901-2345',905558400000,1761383013222,1763468953116,1,'cmh6bxkb000008zrcnaoftjor',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmh66jij900008zuvym8k16wm','EMP-TOP-000','000','employee','見えないTOP',NULL,'invisible-top@company.com','','経営','未設定','株式会社テックイノベーション',NULL,1577836800000,'active','invisible-top-secure-password-2024','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1761390695062,1761390695062,1,NULL,1,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmh6bxkb000008zrcnaoftjor','001-COPY-1761399748620','001-COPY-1761399748620','正社員','大澤仁志','オオサワヒトシ',NULL,'0823278787','["執行部"]','["代表取締役"]','["株式会社オオサワ創研"]',NULL,1519862400000,'copy','sawa',NULL,'1236548984',NULL,'sooken.com','呉市広文化町6-4',NULL,'0823762008','09082454762',1738022400000,1761399748621,1761888590239,1,'cmh6dnaqf000n8zt5kbecf42f',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,'A',NULL,NULL);
INSERT INTO employees VALUES('cmh6dnaqf000n8zt5kbecf42f','002','002','正社員','大澤仁志','オオサワヒトシ','ohsawa1104@gmail.com','09082454762','["テスト"]','["代表"]','["株式会社オオサワ創研"]',NULL,1454371200000,'active','sawa1','admin',NULL,NULL,'sooken.com','呉市広古新開8-31-12',NULL,'09082454762','0823278787',1759622400000,1761402628888,1763948940903,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,'test',NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmhawbiwd00028zu09znbrma6','EMP-1761675857005','EMP-1761675857005','正社員','ten','テンチョウ',NULL,NULL,'["[]"]','["[]"]','["[]"]',NULL,1761609600000,'active','ten','store_manager',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1761675857006,1761998072650,1,'cmh61yv6t00068ztfehik701k',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,'1.0.1761889323744',NULL,'A',NULL,NULL);
INSERT INTO employees VALUES('cmhb4b37g000a8z4bhilfigpa','EMP-1761689273595','EMP-1761689273595','正社員','ten2','テンチョウ2',NULL,NULL,'["[]"]','["[]"]','["[]"]',NULL,1761609600000,'active','ten','store_manager',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1761689273597,1761998072652,1,'cmh6bxkb000008zrcnaoftjor',0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,'1.0.1761889323744',NULL,'B-4',4,NULL);
INSERT INTO employees VALUES('cmhoy1lud000b8z0cibsqrpaj','EMP-1762525279956','EMP-1762525279956','パートタイム','test1','テスト',NULL,NULL,'[]','[]','[]',NULL,1760313600000,'active','test','general',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1762525279958,1762742180721,0,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmi8caigj00028zo432ixktrr','EMP-1763698067442','EMP-1763698067442','業務委託','業務A','ギョウムエ',NULL,NULL,'["[]"]','["[]"]','["[]"]',NULL,1763683200000,'active','111','general',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1763698067443,1763698163294,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmi8cb5x2000l8zo4lepmbdc8','EMP-1763698097846','EMP-1763698097846','業務委託','業務B','ギョウムビ',NULL,NULL,'[]','[]','[]',NULL,1763698097846,'active','111','general',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1763698097847,1763698097847,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmi8cbmk000178zo4pdk0ie7f','EMP-1763698119408','EMP-1763698119408','業務委託','業務C','ギョウムシ',NULL,NULL,'[]','[]','[]',NULL,1763698119408,'active','111','general',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1763698119409,1763698119409,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO employees VALUES('cmi8ccal1001t8zo41oyzgmu0','EMP-1763698150548','EMP-1763698150548','業務委託','業務D','ギョウムディ',NULL,NULL,'[]','[]','[]',NULL,1763698150548,'active','111','general',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1763698150550,1763698150550,1,NULL,0,0,NULL,1,1,1,1,1,1,1,1,1,1,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE IF NOT EXISTS "vacation_grant_schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceYears" REAL NOT NULL,
    "fullTimeGrantDays" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
INSERT INTO grant_lots VALUES('cmhg85q0u00018zaga6verjyn','cmh6dnaqf000n8zt5kbecf42f',1470096000000,10,0,1533081600000,'140dbff85d5279fa4a63751cf7f712c50719d6590754ad0867854f39e714bbdf','1.0.1761889323744',1761998072575,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q0x00038zaggdhswk5o','cmh6dnaqf000n8zt5kbecf42f',1501632000000,11,0,1564617600000,'e53516f9c533b6eabfddc86fce68741c519809200042682533ec059cf2d634b0','1.0.1761889323744',1761998072577,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1000058zagusi1lgzk','cmh6dnaqf000n8zt5kbecf42f',1533168000000,12,0,1596240000000,'da41853381cd77d8a4d43d54161285a15aa19a1f3e63f7e0f02db693437737b2','1.0.1761889323744',1761998072580,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1500078zagxim2jnno','cmh6dnaqf000n8zt5kbecf42f',1564704000000,14,0,1627776000000,'630f6350281c3aeabb5055a4539438b1077563e20cb8105457d6989de672ee45','1.0.1761889323744',1761998072585,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1700098zag3pb6eay2','cmh6dnaqf000n8zt5kbecf42f',1596326400000,16,0,1659312000000,'ee837aef47114160a2aea1da94cc2e53e98b1dcc8d49903b0fc3c6d081b11cf5','1.0.1761889323744',1761998072587,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q18000b8zagbmquq0qf','cmh6dnaqf000n8zt5kbecf42f',1627862400000,18,0,1690848000000,'5285e14e381eb7552707b952669a7020809a521fc11edb914aca8083f08e79f5','1.0.1761889323744',1761998072589,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1c000d8zag4bqg4bj2','cmh6dnaqf000n8zt5kbecf42f',1659398400000,20,0,1722470400000,'920061f21a3ad1dd599ff9c0d650affd519095501f3fc1f752427735441f59cd','1.0.1761889323744',1761998072592,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1d000f8zagkt3ai4v1','cmh6dnaqf000n8zt5kbecf42f',1690934400000,20,0,1754006400000,'9d6b73f36e51f2c9913c4d1657f5a9e70c5f43c0fb167eac64d1db5987ca6b5d','1.0.1761889323744',1761998072593,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1e000h8zagcisy26qt','cmh6dnaqf000n8zt5kbecf42f',1722556800000,20,20,1785542400000,'1420a7f190a90cb5f43662359272774743a37d2773d56e94d07e526fd1b62fae','1.0.1761889323744',1761998072594,1761998072594);
INSERT INTO grant_lots VALUES('cmhg85q1f000j8zagwmfhahd1','cmh6dnaqf000n8zt5kbecf42f',1754092800000,20,14.5,1817078400000,'9c534b0e71505bc677e2172f32001b3afedf489e92377a96ea06e5868e44c6e2','1.0.1761889323744',1761998072595,1762326140534);
INSERT INTO grant_lots VALUES('cmhg85q1j000l8zagje1gqdmr','cmh61yv6t00068ztfehik701k',1533081600000,10,0,1596153600000,'5ceceee5756ab5b7738a8bef712007f36aa47e86b7f5ca18660fa8796b05d07a','1.0.1761889323744',1761998072600,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1k000n8zaghdkavsr8','cmh61yv6t00068ztfehik701k',1564617600000,11,0,1627689600000,'cc226b03b913306166b1a37a87b204584c4d1c3ee8403d50b64956df345178fe','1.0.1761889323744',1761998072601,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1l000p8zagw3dcbdr0','cmh61yv6t00068ztfehik701k',1596240000000,12,0,1659225600000,'bea7abacc022f5ec367d41f9b869fad82a385908dd6b1b0527b0e1d617de6b7b','1.0.1761889323744',1761998072602,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1m000r8zagh47bl5nz','cmh61yv6t00068ztfehik701k',1627776000000,14,0,1690761600000,'cfeac0b9e4764dbe350db9ebf8083854e7744b238f9e29f3f21423639b5f1762','1.0.1761889323744',1761998072603,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1n000t8zagrkentg4f','cmh61yv6t00068ztfehik701k',1659312000000,16,0,1722384000000,'f7b99b5212073b4736131c9b9f481340f491210ce740c55f57ff9e5bc90b7d72','1.0.1761889323744',1761998072603,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1n000v8zag9893g1g8','cmh61yv6t00068ztfehik701k',1690848000000,18,0,1753920000000,'ec4d97a2ea2d788485b2bb6580127b976ec1d7c5a18ff8f36611c324db99b8e0','1.0.1761889323744',1761998072604,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1o000x8zag8qrfayp4','cmh61yv6t00068ztfehik701k',1722470400000,20,20,1785456000000,'b68aa06f581d73a681b7c0c53f1253dc21834da3f9e9613c23b4bbd46ed6dac2','1.0.1761889323744',1761998072605,1761998072605);
INSERT INTO grant_lots VALUES('cmhg85q1p000z8zag5zdtbkbw','cmh61yv6t00068ztfehik701k',1754006400000,20,20,1816992000000,'d094bd5090d995eaed381252c6164d513f017a6bda56affc7355e68bfa50dc5e','1.0.1761889323744',1761998072606,1761998072606);
INSERT INTO grant_lots VALUES('cmhg85q1s00118zagletha3sl','cmh61yv6q00028ztf6bx7j764',1575158400000,10,0,1638230400000,'5f4f81b79981736f8a8a9074f5b97b7eebae49042935941b150b1af8fb3753b8','1.0.1761889323744',1761998072608,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1s00138zagvpxx5es0','cmh61yv6q00028ztf6bx7j764',1606780800000,11,0,1669766400000,'15b86f6aacfbd1936d08a60b18f7abb5133493a5239f3959b19b60b98ec678f7','1.0.1761889323744',1761998072609,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1t00158zag6oksw615','cmh61yv6q00028ztf6bx7j764',1638316800000,12,0,1701302400000,'876162dccaeccbc18786a939d7782058c88ed4c20289b03adfa0669c74a75dda','1.0.1761889323744',1761998072609,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1t00178zagkplu8slw','cmh61yv6q00028ztf6bx7j764',1669852800000,14,0,1732924800000,'fdbebead91ca9a829d0367d9b1893b9a6b5780175aa24b65d294103146bf02e9','1.0.1761889323744',1761998072610,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1v00198zagnk3jjzwp','cmh61yv6q00028ztf6bx7j764',1701388800000,16,16,1764460800000,'898b2dc5e84ef829801e0c4e5aac7d69db3f468709c39000eea4b0ece1ef0c03','1.0.1761889323744',1761998072612,1761998072612);
INSERT INTO grant_lots VALUES('cmhg85q1w001b8zag32pe5umc','cmh61yv6q00028ztf6bx7j764',1733011200000,18,4.5,1795996800000,'ee3f07df6c96a06c8eb02cd0e5de8ac023e4e06d26884c5ac52fcf17d4bac371','1.0.1761889323744',1761998072613,1762326637663);
INSERT INTO grant_lots VALUES('cmhg85q1y001d8zagzhp8mk4h','cmh61yv6o00008ztfctj0dso0',1593561600000,3,0,1656547200000,'0fc33f29a17828945234c59b8106d9103d3ed84c758c0a18d87645eabdd751d0','1.0.1761889323744',1761998072615,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q1z001f8zagaoidmwbp','cmh61yv6o00008ztfctj0dso0',1625097600000,4,0,1688083200000,'aa8b373d7957aef18b47ce0875cfabeb15d1139ef815ea8c39a2fdb3910f78cb','1.0.1761889323744',1761998072616,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q21001h8zagcwkisrlg','cmh61yv6o00008ztfctj0dso0',1656633600000,4,0,1719705600000,'311e1bb067624392f4933eb326d354eef1ca8e9fab4647b3682527ad6829c56f','1.0.1761889323744',1761998072618,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q22001j8zagz6ga5olo','cmh61yv6o00008ztfctj0dso0',1688169600000,5,0,1751241600000,'243ff902c6f367ff5d58ab943143cc416135b75ac564c2097924faa4fe8ca103','1.0.1761889323744',1761998072619,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q23001l8zagwlbmlnq8','cmh61yv6o00008ztfctj0dso0',1719792000000,6,6,1782777600000,'03e5570ac609d286a1db79842ab6e8fbaf9214385d25ccd7d1ecd34f48c0d58c','1.0.1761889323744',1761998072620,1761998072620);
INSERT INTO grant_lots VALUES('cmhg85q24001n8zagw81a66zs','cmh61yv6o00008ztfctj0dso0',1751328000000,6,6,1814313600000,'6f2178bcbb75cfecda987017108bf1f71e21aa4a15d894912b772436cefb0f98','1.0.1761889323744',1761998072620,1761998072620);
INSERT INTO grant_lots VALUES('cmhg85q26001p8zag9yuewrb9','cmh61yv6s00058ztf3mnhrvuh',1614556800000,5,0,1677542400000,'224e5485bdcc33df709e65f59ed286ff5f42ceadc77c5f9185baf8c9d21dcd56','1.0.1761889323744',1761998072623,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q28001r8zagokybpi2q','cmh61yv6s00058ztf3mnhrvuh',1646092800000,6,0,1709164800000,'6b8281698e7ed76b4a012e4dccc3f8b26b8bd6cb710269d44b8b4c10d8d1ba3b','1.0.1761889323744',1761998072624,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q29001t8zagp3fseq14','cmh61yv6s00058ztf3mnhrvuh',1677628800000,6,0,1740700800000,'99873c86cdfea23ccf006f9fe9426d315ecc759c24355794411c31be11fb6577','1.0.1761889323744',1761998072625,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q29001v8zagnqhmzvde','cmh61yv6s00058ztf3mnhrvuh',1709251200000,8,7,1772236800000,'90560451c441d10f7de13989473ac3f8b358a9a929e0df42f9d2059bf57bdc2e','1.0.1761889323744',1761998072626,1762313563834);
INSERT INTO grant_lots VALUES('cmhg85q2c001x8zagb9ehv2ql','cmh61yv6s00058ztf3mnhrvuh',1740787200000,9,0,1803772800000,'1cbed406451f8e2042fab9debe85705bd17888bd92ebc0be0c1cb31725d3fee9','1.0.1761889323744',1761998072628,1762313563833);
INSERT INTO grant_lots VALUES('cmhg85q2f001z8zagorczxrnr','cmh61yv6p00018ztf678g4tuj',1633046400000,1,0,1696032000000,'276b77a70d15a631466463cf1bc11340aaf8375bf1deb8e6a0ec76d17585a34c','1.0.1761889323744',1761998072631,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q2f00218zagso66k0wt','cmh61yv6p00018ztf678g4tuj',1664582400000,2,0,1727654400000,'d134b82fa2d6435047d71c6831d9605a13218058550eb1619c935ab811326417','1.0.1761889323744',1761998072632,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q2h00238zag3hokjw7m','cmh61yv6p00018ztf678g4tuj',1696118400000,2,0,1759190400000,'b31838304c241ada8b9f17892e13ab5fde42585a8c6b895e50b23159d0e4a60b','1.0.1761889323744',1761998072633,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q2h00258zagk29itj4o','cmh61yv6p00018ztf678g4tuj',1727740800000,2,2,1790726400000,'74d5eae743bb9802e2613bb3cba12cc9a5ca7f68d6d2dac8dc0fda4c97a45006','1.0.1761889323744',1761998072634,1761998072634);
INSERT INTO grant_lots VALUES('cmhg85q2i00278zagqlrlqt3q','cmh61yv6p00018ztf678g4tuj',1759276800000,3,3,1822262400000,'8f64334fce0fc77e310b46be7587bc027adb537527d8a744b66e200cd6c8c0e5','1.0.1761889323744',1761998072634,1761998072634);
INSERT INTO grant_lots VALUES('cmhg85q2l00298zagn2474fuk','cmh61yv6r00038ztfb6fy1a0o',1661990400000,10,0,1725062400000,'10782d8403a4d984c06811f65004319e0f1d2b41c10b07f6fa5ee027ab99d8e1','1.0.1761889323744',1761998072637,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q2l002b8zag5gmvlbry','cmh61yv6r00038ztfb6fy1a0o',1693526400000,11,0,1756598400000,'d1dfac6a36fb7b2281367b9392f5e5cca8fdf1602f69338196907023ab806c0c','1.0.1761889323744',1761998072638,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q2n002d8zaggvcj5r6q','cmh61yv6r00038ztfb6fy1a0o',1725148800000,12,5,1788134400000,'99c75963e9ced05dbf44cc61bcff50cfa48c928aeee87de607a3c7d9581e0a13','1.0.1761889323744',1761998072639,1762313238829);
INSERT INTO grant_lots VALUES('cmhg85q2p002f8zagbvw3nwar','cmh61yv6r00038ztfb6fy1a0o',1756684800000,14,0,1819670400000,'fd68c8d5f68addcecbb266fb48beb9cc0d863feebd778c2e2a90d2942a7de961','1.0.1761889323744',1761998072641,1762404228884);
INSERT INTO grant_lots VALUES('cmhg85q2r002h8zags53kjwid','cmh61yv6s00048ztfz0yoonl9',1689379200000,10,0,1752451200000,'6e5564bd61b088c595fbba78bfc228f4946ceebb5c2957cf409fea84cb823014','1.0.1761889323744',1761998072644,1762614325278);
INSERT INTO grant_lots VALUES('cmhg85q2t002j8zagc549w3yu','cmh61yv6s00048ztfz0yoonl9',1721001600000,11,11,1783987200000,'eea2824f7c79845868ebea18abd3a24fa851cab818532123a780cf73aa4e9830','1.0.1761889323744',1761998072645,1761998072645);
INSERT INTO grant_lots VALUES('cmhg85q2u002l8zag3kl8go1p','cmh61yv6s00048ztfz0yoonl9',1752537600000,12,12,1815523200000,'33f0385ff4011ab60c70486b89004677158e64250b0d545810dfe352bb4a3262','1.0.1761889323744',1761998072646,1761998072646);
INSERT INTO grant_lots VALUES('cmhg85q2w002n8zag7z2ilu14','cmh61yv6u00078ztfoxvldr6k',1719792000000,3,3,1782777600000,'3176c84ba9f3f3fb157a06ff60c590000f3aa6650e96d8951398209bf4e7c2cc','1.0.1761889323744',1761998072649,1761998072649);
INSERT INTO grant_lots VALUES('cmhg85q2x002p8zagcrbewzee','cmh61yv6u00078ztfoxvldr6k',1751328000000,4,4,1814313600000,'f7e2875694704ae3a4a6903c9870e2bc4119f95550b12561aaffe6dd6e409770','1.0.1761889323744',1761998072649,1761998072649);
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
INSERT INTO consumptions VALUES('cmhgd1fkh004b8zagmrfbzzvn','cmh6dnaqf000n8zt5kbecf42f','cmhga5uem002z8zag1a8za7s9','cmhg85q1f000j8zagwmfhahd1',1763942400000,1.166666666666666963,1762006270481);
INSERT INTO consumptions VALUES('cmhgd1fki004d8zagb2z5ae05','cmh6dnaqf000n8zt5kbecf42f','cmhga5uem002z8zag1a8za7s9','cmhg85q1f000j8zagwmfhahd1',1764028800000,1.166666666666666963,1762006270482);
INSERT INTO consumptions VALUES('cmhgd1fki004f8zagqgv4sgf0','cmh6dnaqf000n8zt5kbecf42f','cmhga5uem002z8zag1a8za7s9','cmhg85q1f000j8zagwmfhahd1',1764115200000,1.166666666666666074,1762006270483);
INSERT INTO consumptions VALUES('cmhl9vsw2001v8z2bugnman3z','cmh61yv6r00038ztfb6fy1a0o','cmhl9vsw0001t8z2bqu33b64b','cmhg85q2p002f8zagbvw3nwar',1754006400000,1.25,1762303299842);
INSERT INTO consumptions VALUES('cmhl9vsw2001x8z2bold88719','cmh61yv6r00038ztfb6fy1a0o','cmhl9vsw0001t8z2bqu33b64b','cmhg85q2p002f8zagbvw3nwar',1754092800000,1.25,1762303299842);
INSERT INTO consumptions VALUES('cmhl9vsw2001z8z2bj6lvxtpf','cmh61yv6r00038ztfb6fy1a0o','cmhl9vsw0001t8z2bqu33b64b','cmhg85q2p002f8zagbvw3nwar',1754179200000,1.25,1762303299842);
INSERT INTO consumptions VALUES('cmhl9vsw200218z2bx4wy5spw','cmh61yv6r00038ztfb6fy1a0o','cmhl9vsw0001t8z2bqu33b64b','cmhg85q2p002f8zagbvw3nwar',1754265600000,1.25,1762303299843);
INSERT INTO consumptions VALUES('cmhla0tg200278z2b47rjnnhi','cmh61yv6r00038ztfb6fy1a0o','cmhla0tfy00258z2bfvfxav91','cmhg85q2p002f8zagbvw3nwar',1751328000000,1.25,1762303533842);
INSERT INTO consumptions VALUES('cmhla0tg200298z2b650odrwg','cmh61yv6r00038ztfb6fy1a0o','cmhla0tfy00258z2bfvfxav91','cmhg85q2p002f8zagbvw3nwar',1751414400000,1.25,1762303533842);
INSERT INTO consumptions VALUES('cmhla0tg2002b8z2beubm9dp6','cmh61yv6r00038ztfb6fy1a0o','cmhla0tfy00258z2bfvfxav91','cmhg85q2p002f8zagbvw3nwar',1751500800000,0.5,1762303533843);
INSERT INTO consumptions VALUES('cmhla0tg3002d8z2btvndwk2q','cmh61yv6r00038ztfb6fy1a0o','cmhla0tfy00258z2bfvfxav91','cmhg85q2n002d8zaggvcj5r6q',1751587200000,1.25,1762303533843);
INSERT INTO consumptions VALUES('cmhlek757002l8z2b0jgi11kg','cmh61yv6r00038ztfb6fy1a0o','cmhlek756002j8z2b2ddukvuc','cmhg85q2n002d8zaggvcj5r6q',1751673600000,1.333333333333333037,1762311156524);
INSERT INTO consumptions VALUES('cmhlek758002n8z2bfdxlsb1d','cmh61yv6r00038ztfb6fy1a0o','cmhlek756002j8z2b2ddukvuc','cmhg85q2n002d8zaggvcj5r6q',1751760000000,1.333333333333333037,1762311156524);
INSERT INTO consumptions VALUES('cmhlek758002p8z2bcp3jh6yy','cmh61yv6r00038ztfb6fy1a0o','cmhlek756002j8z2b2ddukvuc','cmhg85q2n002d8zaggvcj5r6q',1751846400000,1.333333333333333037,1762311156524);
INSERT INTO consumptions VALUES('cmhlfwz5i002z8z2bbihz0gdn','cmh61yv6s00058ztf3mnhrvuh','cmhlfwz5f002x8z2b27a10kbt','cmhg85q2c001x8zagb9ehv2ql',1736035200000,1.5,1762313432310);
INSERT INTO consumptions VALUES('cmhlfwz5i00318z2bnza0lj9v','cmh61yv6s00058ztf3mnhrvuh','cmhlfwz5f002x8z2b27a10kbt','cmhg85q2c001x8zagb9ehv2ql',1736121600000,1.5,1762313432311);
INSERT INTO consumptions VALUES('cmhlfy9c500378z2beglzrngc','cmh61yv6s00058ztf3mnhrvuh','cmhlfy9c200358z2b0cnpshl8','cmhg85q2c001x8zagb9ehv2ql',1730764800000,2,1762313492165);
INSERT INTO consumptions VALUES('cmhlfzsmy003d8z2buo9jabru','cmh61yv6s00058ztf3mnhrvuh','cmhlfywha003b8z2bo2d9tkoj','cmhg85q2c001x8zagb9ehv2ql',1764201600000,1.25,1762313563834);
INSERT INTO consumptions VALUES('cmhlfzsmz003f8z2b7grkfu2l','cmh61yv6s00058ztf3mnhrvuh','cmhlfywha003b8z2bo2d9tkoj','cmhg85q2c001x8zagb9ehv2ql',1764288000000,1.25,1762313563835);
INSERT INTO consumptions VALUES('cmhlfzsmz003h8z2bwwmm6f4q','cmh61yv6s00058ztf3mnhrvuh','cmhlfywha003b8z2bo2d9tkoj','cmhg85q2c001x8zagb9ehv2ql',1764374400000,1.25,1762313563835);
INSERT INTO consumptions VALUES('cmhlfzsmz003j8z2bp38cbhbq','cmh61yv6s00058ztf3mnhrvuh','cmhlfywha003b8z2bo2d9tkoj','cmhg85q2c001x8zagb9ehv2ql',1764460800000,0.25,1762313563836);
INSERT INTO consumptions VALUES('cmhlnhcvp003r8z2b99wr0irh','cmh6dnaqf000n8zt5kbecf42f','cmhgcn5fe003t8zagksx7r5d1','cmhg85q1f000j8zagwmfhahd1',1761436800000,1,1762326140534);
INSERT INTO consumptions VALUES('cmhlnhcvp003t8z2bopc87z64','cmh6dnaqf000n8zt5kbecf42f','cmhgcn5fe003t8zagksx7r5d1','cmhg85q1f000j8zagwmfhahd1',1761523200000,1,1762326140534);
INSERT INTO consumptions VALUES('cmhlnpkhd003x8z2bjeuswsvi','cmh61yv6q00028ztf6bx7j764','cmhlnpkhc003v8z2beji8hqxf','cmhg85q1w001b8zag32pe5umc',1727740800000,1.055555555555556024,1762326523633);
INSERT INTO consumptions VALUES('cmhlnpkhd003z8z2bzy0hhqet','cmh61yv6q00028ztf6bx7j764','cmhlnpkhc003v8z2beji8hqxf','cmhg85q1w001b8zag32pe5umc',1727827200000,1.055555555555556024,1762326523633);
INSERT INTO consumptions VALUES('cmhlnpkhd00418z2b5lsgdgq0','cmh61yv6q00028ztf6bx7j764','cmhlnpkhc003v8z2beji8hqxf','cmhg85q1w001b8zag32pe5umc',1727913600000,1.055555555555556024,1762326523633);
INSERT INTO consumptions VALUES('cmhlnpkhd00438z2b6g1scvhm','cmh61yv6q00028ztf6bx7j764','cmhlnpkhc003v8z2beji8hqxf','cmhg85q1w001b8zag32pe5umc',1728000000000,1.055555555555556024,1762326523634);
INSERT INTO consumptions VALUES('cmhlnpkhd00458z2blv6b383j','cmh61yv6q00028ztf6bx7j764','cmhlnpkhc003v8z2beji8hqxf','cmhg85q1w001b8zag32pe5umc',1728086400000,1.055555555555556024,1762326523634);
INSERT INTO consumptions VALUES('cmhlnpkhd00478z2b1at5rwko','cmh61yv6q00028ztf6bx7j764','cmhlnpkhc003v8z2beji8hqxf','cmhg85q1w001b8zag32pe5umc',1728172800000,1.055555555555556024,1762326523634);
INSERT INTO consumptions VALUES('cmhlnpkhd00498z2b0gi6pdaw','cmh61yv6q00028ztf6bx7j764','cmhlnpkhc003v8z2beji8hqxf','cmhg85q1w001b8zag32pe5umc',1728259200000,1.055555555555556024,1762326523634);
INSERT INTO consumptions VALUES('cmhlnpkhd004b8z2bncx13q31','cmh61yv6q00028ztf6bx7j764','cmhlnpkhc003v8z2beji8hqxf','cmhg85q1w001b8zag32pe5umc',1728345600000,1.055555555555556024,1762326523634);
INSERT INTO consumptions VALUES('cmhlnpkhe004d8z2bfahwi68n','cmh61yv6q00028ztf6bx7j764','cmhlnpkhc003v8z2beji8hqxf','cmhg85q1w001b8zag32pe5umc',1728432000000,1.055555555555556024,1762326523634);
INSERT INTO consumptions VALUES('cmhlns0gv004j8z2bb8u07p2v','cmh61yv6q00028ztf6bx7j764','cmhlnrlwf004h8z2bhlcw4z8q','cmhg85q1w001b8zag32pe5umc',1762300800000,1.333333333333333037,1762326637664);
INSERT INTO consumptions VALUES('cmhlns0gw004l8z2bhbox9zrt','cmh61yv6q00028ztf6bx7j764','cmhlnrlwf004h8z2bhlcw4z8q','cmhg85q1w001b8zag32pe5umc',1762387200000,1.333333333333333037,1762326637664);
INSERT INTO consumptions VALUES('cmhlns0gw004n8z2b5mqe8byt','cmh61yv6q00028ztf6bx7j764','cmhlnrlwf004h8z2bhlcw4z8q','cmhg85q1w001b8zag32pe5umc',1762473600000,1.333333333333333037,1762326637664);
CREATE TABLE IF NOT EXISTS "time_off_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "unit" TEXT NOT NULL,
    "hoursPerDay" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" DATETIME,
    "totalDays" DECIMAL,
    "breakdownJson" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, supervisorId TEXT, approvedBy TEXT, finalizedBy TEXT,
    CONSTRAINT "time_off_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO time_off_requests VALUES('cmhga5uem002z8zag1a8za7s9','cmh61yv6r00038ztfb6fy1a0o',1763942400000,1764201600000,'DAY',NULL,'APPROVED',1762006270483,3.5,'{"totalDays":3.5,"breakdown":[{"lotId":"cmhg85q1f000j8zagwmfhahd1","days":3.5}]}','テスト',1762001437486,1762006270483,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhgbi0r0003b8zag4en1b022','cmh61yv6r00038ztfb6fy1a0o',1763942400000,1764288000000,'DAY',NULL,'REJECTED',NULL,5,NULL,'test',1762003685196,1762005715814,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhgcn5fe003t8zagksx7r5d1','cmh61yv6r00038ztfb6fy1a0o',1761436800000,1761609600000,'DAY',NULL,'APPROVED',1762326140533,2,'{"totalDays":2,"breakdown":[{"lotId":"cmhg85q1f000j8zagwmfhahd1","days":2}]}','test （代理申請: 大澤仁志）',1762005604155,1762326140534,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhkg7cgg001p8z2bxb10v7bn','cmh61yv6s00058ztf3mnhrvuh',1763510400000,1763683200000,'DAY',NULL,'REJECTED',NULL,3,NULL,'test',1762253449936,1762253476657,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhl9vsw0001t8z2bqu33b64b','cmh61yv6r00038ztfb6fy1a0o',1754006400000,1754352000000,'DAY',NULL,'APPROVED',1762303299842,5,'{"totalDays":5,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":5}]}','test （代理申請: 大澤仁志）',1762303299841,1762303299843,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhla0tfy00258z2bfvfxav91','cmh61yv6r00038ztfb6fy1a0o',1751328000000,1751673600000,'DAY',NULL,'APPROVED',1762303533843,5,'{"totalDays":5,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":3},{"lotId":"cmhg85q2n002d8zaggvcj5r6q","days":2}]}','rtest （代理申請: 大澤仁志）',1762303533838,1762303533843,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhlek756002j8z2b2ddukvuc','cmh61yv6r00038ztfb6fy1a0o',1751673600000,1751932800000,'DAY',NULL,'APPROVED',1762311156524,4,'{"totalDays":4,"breakdown":[{"lotId":"cmhg85q2n002d8zaggvcj5r6q","days":4}]}','testestt （代理申請: 大澤仁志）',1762311156522,1762311156525,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhlfs59l002t8z2b8ezzmex7','cmh61yv6r00038ztfb6fy1a0o',1764288000000,1764288000000,'DAY',NULL,'APPROVED',1762313238829,1,'{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2n002d8zaggvcj5r6q","days":1}]}','テスト （代理申請: 大澤仁志）',1762313206953,1762313238829,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhlfwz5f002x8z2b27a10kbt','cmh61yv6s00058ztf3mnhrvuh',1736035200000,1736208000000,'DAY',NULL,'APPROVED',1762313432310,3,'{"totalDays":3,"breakdown":[{"lotId":"cmhg85q2c001x8zagb9ehv2ql","days":3}]}','test （代理申請: 大澤仁志）',1762313432307,1762313432311,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhlfy9c200358z2b0cnpshl8','cmh61yv6s00058ztf3mnhrvuh',1730764800000,1730851200000,'DAY',NULL,'APPROVED',1762313492165,2,'{"totalDays":2,"breakdown":[{"lotId":"cmhg85q2c001x8zagb9ehv2ql","days":2}]}','test （代理申請: 大澤仁志）',1762313492162,1762313492166,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhlfywha003b8z2bo2d9tkoj','cmh61yv6s00058ztf3mnhrvuh',1764201600000,1764547200000,'DAY',NULL,'APPROVED',1762313563835,5,'{"totalDays":5,"breakdown":[{"lotId":"cmhg85q2c001x8zagb9ehv2ql","days":4},{"lotId":"cmhg85q29001v8zagnqhmzvde","days":1}]}','test （代理申請: 大澤仁志）',1762313522159,1762313563836,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhlnpkhc003v8z2beji8hqxf','cmh61yv6q00028ztf6bx7j764',1727740800000,1728518400000,'DAY',NULL,'APPROVED',1762326523634,9.5,'{"totalDays":9.5,"breakdown":[{"lotId":"cmhg85q1w001b8zag32pe5umc","days":9.5}]}','test （代理申請: 大澤仁志）',1762326523632,1762326523634,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhlnrlwf004h8z2bhlcw4z8q','cmh61yv6q00028ztf6bx7j764',1762300800000,1762560000000,'DAY',NULL,'APPROVED',1762326637664,4,'{"totalDays":4,"breakdown":[{"lotId":"cmhg85q1w001b8zag32pe5umc","days":4}]}','test （代理申請: 大澤仁志）',1762326618783,1762326637665,NULL,NULL,NULL);
INSERT INTO time_off_requests VALUES('cmhmsx36r000j8zf2sttknt05','cmh61yv6r00038ztfb6fy1a0o',1764547200000,1764547200000,'DAY',NULL,'APPROVED',1762397173378,1,'{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]}','test',1762395738724,1762399891832,'cmhawbiwd00028zu09znbrma6','cmhawbiwd00028zu09znbrma6','cmh6dnaqf000n8zt5kbecf42f');
INSERT INTO time_off_requests VALUES('cmhmsyf9h000l8zf2amvwb2rz','cmh61yv6r00038ztfb6fy1a0o',1764806400000,1764806400000,'DAY',NULL,'APPROVED',1762397361663,1,'{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]}','test',1762395801029,1762403239364,'cmh61yv6q00028ztf6bx7j764','cmh6dnaqf000n8zt5kbecf42f','cmh6dnaqf000n8zt5kbecf42f');
INSERT INTO time_off_requests VALUES('cmhmtyrya00018ze57sqewgp0','cmh61yv6r00038ztfb6fy1a0o',1764979200000,1764979200000,'DAY',NULL,'APPROVED',1762397576578,1,'{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]}','test',1762397497091,1762404228885,'cmhawbiwd00028zu09znbrma6','cmhawbiwd00028zu09znbrma6','cmh6dnaqf000n8zt5kbecf42f');
INSERT INTO time_off_requests VALUES('cmhmu2j3a00078ze5wtiaai3h','cmh61yv6r00038ztfb6fy1a0o',1764720000000,1764720000000,'DAY',NULL,'APPROVED',1762399893962,1,'{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]}','testes',1762397672231,1762401601907,'cmhawbiwd00028zu09znbrma6','cmh6dnaqf000n8zt5kbecf42f','cmh6dnaqf000n8zt5kbecf42f');
INSERT INTO time_off_requests VALUES('cmhmwcubs00058zu62w9m14f8','cmh61yv6r00038ztfb6fy1a0o',1765152000000,1765152000000,'DAY',NULL,'APPROVED',1762401625824,1,NULL,'test',1762401512585,1762401625826,'cmhawbiwd00028zu09znbrma6','cmh6dnaqf000n8zt5kbecf42f',NULL);
INSERT INTO time_off_requests VALUES('cmhmwtlcy000f8zu6ziupiaxl','cmh61yv6r00038ztfb6fy1a0o',1762387200000,1762387200000,'DAY',NULL,'APPROVED',1762402323490,1,'{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]}',replace('テスト\n','\n',char(10)),1762402294114,1762403020129,'cmhawbiwd00028zu09znbrma6','cmh6dnaqf000n8zt5kbecf42f','cmh6dnaqf000n8zt5kbecf42f');
INSERT INTO time_off_requests VALUES('cmhmxetwo000t8zu6rduub9xm','cmh61yv6r00038ztfb6fy1a0o',1762732800000,1762819200000,'DAY',NULL,'APPROVED',1762403328270,1.5,NULL,'test',1762403284968,1762403328270,'cmhawbiwd00028zu09znbrma6','cmh6dnaqf000n8zt5kbecf42f',NULL);
INSERT INTO time_off_requests VALUES('cmhmxlhel00118zu6bptr0geu','cmh61yv6r00038ztfb6fy1a0o',1764201600000,1764201600000,'DAY',NULL,'PENDING',NULL,1,NULL,'test',1762403595358,1762403595358,'cmhawbiwd00028zu09znbrma6',NULL,NULL);
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
INSERT INTO audit_logs VALUES('cmhfsl5hr006g8z1ypoe5rnjp','cmh61yv6r00038ztfb6fy1a0o','system','REQUEST_REJECT','TimeOffRequest:cmhfsjctq006e8z1ya7z3xj93','{"reason":"test"}',1761971918607);
INSERT INTO audit_logs VALUES('cmhfszew6006k8z1yaksjs2d3','cmh61yv6r00038ztfb6fy1a0o','user:cmh61yv6r00038ztfb6fy1a0o','REQUEST_APPROVE','TimeOffRequest:cmhfseu51006a8z1ynb5z4k3d','{"breakdown":{"totalDays":2,"breakdown":[{"lotId":"cmhefofcr003s8z1yi0xdm4q1","days":2}]},"daysToUse":2}',1761972583975);
INSERT INTO audit_logs VALUES('cmhftpznl006s8z1ynj3gfzpr','cmh61yv6r00038ztfb6fy1a0o','user:cmh61yv6r00038ztfb6fy1a0o','REQUEST_APPROVE','TimeOffRequest:cmhfs81si00668z1yvnxc13yh','{"breakdown":{"totalDays":3,"breakdown":[{"lotId":"cmhefofcr003s8z1yi0xdm4q1","days":3}]},"daysToUse":3}',1761973823937);
INSERT INTO audit_logs VALUES('cmhgb8vzb00358zagyv46dk8g','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhga5d8v002x8zagx6roq5o9','{"breakdown":{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]},"daysToUse":1}',1762003259112);
INSERT INTO audit_logs VALUES('cmhgbh77w00398zagjkp0xhb3','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_REJECT','TimeOffRequest:cmhga5uem002z8zag1a8za7s9','{"reason":"テスト"}',1762003646925);
INSERT INTO audit_logs VALUES('cmhgbso7b003p8zagpzanr9w3','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhgbso76003f8zagvmfokk3e','{"breakdown":{"totalDays":5,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":5}]},"daysToUse":5,"autoApproved":true}',1762004182152);
INSERT INTO audit_logs VALUES('cmhgcn5fi003z8zaggli3fnbe','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhgcn5fe003t8zagksx7r5d1','{"breakdown":{"totalDays":3,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":3}]},"daysToUse":3,"autoApproved":true}',1762005604159);
INSERT INTO audit_logs VALUES('cmhgcpjl300418zagjtld8ohn','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_REJECT','TimeOffRequest:cmhgbi0r0003b8zag4en1b022','{"reason":"test"}',1762005715815);
INSERT INTO audit_logs VALUES('cmhgcqdfg00458zag2fw58yxa','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhga5uem002z8zag1a8za7s9','{"breakdown":{"totalDays":2,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":2}]},"daysToUse":2}',1762005754493);
INSERT INTO audit_logs VALUES('cmhkg3qez001n8z2bvqzv5wwz','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhgcmq7w003r8zagijkkrqxj','{"breakdown":{"totalDays":5,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":5}]},"daysToUse":5}',1762253281403);
INSERT INTO audit_logs VALUES('cmhkg7x2q001r8z2bmtd57vmp','cmh61yv6s00058ztf3mnhrvuh','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_REJECT','TimeOffRequest:cmhkg7cgg001p8z2bxb10v7bn','{"reason":"test"}',1762253476658);
INSERT INTO audit_logs VALUES('cmhl9vsw300238z2boi8mas4e','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhl9vsw0001t8z2bqu33b64b','{"breakdown":{"totalDays":5,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":5}]},"daysToUse":5,"autoApproved":true}',1762303299843);
INSERT INTO audit_logs VALUES('cmhla0tg4002f8z2bxk8551yn','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhla0tfy00258z2bfvfxav91','{"breakdown":{"totalDays":5,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":3},{"lotId":"cmhg85q2n002d8zaggvcj5r6q","days":2}]},"daysToUse":5,"autoApproved":true}',1762303533844);
INSERT INTO audit_logs VALUES('cmhlek758002r8z2bl7rcwr5i','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhlek756002j8z2b2ddukvuc','{"breakdown":{"totalDays":4,"breakdown":[{"lotId":"cmhg85q2n002d8zaggvcj5r6q","days":4}]},"daysToUse":4,"autoApproved":true}',1762311156525);
INSERT INTO audit_logs VALUES('cmhlfstv1002v8z2bbx150kyq','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhlfs59l002t8z2b8ezzmex7','{"breakdown":{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2n002d8zaggvcj5r6q","days":1}]},"daysToUse":1}',1762313238830);
INSERT INTO audit_logs VALUES('cmhlfwz5j00338z2bwiu2i5ey','cmh61yv6s00058ztf3mnhrvuh','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhlfwz5f002x8z2b27a10kbt','{"breakdown":{"totalDays":3,"breakdown":[{"lotId":"cmhg85q2c001x8zagb9ehv2ql","days":3}]},"daysToUse":3,"autoApproved":true}',1762313432311);
INSERT INTO audit_logs VALUES('cmhlfy9c700398z2bhtgbllqf','cmh61yv6s00058ztf3mnhrvuh','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhlfy9c200358z2b0cnpshl8','{"breakdown":{"totalDays":2,"breakdown":[{"lotId":"cmhg85q2c001x8zagb9ehv2ql","days":2}]},"daysToUse":2,"autoApproved":true}',1762313492167);
INSERT INTO audit_logs VALUES('cmhlfzsn0003l8z2biuhow26o','cmh61yv6s00058ztf3mnhrvuh','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhlfywha003b8z2bo2d9tkoj','{"breakdown":{"totalDays":5,"breakdown":[{"lotId":"cmhg85q2c001x8zagb9ehv2ql","days":4},{"lotId":"cmhg85q29001v8zagnqhmzvde","days":1}]},"daysToUse":5}',1762313563837);
INSERT INTO audit_logs VALUES('cmhlnpkhe004f8z2brmvwfmn8','cmh61yv6q00028ztf6bx7j764','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhlnpkhc003v8z2beji8hqxf','{"breakdown":{"totalDays":9.5,"breakdown":[{"lotId":"cmhg85q1w001b8zag32pe5umc","days":9.5}]},"daysToUse":9.5,"autoApproved":true}',1762326523634);
INSERT INTO audit_logs VALUES('cmhlns0gw004p8z2bjc6whgbm','cmh61yv6q00028ztf6bx7j764','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhlnrlwf004h8z2bhlcw4z8q','{"breakdown":{"totalDays":4,"breakdown":[{"lotId":"cmhg85q1w001b8zag32pe5umc","days":4}]},"daysToUse":4}',1762326637665);
INSERT INTO audit_logs VALUES('cmhmsrpe5000f8zf2xieongbj','cmh61yv6r00038ztfb6fy1a0o','user:cmhawbiwd00028zu09znbrma6','REQUEST_APPROVE','TimeOffRequest:cmhmsn1ha00018zf2hwvq9m4x','{"daysToUse":1,"pendingFinalization":true}',1762395487565);
INSERT INTO audit_logs VALUES('cmhmtru6b00018zzu0fe5ais0','cmh61yv6r00038ztfb6fy1a0o','user:cmhawbiwd00028zu09znbrma6','REQUEST_APPROVE','TimeOffRequest:cmhmsx36r000j8zf2sttknt05','{"daysToUse":1,"pendingFinalization":true}',1762397173380);
INSERT INTO audit_logs VALUES('cmhmtvvgg00058zzuqp863oml','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhmsyf9h000l8zf2amvwb2rz','{"daysToUse":1,"pendingFinalization":true}',1762397361664);
INSERT INTO audit_logs VALUES('cmhmu0hac00038ze5cp3c06yy','cmh61yv6r00038ztfb6fy1a0o','user:cmhawbiwd00028zu09znbrma6','REQUEST_APPROVE','TimeOffRequest:cmhmtyrya00018ze57sqewgp0','{"daysToUse":1,"pendingFinalization":true}',1762397576580);
INSERT INTO audit_logs VALUES('cmhmve3qw000l8ze5tqpgv0fl','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_FINALIZE','TimeOffRequest:cmhmsx36r000j8zf2sttknt05','{"breakdown":{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]},"daysToUse":1}',1762399891832);
INSERT INTO audit_logs VALUES('cmhmve5e3000n8ze5djb96rwh','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhmu2j3a00078ze5wtiaai3h','{"daysToUse":1,"pendingFinalization":true}',1762399893963);
INSERT INTO audit_logs VALUES('cmhmwer8z00098zu6tb1wuiyl','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_FINALIZE','TimeOffRequest:cmhmu2j3a00078ze5wtiaai3h','{"breakdown":{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]},"daysToUse":1}',1762401601908);
INSERT INTO audit_logs VALUES('cmhmwf9pn000b8zu6a0gx377k','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhmwcubs00058zu62w9m14f8','{"daysToUse":1,"pendingFinalization":true}',1762401625835);
INSERT INTO audit_logs VALUES('cmhmwu80y000h8zu62gt1e0ne','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhmwtlcy000f8zu6ziupiaxl','{"daysToUse":1,"pendingFinalization":true}',1762402323491);
INSERT INTO audit_logs VALUES('cmhmx95k1000n8zu6vsfx5b55','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_FINALIZE','TimeOffRequest:cmhmwtlcy000f8zu6ziupiaxl','{"breakdown":{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]},"daysToUse":1}',1762403020130);
INSERT INTO audit_logs VALUES('cmhmxdupw000p8zu632lv877n','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_FINALIZE','TimeOffRequest:cmhmsyf9h000l8zf2amvwb2rz','{"breakdown":{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]},"daysToUse":1}',1762403239365);
INSERT INTO audit_logs VALUES('cmhmxfrbj000v8zu6clpcddv4','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_APPROVE','TimeOffRequest:cmhmxetwo000t8zu6rduub9xm','{"daysToUse":1.5,"pendingFinalization":true}',1762403328272);
INSERT INTO audit_logs VALUES('cmhmxz28l00078z2n7zkq7gtj','cmh61yv6r00038ztfb6fy1a0o','user:cmh6dnaqf000n8zt5kbecf42f','REQUEST_FINALIZE','TimeOffRequest:cmhmtyrya00018ze57sqewgp0','{"breakdown":{"totalDays":1,"breakdown":[{"lotId":"cmhg85q2p002f8zagbvw3nwar","days":1}]},"daysToUse":1}',1762404228886);
CREATE TABLE IF NOT EXISTS "vacation_app_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO vacation_app_configs VALUES('cmheeb9d700028z1yamvc4iiq','1.0.1761887476243','{"version":"1.0.1761887476243","baselineRule":{"kind":"RELATIVE_FROM_JOIN","initialGrantAfterMonths":6,"cycleMonths":12},"grantCycleMonths":12,"expiry":{"kind":"YEARS","years":2},"rounding":{"unit":"DAY","mode":"ROUND"},"minLegalUseDaysPerYear":5,"fullTime":{"label":"A","table":[{"years":0.5,"days":10},{"years":1.5,"days":11},{"years":2.5,"days":12},{"years":3.5,"days":14},{"years":4.5,"days":16},{"years":5.5,"days":18},{"years":6.5,"days":20}]},"partTime":{"labels":{"1":"B-1","2":"B-2","3":"B-3","4":"B-4"},"tables":[{"weeklyPattern":1,"grants":[{"years":0.5,"days":7},{"years":1.5,"days":8},{"years":2.5,"days":9},{"years":3.5,"days":0},{"years":4.5,"days":0},{"years":5.5,"days":0},{"years":6.5,"days":0}],"minAnnualWorkdays":48,"maxAnnualWorkdays":72},{"weeklyPattern":2,"grants":[{"years":0.5,"days":7},{"years":1.5,"days":8},{"years":2.5,"days":9},{"years":3.5,"days":0},{"years":4.5,"days":0},{"years":5.5,"days":0},{"years":6.5,"days":0}],"minAnnualWorkdays":73,"maxAnnualWorkdays":120},{"weeklyPattern":3,"grants":[{"years":0.5,"days":7},{"years":1.5,"days":8},{"years":2.5,"days":9},{"years":3.5,"days":0},{"years":4.5,"days":0},{"years":5.5,"days":0},{"years":6.5,"days":0}],"minAnnualWorkdays":121,"maxAnnualWorkdays":168},{"weeklyPattern":4,"grants":[{"years":0.5,"days":7},{"years":1.5,"days":8},{"years":2.5,"days":9},{"years":3.5,"days":0},{"years":4.5,"days":0},{"years":5.5,"days":0},{"years":6.5,"days":0}],"minAnnualWorkdays":169,"maxAnnualWorkdays":216}]},"alert":{"checkpoints":[{"monthsBefore":3,"minConsumedDays":5},{"monthsBefore":2,"minConsumedDays":3},{"monthsBefore":1,"minConsumedDays":5}]}}',0,1761887476267,1761887617320);
INSERT INTO vacation_app_configs VALUES('cmheeea6z00038z1yqupesfev','1.0.1761887617258','{"version":"1.0.1761887617258","baselineRule":{"kind":"RELATIVE_FROM_JOIN","initialGrantAfterMonths":6,"cycleMonths":12},"grantCycleMonths":12,"expiry":{"kind":"YEARS","years":2},"rounding":{"unit":"DAY","mode":"ROUND"},"minLegalUseDaysPerYear":5,"fullTime":{"label":"A","table":[{"years":0.5,"days":10},{"years":1.5,"days":11},{"years":2.5,"days":12},{"years":3.5,"days":14},{"years":4.5,"days":16},{"years":5.5,"days":18},{"years":6.5,"days":20}]},"partTime":{"labels":{"1":"B-1","2":"B-2","3":"B-3","4":"B-4"},"tables":[{"weeklyPattern":1,"grants":[{"years":0.5,"days":1},{"years":1.5,"days":2},{"years":2.5,"days":2},{"years":3.5,"days":2},{"years":4.5,"days":3},{"years":5.5,"days":3},{"years":6.5,"days":3}],"minAnnualWorkdays":48,"maxAnnualWorkdays":72},{"weeklyPattern":2,"grants":[{"years":0.5,"days":3},{"years":1.5,"days":4},{"years":2.5,"days":4},{"years":3.5,"days":5},{"years":4.5,"days":6},{"years":5.5,"days":6},{"years":6.5,"days":7}],"minAnnualWorkdays":73,"maxAnnualWorkdays":120},{"weeklyPattern":3,"grants":[{"years":0.5,"days":5},{"years":1.5,"days":6},{"years":2.5,"days":6},{"years":3.5,"days":8},{"years":4.5,"days":9},{"years":5.5,"days":10},{"years":6.5,"days":11}],"minAnnualWorkdays":121,"maxAnnualWorkdays":168},{"weeklyPattern":4,"grants":[{"years":0.5,"days":7},{"years":1.5,"days":8},{"years":2.5,"days":9},{"years":3.5,"days":10},{"years":4.5,"days":12},{"years":5.5,"days":13},{"years":6.5,"days":15}],"minAnnualWorkdays":169,"maxAnnualWorkdays":216}]},"alert":{"checkpoints":[{"monthsBefore":3,"minConsumedDays":5},{"monthsBefore":2,"minConsumedDays":3},{"monthsBefore":1,"minConsumedDays":5}]}}',0,1761887617308,1761888232538);
INSERT INTO vacation_app_configs VALUES('cmheergvy00048z1y86z3rudy','1.0.1761888232454','{"version":"1.0.1761888232454","baselineRule":{"kind":"RELATIVE_FROM_JOIN","initialGrantAfterMonths":6,"cycleMonths":12},"grantCycleMonths":12,"expiry":{"kind":"YEARS","years":2},"rounding":{"unit":"DAY","mode":"ROUND"},"minLegalUseDaysPerYear":5,"fullTime":{"label":"A","table":[{"years":0.5,"days":10},{"years":1.5,"days":11},{"years":2.5,"days":12},{"years":3.5,"days":14},{"years":4.5,"days":16},{"years":5.5,"days":18},{"years":6.5,"days":20}]},"partTime":{"labels":{"1":"B-1","2":"B-2","3":"B-3","4":"B-4"},"tables":[{"weeklyPattern":1,"grants":[{"years":0.5,"days":1},{"years":1.5,"days":2},{"years":2.5,"days":2},{"years":3.5,"days":2},{"years":4.5,"days":3},{"years":5.5,"days":3},{"years":6.5,"days":3}]},{"weeklyPattern":2,"grants":[{"years":0.5,"days":3},{"years":1.5,"days":4},{"years":2.5,"days":4},{"years":3.5,"days":5},{"years":4.5,"days":6},{"years":5.5,"days":6},{"years":6.5,"days":7}]},{"weeklyPattern":3,"grants":[{"years":0.5,"days":5},{"years":1.5,"days":6},{"years":2.5,"days":6},{"years":3.5,"days":8},{"years":4.5,"days":9},{"years":5.5,"days":10},{"years":6.5,"days":11}]},{"weeklyPattern":4,"grants":[{"years":0.5,"days":7},{"years":1.5,"days":8},{"years":2.5,"days":9},{"years":3.5,"days":10},{"years":4.5,"days":12},{"years":5.5,"days":13},{"years":6.5,"days":15}]}]},"alert":{"checkpoints":[{"monthsBefore":3,"minConsumedDays":5},{"monthsBefore":2,"minConsumedDays":3},{"monthsBefore":1,"minConsumedDays":5}]}}',0,1761888232510,1761889198546);
INSERT INTO vacation_app_configs VALUES('cmhefc69p002h8z1yj3v4mz6v','1.0.1761889198503','{"version":"1.0.1761889198503","baselineRule":{"kind":"RELATIVE_FROM_JOIN","initialGrantAfterMonths":6,"cycleMonths":12},"grantCycleMonths":12,"expiry":{"kind":"YEARS","years":2},"rounding":{"unit":"DAY","mode":"ROUND"},"minLegalUseDaysPerYear":5,"fullTime":{"label":"A","table":[{"years":0.5,"days":10},{"years":1.5,"days":11},{"years":2.5,"days":12},{"years":3.5,"days":14},{"years":4.5,"days":16},{"years":5.5,"days":18},{"years":6.5,"days":20}]},"partTime":{"labels":{"1":"B-1","2":"B-2","3":"B-3","4":"B-4"},"tables":[{"weeklyPattern":1,"grants":[{"years":0.5,"days":1},{"years":1.5,"days":2},{"years":2.5,"days":2},{"years":3.5,"days":2},{"years":4.5,"days":3},{"years":5.5,"days":3},{"years":6.5,"days":3}],"minAnnualWorkdays":48,"maxAnnualWorkdays":72},{"weeklyPattern":2,"grants":[{"years":0.5,"days":3},{"years":1.5,"days":4},{"years":2.5,"days":4},{"years":3.5,"days":5},{"years":4.5,"days":6},{"years":5.5,"days":6},{"years":6.5,"days":7}],"minAnnualWorkdays":73,"maxAnnualWorkdays":120},{"weeklyPattern":3,"grants":[{"years":0.5,"days":5},{"years":1.5,"days":6},{"years":2.5,"days":6},{"years":3.5,"days":8},{"years":4.5,"days":9},{"years":5.5,"days":10},{"years":6.5,"days":11}],"minAnnualWorkdays":121,"maxAnnualWorkdays":168},{"weeklyPattern":4,"grants":[{"years":0.5,"days":7},{"years":1.5,"days":8},{"years":2.5,"days":9},{"years":3.5,"days":10},{"years":4.5,"days":12},{"years":5.5,"days":13},{"years":6.5,"days":15}],"minAnnualWorkdays":169,"maxAnnualWorkdays":216}]},"alert":{"checkpoints":[{"monthsBefore":3,"minConsumedDays":5},{"monthsBefore":2,"minConsumedDays":3},{"monthsBefore":1,"minConsumedDays":5}]}}',0,1761889198525,1761889323953);
INSERT INTO vacation_app_configs VALUES('cmhefev16002k8z1yujmod8a9','1.0.1761889323744','{"version":"1.0.1761889323744","baselineRule":{"kind":"RELATIVE_FROM_JOIN","initialGrantAfterMonths":6,"cycleMonths":12},"grantCycleMonths":12,"expiry":{"kind":"YEARS","years":2},"rounding":{"unit":"DAY","mode":"ROUND"},"minLegalUseDaysPerYear":5,"fullTime":{"label":"A","table":[{"years":0.5,"days":10},{"years":1.5,"days":11},{"years":2.5,"days":12},{"years":3.5,"days":14},{"years":4.5,"days":16},{"years":5.5,"days":18},{"years":6.5,"days":20}]},"partTime":{"labels":{"1":"B-1","2":"B-2","3":"B-3","4":"B-4"},"tables":[{"weeklyPattern":1,"grants":[{"years":0.5,"days":1},{"years":1.5,"days":2},{"years":2.5,"days":2},{"years":3.5,"days":2},{"years":4.5,"days":3},{"years":5.5,"days":3},{"years":6.5,"days":3}],"minAnnualWorkdays":48,"maxAnnualWorkdays":72},{"weeklyPattern":2,"grants":[{"years":0.5,"days":3},{"years":1.5,"days":4},{"years":2.5,"days":4},{"years":3.5,"days":5},{"years":4.5,"days":6},{"years":5.5,"days":6},{"years":6.5,"days":7}],"minAnnualWorkdays":73,"maxAnnualWorkdays":120},{"weeklyPattern":3,"grants":[{"years":0.5,"days":5},{"years":1.5,"days":6},{"years":2.5,"days":6},{"years":3.5,"days":8},{"years":4.5,"days":9},{"years":5.5,"days":10},{"years":6.5,"days":11}],"minAnnualWorkdays":121,"maxAnnualWorkdays":168},{"weeklyPattern":4,"grants":[{"years":0.5,"days":7},{"years":1.5,"days":8},{"years":2.5,"days":9},{"years":3.5,"days":10},{"years":4.5,"days":12},{"years":5.5,"days":13},{"years":6.5,"days":15}],"minAnnualWorkdays":169,"maxAnnualWorkdays":216}]},"alert":{"checkpoints":[{"monthsBefore":3,"minConsumedDays":5},{"monthsBefore":2,"minConsumedDays":3},{"monthsBefore":1,"minConsumedDays":5}]}}',1,1761889323930,1761889323954);
INSERT INTO vacation_app_configs VALUES('cmhej3qhz005f8z1ybdm7843t','1.0.1761895523292','{"version":"1.0.1761895523292","baselineRule":{"kind":"RELATIVE_FROM_JOIN","initialGrantAfterMonths":6,"cycleMonths":12},"grantCycleMonths":12,"expiry":{"kind":"YEARS","years":2},"rounding":{"unit":"DAY","mode":"ROUND"},"minLegalUseDaysPerYear":5,"fullTime":{"label":"A","table":[{"years":0.5,"days":10},{"years":1.5,"days":11},{"years":2.5,"days":12},{"years":3.5,"days":14},{"years":4.5,"days":16},{"years":5.5,"days":18},{"years":6.5,"days":20}]},"partTime":{"labels":{"1":"B-1","2":"B-2","3":"B-3","4":"B-4"},"tables":[{"weeklyPattern":1,"grants":[{"years":0.5,"days":1},{"years":1.5,"days":2},{"years":2.5,"days":2},{"years":3.5,"days":2},{"years":4.5,"days":3},{"years":5.5,"days":3},{"years":6.5,"days":3}],"minAnnualWorkdays":48,"maxAnnualWorkdays":72},{"weeklyPattern":2,"grants":[{"years":0.5,"days":3},{"years":1.5,"days":4},{"years":2.5,"days":4},{"years":3.5,"days":5},{"years":4.5,"days":6},{"years":5.5,"days":6},{"years":6.5,"days":7}],"minAnnualWorkdays":73,"maxAnnualWorkdays":120},{"weeklyPattern":3,"grants":[{"years":0.5,"days":5},{"years":1.5,"days":6},{"years":2.5,"days":6},{"years":3.5,"days":8},{"years":4.5,"days":9},{"years":5.5,"days":10},{"years":6.5,"days":11}],"minAnnualWorkdays":121,"maxAnnualWorkdays":168},{"weeklyPattern":4,"grants":[{"years":0.5,"days":7},{"years":1.5,"days":8},{"years":2.5,"days":9},{"years":3.5,"days":10},{"years":4.5,"days":12},{"years":5.5,"days":13},{"years":6.5,"days":15}],"minAnnualWorkdays":169,"maxAnnualWorkdays":216}]},"alert":{"checkpoints":[{"monthsBefore":3,"minConsumedDays":5},{"monthsBefore":2,"minConsumedDays":3},{"monthsBefore":1,"minConsumedDays":5}]}}',0,1761895523303,1761895523303);
INSERT INTO vacation_app_configs VALUES('cmhej3u33005g8z1ye275w3ua','1.0.1761895527938','{"version":"1.0.1761895527938","baselineRule":{"kind":"RELATIVE_FROM_JOIN","initialGrantAfterMonths":6,"cycleMonths":12},"grantCycleMonths":12,"expiry":{"kind":"YEARS","years":2},"rounding":{"unit":"DAY","mode":"ROUND"},"minLegalUseDaysPerYear":5,"fullTime":{"label":"A","table":[{"years":0.5,"days":10},{"years":1.5,"days":11},{"years":2.5,"days":12},{"years":3.5,"days":14},{"years":4.5,"days":16},{"years":5.5,"days":18},{"years":6.5,"days":20}]},"partTime":{"labels":{"1":"B-1","2":"B-2","3":"B-3","4":"B-4"},"tables":[{"weeklyPattern":1,"grants":[{"years":0.5,"days":1},{"years":1.5,"days":2},{"years":2.5,"days":2},{"years":3.5,"days":2},{"years":4.5,"days":3},{"years":5.5,"days":3},{"years":6.5,"days":3}],"minAnnualWorkdays":48,"maxAnnualWorkdays":72},{"weeklyPattern":2,"grants":[{"years":0.5,"days":3},{"years":1.5,"days":4},{"years":2.5,"days":4},{"years":3.5,"days":5},{"years":4.5,"days":6},{"years":5.5,"days":6},{"years":6.5,"days":7}],"minAnnualWorkdays":73,"maxAnnualWorkdays":120},{"weeklyPattern":3,"grants":[{"years":0.5,"days":5},{"years":1.5,"days":6},{"years":2.5,"days":6},{"years":3.5,"days":8},{"years":4.5,"days":9},{"years":5.5,"days":10},{"years":6.5,"days":11}],"minAnnualWorkdays":121,"maxAnnualWorkdays":168},{"weeklyPattern":4,"grants":[{"years":0.5,"days":7},{"years":1.5,"days":8},{"years":2.5,"days":9},{"years":3.5,"days":10},{"years":4.5,"days":12},{"years":5.5,"days":13},{"years":6.5,"days":15}],"minAnnualWorkdays":169,"maxAnnualWorkdays":216}]},"alert":{"checkpoints":[{"monthsBefore":3,"minConsumedDays":5},{"monthsBefore":2,"minConsumedDays":3},{"monthsBefore":1,"minConsumedDays":5}]}}',0,1761895527951,1761895527951);
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
INSERT INTO boards VALUES('cmh66sv9z00068zh5jh0avkyu','マイボード','個人用のボードです','cmh66sv9w00028zh57ozj4rtx','cmh61yv6o00008ztfctj0dso0',0,1761391131479,1761402024221);
INSERT INTO boards VALUES('cmh6dnaql000t8zt5lgttywoy','マイボード','個人用のボードです','cmh6dnaqi000p8zt5p5q792t5','cmh6dnaqf000n8zt5kbecf42f',0,1761402628893,1761402628893);
INSERT INTO boards VALUES('cmhauukh800058zufpqxyny9b','メインボード','メインのタスクボードです','cmhauuk0200018zufgrigol4l','cmh6dnaqf000n8zt5kbecf42f',0,1761673386285,1761673386285);
INSERT INTO boards VALUES('cmhauy7jb00058zbjehm3sw8q','マイボード','個人用のボードです','cmhauy7j900018zbj4yvm0xfd','cmh61yv6p00018ztf678g4tuj',0,1761673556135,1761673556135);
INSERT INTO boards VALUES('cmhauy7jf000j8zbjhy9plg48','マイボード','個人用のボードです','cmhauy7je000f8zbj3mgdfzej','cmh61yv6q00028ztf6bx7j764',0,1761673556139,1761673556139);
INSERT INTO boards VALUES('cmhauy7ji000x8zbjwgntqi0p','マイボード','個人用のボードです','cmhauy7jh000t8zbjpb9d5tyn','cmh61yv6r00038ztfb6fy1a0o',0,1761673556142,1761673556142);
INSERT INTO boards VALUES('cmhauy7jk001b8zbjy7j0e13j','マイボード','個人用のボードです','cmhauy7jk00178zbjch0s83qz','cmh61yv6s00048ztfz0yoonl9',0,1761673556145,1761673556145);
INSERT INTO boards VALUES('cmhauy7jn001p8zbjle21brqn','マイボード','個人用のボードです','cmhauy7jm001l8zbjtdo6quaa','cmh61yv6s00058ztf3mnhrvuh',0,1761673556147,1761673556147);
INSERT INTO boards VALUES('cmhauy7jp00238zbjehjs6bou','マイボード','個人用のボードです','cmhauy7jo001z8zbjbxo1i43b','cmh61yv6t00068ztfehik701k',0,1761673556149,1761673556149);
INSERT INTO boards VALUES('cmhauy7js002h8zbjng2efdbl','マイボード','個人用のボードです','cmhauy7jr002d8zbj7sqjj4ki','cmh61yv6u00078ztfoxvldr6k',0,1761673556152,1761673556152);
INSERT INTO boards VALUES('cmhauy7ju002v8zbj19tp72bi','マイボード','個人用のボードです','cmhauy7jt002r8zbjqc9c0pzc','cmh66jij900008zuvym8k16wm',0,1761673556155,1761673556155);
INSERT INTO boards VALUES('cmhauy7jx00398zbjalzghxc5','マイボード','個人用のボードです','cmhauy7jw00358zbjnoo4wzk8','cmh6bxkb000008zrcnaoftjor',0,1761673556157,1761673556157);
INSERT INTO boards VALUES('cmhawbiwq00088zu0td8ywvnu','マイボード','個人用のボードです','cmhawbiwj00048zu0aytdwr3d','cmhawbiwd00028zu09znbrma6',0,1761675857019,1761675857019);
INSERT INTO boards VALUES('cmhaxkjvx00068zmlaqapp2sq','テストボード','リスト名称の保存維持確認','cmhauuk0200018zufgrigol4l','cmh6dnaqf000n8zt5kbecf42f',0,1761677957805,1761677957805);
INSERT INTO boards VALUES('cmhb4b37o000g8z4biqgn4soy','マイボード','個人用のボードです','cmhb4b37k000c8z4bsqz5h0wa','cmhb4b37g000a8z4bhilfigpa',0,1761689273605,1761689273605);
INSERT INTO boards VALUES('cmhoy1luh000h8z0ct5xz6hsh','マイボード','個人用のボードです','cmhoy1luf000d8z0ch02go854','cmhoy1lud000b8z0cibsqrpaj',0,1762525279961,1762525279961);
INSERT INTO boards VALUES('cmi8caigo00088zo4aqm9ixwn','マイボード','個人用のボードです','cmi8caigm00048zo4r3wb8g3q','cmi8caigj00028zo432ixktrr',0,1763698067448,1763698067448);
INSERT INTO boards VALUES('cmi8cb5x6000r8zo4aviahasj','マイボード','個人用のボードです','cmi8cb5x4000n8zo4x9p9pxig','cmi8cb5x2000l8zo4lepmbdc8',0,1763698097850,1763698097850);
INSERT INTO boards VALUES('cmi8cbmk4001d8zo4sehfv5v0','マイボード','個人用のボードです','cmi8cbmk200198zo4x5mayllv','cmi8cbmk000178zo4pdk0ie7f',0,1763698119412,1763698119412);
INSERT INTO boards VALUES('cmi8ccal5001z8zo4rdg59yqh','マイボード','個人用のボードです','cmi8ccal3001v8zo47ovqwqbk','cmi8ccal1001t8zo41oyzgmu0',0,1763698150553,1763698150553);
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
INSERT INTO cards VALUES('cmh6cjs6s00038zrcn2upt4sb','test','test',0,'cmh66sva0000a8zh5j2rvkz9i','cmh66sv9z00068zh5jh0avkyu','cmh61yv6o00008ztfctj0dso0','[{"id":"cmh6ckue200058zrcu5woo8o4","name":"スクリーンショット 2025-10-25 21.08.36.png","type":"image/png","uploadDate":"2025-10-25","size":"117.78 KB","folderName":"資料"}]','[{"id":"label-1761400799516","name":"販促物","color":"#3b82f6"}]',NULL,1759676400000,'a','scheduled','#f0e5e5',0,1761400785269,1761402024221);
INSERT INTO cards VALUES('cmhavoygy00018z2kdb9y9jqq','test','ログイン時のテスト',0,'cmhaxpwt6000e8zmlezk10a29','cmh6dnaql000t8zt5lgttywoy','cmh6dnaqf000n8zt5kbecf42f','[{"id":"cmhax8v3l00048z1jecz7owms","name":"無題のドキュメント.docx","type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","uploadDate":"2025-10-28","size":"11.65 KB","folderName":"資料"},{"id":"_folders_metadata","type":"_metadata","folders":["資料","画像","参考資料"],"isMetadata":true}]','[{"id":"label-1761400799516","name":"販促物","color":"#3b82f6"}]','[{"id":"checklist-1762129135623","title":"テストリスト","items":[]}]',1764514800000,'テスト','scheduled','#f5f1f9',0,1761674804099,1762389614184);
INSERT INTO cards VALUES('cmhawvpmu00018z1jzdqxlfmm','test','',0,'cmhauy7jc00098zbjmo7acb32','cmhauy7jb00058zbjehm3sw8q','cmh6dnaqf000n8zt5kbecf42f','[]','[]',NULL,NULL,'medium','todo',NULL,0,1761676798854,1761676843781);
INSERT INTO cards VALUES('cmhaxg8au00038zmlspqsw140','test','ログイン時のテスト',1,'cmhaxpwt6000e8zmlezk10a29','cmh6dnaql000t8zt5lgttywoy','cmh6dnaqf000n8zt5kbecf42f','[{"id":"cmhblwro7000o8zds11b1ht22","name":"スクリーンショット 2025-08-27 21.32.44.png","type":"image/png","uploadDate":"2025-10-29","size":"76.66 KB","folderName":"test"},{"id":"cmhbluiod00098zdscndp0tam","name":"スクリーンショット 2025-08-27 21.32.44.png","type":"image/png","uploadDate":"2025-10-29","size":"76.66 KB","folderName":"画像"},{"id":"cmhblhg5a00148zjd6hydccnh","name":"無題のドキュメント.docx","type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","uploadDate":"2025-10-29","size":"11.65 KB","folderName":"資料"}]','[{"id":"label-1761718064429","name":"販促物","color":"#3b82f6"}]','[{"id":"checklist-1761718703215","title":"テスト","items":[{"id":"item-1761718706564","text":"111","completed":false},{"id":"item-1761718712949","text":"22","completed":false}]}]',1761836400000,'medium','operational','#f8ebff',0,1761677756166,1762127758338);
INSERT INTO cards VALUES('cmhblewxf000r8zjdfguzlsyy','テスト',replace('ログイン時のテスト\nテスト','\n',char(10)),0,'cmh6dnaqn000z8zt56g8luog0','cmh6dnaql000t8zt5lgttywoy','cmh6dnaqf000n8zt5kbecf42f','[{"id":"cmhsj7fd5000b8ztf807i14yn","name":"スクリーンショット 2025-11-07 18.29.32.png","type":"image/png","uploadDate":"2025-11-10","size":"120.82 KB","folderName":"資料"},{"id":"cmhie6jol001a8zq8wvu32k10","name":"無題のドキュメント.docx","type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","uploadDate":"2025-11-03","size":"11.65 KB","folderName":"資料"},{"id":"_folders_metadata","type":"_metadata","folders":["資料","画像","参考資料"],"isMetadata":true}]','[{"id":"label-1762129113471","name":"テスト","color":"#3b82f6"}]','[{"id":"checklist-1762590276791","title":"テスト","items":[{"id":"item-1762590287729","text":"テストエンターのテスト","completed":false}]}]',1763910000000,'C1','scheduled','#c6e1f5',0,1761718005556,1762742224350);
INSERT INTO cards VALUES('cmhblf17k000u8zjdq1wav902','test','ログイン時のテスト',1,'cmhaxpwt6000e8zmlezk10a29','cmh6dnaql000t8zt5lgttywoy','cmh6dnaqf000n8zt5kbecf42f',NULL,NULL,NULL,NULL,'a','todo',NULL,0,1761718011105,1762127936466);
INSERT INTO cards VALUES('cmhifqakp002e8zq8u09i1e03','テスト','権限の確認カード',1,'cmhauy7jj00118zbj20l3l1a4','cmhauy7ji000x8zbjwgntqi0p','cmh61yv6r00038ztfb6fy1a0o',NULL,NULL,NULL,NULL,'high','todo',NULL,0,1762131721994,1762131883954);
INSERT INTO cards VALUES('cmhig10pb002p8zq8igzr9x9p','テストカード','test',0,'cmhauukh800078zuf8x7w88wy','cmhauukh800058zufpqxyny9b','cmh6dnaqf000n8zt5kbecf42f','[{"id":"_folders_metadata","type":"_metadata","folders":["資料","画像","参考資料"],"isMetadata":true}]','[{"id":"label-4","name":"機能追加","color":"#3b82f6"}]','[{"id":"checklist-1762132338689","title":"test","items":[]}]',1763046000000,'medium','todo',NULL,0,1762132222415,1762240604112);
INSERT INTO cards VALUES('cmhk8jkq800058z2bunzhmddf','検索フィルター','フィルター検索のテスト',0,'cmhauukh800078zuf8x7w88wy','cmhauukh800058zufpqxyny9b','cmh6dnaqf000n8zt5kbecf42f',NULL,NULL,NULL,NULL,'medium','todo',NULL,0,1762240583600,1762240590411);
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
INSERT INTO family_members VALUES('cmh6cmohe00078zrca3zh5c1s','cmh66sv9u00008zh5oqc0cz3o','大澤仁志','子',1759622400000,NULL,NULL,NULL,NULL,1761400920434,1761400920434);
INSERT INTO family_members VALUES('cmh6dkx9d000k8zt551lzfv2v','cmh61yv6o00008ztfctj0dso0','大澤仁志','子',1759104000000,NULL,NULL,NULL,NULL,1761402518113,1761402518113);
INSERT INTO family_members VALUES('cmhltyb9j000k8ziwhau4cdwa','cmh61yv6s00048ztfz0yoonl9','大澤仁志','子',NULL,'09082454762','呉市広文化町6-4','1236987456321','test',1762337009287,1762337009287);
INSERT INTO family_members VALUES('cmhoxy17v00028z0cgv7kb3kg','cmh61yv6r00038ztfb6fy1a0o','大澤仁志','子',1762732800000,'0823278787','呉市広古新開8-31-12',NULL,'test',1762525113259,1762525113259);
INSERT INTO family_members VALUES('cmichnlns000l8zmy0ssy4pl3','cmh6dnaqf000n8zt5kbecf42f','伊藤和博','子',1759017600000,NULL,'呉市広古新開8-31-12','789654123641','test',1763948940905,1763948940905);
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
INSERT INTO files VALUES('cmh6bzaus00018zrcvayjvlw7','cmh61yv6r00038ztfb6fy1a0o','070926_4.pdf','1761399829683_070926_4.pdf','cmh61yv6r00038ztfb6fy1a0o/payroll/2025年-10月/1761399829683_070926_4.pdf',NULL,'application/pdf',86344,'payroll','2025年-10月',NULL,1761399829684);
INSERT INTO files VALUES('cmh6dk8n8000h8zt5go808mbr','cmh61yv6o00008ztfctj0dso0','スクリーンショット 2025-08-27 21.32.44.png','1761402486211_スクリーンショット 2025-08-27 21.32.44.png','cmh61yv6o00008ztfctj0dso0/employee/契約書類/1761402486211_スクリーンショット 2025-08-27 21.32.44.png',NULL,'image/png',78504,'employee','契約書類',NULL,1761402486213);
INSERT INTO files VALUES('cmh6dttc600008zcivil24n1n','cmh6dnaqf000n8zt5kbecf42f','スクリーンショット 2025-10-25 21.08.36.png','1761402932933_スクリーンショット 2025-10-25 21.08.36.png','cmh6dnaqf000n8zt5kbecf42f/employee/契約書類/1761402932933_スクリーンショット 2025-10-25 21.08.36.png',NULL,'image/png',120609,'employee','契約書類',NULL,1761402932935);
INSERT INTO files VALUES('cmhax8v3l00048z1jecz7owms','cmh6dnaqf000n8zt5kbecf42f','無題のドキュメント.docx','1761677412465_無題のドキュメント.docx','cmh6dnaqf000n8zt5kbecf42f/task/資料/1761677412465_無題のドキュメント.docx',NULL,'application/vnd.openxmlformats-officedocument.wordprocessingml.document',11925,'task','資料',NULL,1761677412466);
INSERT INTO files VALUES('cmhayqurd00088zifvo52397u','cmh61yv6s00048ztfz0yoonl9','無題のドキュメント.docx','1761679931448_無題のドキュメント.docx','cmh61yv6s00048ztfz0yoonl9/employee/契約書類/1761679931448_無題のドキュメント.docx',NULL,'application/vnd.openxmlformats-officedocument.wordprocessingml.document',11925,'employee','契約書類',NULL,1761679931449);
INSERT INTO files VALUES('cmhazhrlc00188zqtprzehcmf','cmh61yv6s00048ztfz0yoonl9','070926_4.pdf','1761681187044_070926_4.pdf','cmh61yv6s00048ztfz0yoonl9/employee/事前資料/1761681187044_070926_4.pdf',NULL,'application/pdf',86344,'employee','事前資料',NULL,1761681187056);
INSERT INTO files VALUES('cmhb3vgx700078z4ba97p1c16','cmh61yv6r00038ztfb6fy1a0o','070926_4.pdf','1761688544656_070926_4.pdf','cmh61yv6r00038ztfb6fy1a0o/general/1761688544656_070926_4.pdf',NULL,'application/pdf',86344,'general','2025年度',NULL,1761688544875);
INSERT INTO files VALUES('cmhb3w8cs00088z4bwlqgtnh5','cmh61yv6p00018ztf678g4tuj','スクリーンショット 2025-10-29 5.34.53.png','1761688580201_スクリーンショット 2025-10-29 5.34.53.png','cmh61yv6p00018ztf678g4tuj/general/1761688580201_スクリーンショット 2025-10-29 5.34.53.png',NULL,'image/png',153959,'general','2025年度',NULL,1761688580428);
INSERT INTO files VALUES('cmhblhg5a00148zjd6hydccnh','cmh6dnaqf000n8zt5kbecf42f','無題のドキュメント.docx','1761718123627_無題のドキュメント.docx','cmh6dnaqf000n8zt5kbecf42f/task/1761718123627_無題のドキュメント.docx',NULL,'application/vnd.openxmlformats-officedocument.wordprocessingml.document',11925,'task','資料',NULL,1761718123775);
INSERT INTO files VALUES('cmhbluiod00098zdscndp0tam','cmh6dnaqf000n8zt5kbecf42f','スクリーンショット 2025-08-27 21.32.44.png','1761718733395_スクリーンショット 2025-08-27 21.32.44.png','cmh6dnaqf000n8zt5kbecf42f/task/1761718733395_スクリーンショット 2025-08-27 21.32.44.png',NULL,'image/png',78504,'task','画像',NULL,1761718733582);
INSERT INTO files VALUES('cmhblwro7000o8zds11b1ht22','cmh6dnaqf000n8zt5kbecf42f','スクリーンショット 2025-08-27 21.32.44.png','1761718838355_スクリーンショット 2025-08-27 21.32.44.png','cmh6dnaqf000n8zt5kbecf42f/task/1761718838355_スクリーンショット 2025-08-27 21.32.44.png',NULL,'image/png',78504,'task','test',NULL,1761718838551);
INSERT INTO files VALUES('cmhie6jol001a8zq8wvu32k10','cmh6dnaqf000n8zt5kbecf42f','無題のドキュメント.docx','1762129120896_無題のドキュメント.docx','cmh6dnaqf000n8zt5kbecf42f/task/1762129120896_無題のドキュメント.docx',NULL,'application/vnd.openxmlformats-officedocument.wordprocessingml.document',11925,'task','資料',NULL,1762129121062);
INSERT INTO files VALUES('cmhsj7fd5000b8ztf807i14yn','cmh6dnaqf000n8zt5kbecf42f','スクリーンショット 2025-11-07 18.29.32.png','1762742221716_スクリーンショット 2025-11-07 18.29.32.png','cmh6dnaqf000n8zt5kbecf42f/task/1762742221716_スクリーンショット 2025-11-07 18.29.32.png',NULL,'image/png',123715,'task','資料',NULL,1762742221961);
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
CREATE TABLE IF NOT EXISTS "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_settings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO user_settings VALUES('cmhb67k3800018z4mqgy0v90d','cmh61yv6r00038ztfb6fy1a0o','avatar-text','一般',1761692468084,1762525113530);
INSERT INTO user_settings VALUES('cmhb67k9b00078z4me3ic1orh','cmh61yv6r00038ztfb6fy1a0o','password-visible','false',1761692468303,1762525113522);
INSERT INTO user_settings VALUES('cmhb68dxp000b8z4mu9g6f422','cmh61yv6s00048ztfz0yoonl9','avatar-text','一般B',1761692506765,1762337009580);
INSERT INTO user_settings VALUES('cmhb68fjk000i8z4me7fyu568','cmh61yv6s00048ztfz0yoonl9','password-visible','true',1761692508848,1762337026582);
INSERT INTO user_settings VALUES('cmhb6etav000p8z4mvkfxnbhu','cmh61yv6u00078ztfoxvldr6k','password-visible','true',1761692806615,1763468953148);
INSERT INTO user_settings VALUES('cmhb6etb1000r8z4m3048vdzv','cmh61yv6u00078ztfoxvldr6k','avatar-text','閲覧者',1761692806621,1763468953157);
INSERT INTO user_settings VALUES('cmhbmsg2500118zdsye8dek45','cmh6dnaqf000n8zt5kbecf42f','avatar-text','大澤',1761720316493,1763948940955);
INSERT INTO user_settings VALUES('cmhbmttk3001m8zds6aa8u0ou','cmh6dnaqf000n8zt5kbecf42f','password-visible','true',1761720380644,1763948940941);
INSERT INTO user_settings VALUES('cmhbpyj8b00478zdsin46onop','cmhawbiwd00028zu09znbrma6','avatar-text','店長',1761725639387,1761725640757);
INSERT INTO user_settings VALUES('cmhbpyka6004c8zds7cgp0cts','cmhawbiwd00028zu09znbrma6','password-visible','false',1761725640751,1761725640751);
INSERT INTO user_settings VALUES('cmhbpyq2l004g8zds3v2xz70e','cmhb4b37g000a8z4bhilfigpa','avatar-text','店長2',1761725648253,1761725648469);
INSERT INTO user_settings VALUES('cmhbpyq8e004l8zdswtpxfuks','cmhb4b37g000a8z4bhilfigpa','password-visible','false',1761725648463,1761725648463);
INSERT INTO user_settings VALUES('cmhoy1m6v000u8z0c91zgztmv','cmhoy1lud000b8z0cibsqrpaj','password-visible','true',1762525280408,1762525280408);
INSERT INTO user_settings VALUES('cmhoy1m74000w8z0cxltt9wlg','cmhoy1lud000b8z0cibsqrpaj','avatar-text','test1',1762525280416,1762525280416);
INSERT INTO user_settings VALUES('cmi8cajm3000i8zo4xf6o7kq7','cmi8caigj00028zo432ixktrr','password-visible','false',1763698068939,1763698163339);
INSERT INTO user_settings VALUES('cmi8cajmg000k8zo4mpvimf40','cmi8caigj00028zo432ixktrr','avatar-text','業務A',1763698068952,1763698163357);
INSERT INTO user_settings VALUES('cmi8cb64g00148zo4e0byv7qs','cmi8cb5x2000l8zo4lepmbdc8','password-visible','false',1763698098112,1763698098112);
INSERT INTO user_settings VALUES('cmi8cb64r00168zo4k5egzahw','cmi8cb5x2000l8zo4lepmbdc8','avatar-text','業務B',1763698098123,1763698098123);
INSERT INTO user_settings VALUES('cmi8cbml3001q8zo4zedr5ogs','cmi8cbmk000178zo4pdk0ie7f','password-visible','false',1763698119448,1763698119448);
INSERT INTO user_settings VALUES('cmi8cbmlf001s8zo4vu0wk7xt','cmi8cbmk000178zo4pdk0ie7f','avatar-text','',1763698119460,1763698119460);
INSERT INTO user_settings VALUES('cmi8ccamg002c8zo4q5nvwx1x','cmi8ccal1001t8zo41oyzgmu0','password-visible','false',1763698150601,1763698150601);
INSERT INTO user_settings VALUES('cmi8ccamx002e8zo4r0ed3e0x','cmi8ccal1001t8zo41oyzgmu0','avatar-text','業務D',1763698150618,1763698150618);
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
CREATE TABLE IF NOT EXISTS "workspaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workspaces_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO workspaces VALUES('cmh66sv9w00028zh57ozj4rtx','大澤仁志のマイワークスペース','個人用のワークスペースです','cmh61yv6o00008ztfctj0dso0',1761391131477,1761402024220);
INSERT INTO workspaces VALUES('cmh6dnaqi000p8zt5p5q792t5','大澤仁志のマイワークスペース','個人用のワークスペースです','cmh6dnaqf000n8zt5kbecf42f',1761402628891,1761402628891);
INSERT INTO workspaces VALUES('cmhauuk0200018zufgrigol4l','会社全体ワークスペース','全体のワークスペース','cmh6dnaqf000n8zt5kbecf42f',1761673385666,1761673400076);
INSERT INTO workspaces VALUES('cmhauy7j900018zbj4yvm0xfd','somuのマイワークスペース','個人用のワークスペースです','cmh61yv6p00018ztf678g4tuj',1761673556134,1761673556134);
INSERT INTO workspaces VALUES('cmhauy7je000f8zbj3mgdfzej','マネージャーのマイワークスペース','個人用のワークスペースです','cmh61yv6q00028ztf6bx7j764',1761673556138,1761673556138);
INSERT INTO workspaces VALUES('cmhauy7jh000t8zbjpb9d5tyn','ippanのマイワークスペース','個人用のワークスペースです','cmh61yv6r00038ztfb6fy1a0o',1761673556142,1761673556142);
INSERT INTO workspaces VALUES('cmhauy7jk00178zbjch0s83qz','一般社員Bのマイワークスペース','個人用のワークスペースです','cmh61yv6s00048ztfz0yoonl9',1761673556144,1761673556144);
INSERT INTO workspaces VALUES('cmhauy7jm001l8zbjtdo6quaa','サブマネージャーのマイワークスペース','個人用のワークスペースです','cmh61yv6s00058ztf3mnhrvuh',1761673556147,1761673556147);
INSERT INTO workspaces VALUES('cmhauy7jo001z8zbjbxo1i43b','店舗マネージャーのマイワークスペース','個人用のワークスペースです','cmh61yv6t00068ztfehik701k',1761673556149,1761673556149);
INSERT INTO workspaces VALUES('cmhauy7jr002d8zbj7sqjj4ki','閲覧者のマイワークスペース','個人用のワークスペースです','cmh61yv6u00078ztfoxvldr6k',1761673556151,1761673556151);
INSERT INTO workspaces VALUES('cmhauy7jt002r8zbjqc9c0pzc','見えないTOPのマイワークスペース','個人用のワークスペースです','cmh66jij900008zuvym8k16wm',1761673556154,1761673556154);
INSERT INTO workspaces VALUES('cmhauy7jw00358zbjnoo4wzk8','大澤仁志のマイワークスペース','個人用のワークスペースです','cmh6bxkb000008zrcnaoftjor',1761673556156,1761673556156);
INSERT INTO workspaces VALUES('cmhawbiwj00048zu0aytdwr3d','tenのマイワークスペース','個人用のワークスペースです','cmhawbiwd00028zu09znbrma6',1761675857012,1761675857012);
INSERT INTO workspaces VALUES('cmhb4b37k000c8z4bsqz5h0wa','ten2のマイワークスペース','個人用のワークスペースです','cmhb4b37g000a8z4bhilfigpa',1761689273601,1761689273601);
INSERT INTO workspaces VALUES('cmhoy1luf000d8z0ch02go854','test1のマイワークスペース','個人用のワークスペースです','cmhoy1lud000b8z0cibsqrpaj',1762525279960,1762525279960);
INSERT INTO workspaces VALUES('cmi8caigm00048zo4r3wb8g3q','業務Aのマイワークスペース','個人用のワークスペースです','cmi8caigj00028zo432ixktrr',1763698067446,1763698067446);
INSERT INTO workspaces VALUES('cmi8cb5x4000n8zo4x9p9pxig','業務Bのマイワークスペース','個人用のワークスペースです','cmi8cb5x2000l8zo4lepmbdc8',1763698097848,1763698097848);
INSERT INTO workspaces VALUES('cmi8cbmk200198zo4x5mayllv','業務Cのマイワークスペース','個人用のワークスペースです','cmi8cbmk000178zo4pdk0ie7f',1763698119411,1763698119411);
INSERT INTO workspaces VALUES('cmi8ccal3001v8zo47ovqwqbk','業務Dのマイワークスペース','個人用のワークスペースです','cmi8ccal1001t8zo41oyzgmu0',1763698150551,1763698150551);
CREATE TABLE IF NOT EXISTS "bulletin_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'secondary',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO bulletin_categories VALUES('cmhp2dhjz00008zz6rcofxcc2','一般','secondary',1762532552735,1762532552735);
INSERT INTO bulletin_categories VALUES('cmhp2dhk300048zz6vhcokj7i','重要','destructive',1762532552739,1762532552739);
INSERT INTO bulletin_categories VALUES('cmhp2dhk300088zz6mslvxqjt','人事','default',1762532552740,1762532552740);
INSERT INTO bulletin_categories VALUES('cmhp2dhk400098zz60l0gr1i3','システム','outline',1762532552740,1762532552740);
INSERT INTO bulletin_categories VALUES('cmhp2dhk4000a8zz6hjdmezls','評価','secondary',1762532552741,1762532552741);
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
INSERT INTO bulletins VALUES('cmhp2dt1q000l8zz63nkhr2lb','test','テスト',0,1762532567631,'cmhp2dhk300048zz6vhcokj7i',1762532567631,1762532567631);
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
CREATE TABLE IF NOT EXISTS "workclock_time_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "wagePattern" TEXT DEFAULT 'A',
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "countPattern" TEXT,
    "count" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workclock_time_entries_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workclock_workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO workclock_time_entries VALUES('cmi5prcau00018zkeisjhhvkj','cmi5oy7fg00098zsf2y8fsiqh',1763510400000,'A','09:00','10:00',0,'test',NULL,NULL,1763539289095,1763539289095);
INSERT INTO workclock_time_entries VALUES('cmiceidwh000e8zmyvlvc8m6b','cmi8cf2ig002v8zo436xax6rg',1763596800000,'A','14:00','16:00',0,'test','A',1,1763943658722,1763943658722);
INSERT INTO workclock_time_entries VALUES('cmicflkhy000g8zmycsdh377m','cmi8cf2ig002v8zo436xax6rg',1763683200000,'B','09:00','11:00',0,'4500円のはず','B',50,1763945486854,1763945486854);
INSERT INTO workclock_time_entries VALUES('cmicfommj000i8zmy0xu9yjg9','cmi8cf2ig002v8zo436xax6rg',1763769600000,'B','09:00','11:00',60,'7500','A',4,1763945629579,1763945629579);
INSERT INTO workclock_time_entries VALUES('cmicjtckt000v8zmyet47rzj6','cmi8cf2ig002v8zo436xax6rg',1759795200000,'B','09:00','13:00',0,'9,000円','A',2,1763952568302,1763952568302);
INSERT INTO workclock_time_entries VALUES('cmicjtx6n000x8zmy4fjrbwg4','cmi8cf2ig002v8zo436xax6rg',1761091200000,'A','09:00','18:00',0,'test','A',1,1763952595007,1763952595007);
INSERT INTO workclock_time_entries VALUES('cmicjuyvb000z8zmy11kqd0xi','cmi8cf2ig002v8zo436xax6rg',1765324800000,'A','09:00','14:00',0,replace('未来のテスト\n9000','\n',char(10)),'A',2,1763952643848,1763952643848);
INSERT INTO workclock_time_entries VALUES('cmicjvc0s00118zmyh2iwqen7','cmi8cf2ig002v8zo436xax6rg',1764028800000,'A','09:00','18:00',0,'テスト','A',1,1763952660893,1763952660893);
INSERT INTO workclock_time_entries VALUES('cmicjvmox00138zmybjewpm7r','cmi8cf2ig002v8zo436xax6rg',1764547200000,'A','09:00','18:00',0,'来月のテスト','A',1,1763952674722,1763952674722);
INSERT INTO workclock_time_entries VALUES('cmicjw11b00158zmyy8pzl4kl','cmi8cf2ig002v8zo436xax6rg',1761004800000,'A','09:00','18:00',0,'過去のテスト','A',1,1763952693311,1763952693311);
INSERT INTO workclock_time_entries VALUES('cmiclp3yv00178zmya17y5pxx','cmi8cf2ig002v8zo436xax6rg',1764201600000,'A','09:00','18:00',0,'test','A',1,1763955729751,1763955729751);
INSERT INTO workclock_time_entries VALUES('cmiclxrb200198zmyz3wp89c6','cmi8cf2ig002v8zo436xax6rg',1763942400000,'A','02:00','04:00',0,'test','A',1,1763956133246,1763956133246);
INSERT INTO workclock_time_entries VALUES('cmiclyvpi001b8zmymq1su12x','cmi8cf2ig002v8zo436xax6rg',1761523200000,'A','09:00','18:00',0,'tessst','A',1,1763956185606,1763956185606);
INSERT INTO workclock_time_entries VALUES('cmicm3r66001d8zmyfg1mzq45','cmi8cf2ig002v8zo436xax6rg',1764115200000,'A','01:30','02:00',0,'test','A',1,1763956413007,1763956413007);
INSERT INTO workclock_time_entries VALUES('cmiiukr8l00018zt6j2o5myxi','cmi8cf2ig002v8zo436xax6rg',1764374400000,'B','09:00','15:00',0,'9000',NULL,NULL,1764333440229,1764333440229);
CREATE TABLE IF NOT EXISTS "workclock_rewards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workclock_rewards_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workclock_workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO workclock_rewards VALUES('cmicec8lu00098zmya6rya3q9','cmi8cf2ig002v8zo436xax6rg',10000,'ID1111案件　粗利1,000,000',1763942400000,1763943371923,1763943371923);
INSERT INTO workclock_rewards VALUES('cmiceccmh000b8zmy4kc8i7vd','cmi8cf2ig002v8zo436xax6rg',3000,'AI毎月課金',1761955200000,1763943377129,1763943377129);
INSERT INTO workclock_rewards VALUES('cmifffkvo001f8zmy1cm3o3q6','cmi8cf2ig002v8zo436xax6rg',12000,'test',1764115200000,1764126605940,1764126605940);
INSERT INTO workclock_rewards VALUES('cmiffgkon001j8zmyionbk4g4','cmi8cf2ig002v8zo436xax6rg',111,'test',1764115200000,1764126652344,1764126652344);
CREATE TABLE IF NOT EXISTS "workclock_reward_presets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workclock_reward_presets_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workclock_workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO workclock_reward_presets VALUES('cmice8ckj00038zmyrf5uili5','cmi8cf2ig002v8zo436xax6rg',3000,'AI毎月課金',1,1763943190436,1763943231911);
INSERT INTO workclock_reward_presets VALUES('cmiffg79d001h8zmyk16xpafp','cmi8cf2ig002v8zo436xax6rg',111,'test',1,1764126634946,1764126634946);
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
    "countPatternLabelA" TEXT DEFAULT '回数Aパターン',
    "countPatternLabelB" TEXT DEFAULT '回数Bパターン',
    "countPatternLabelC" TEXT DEFAULT '回数Cパターン',
    "countRateA" REAL,
    "countRateB" REAL,
    "countRateC" REAL,
    "monthlyFixedAmount" INTEGER,
    "monthlyFixedEnabled" BOOLEAN NOT NULL DEFAULT false,
    "billingTaxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "billingTaxRate" REAL,
    "teams" TEXT,
    "role" TEXT NOT NULL DEFAULT 'worker',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "transferDestination" TEXT,
    CONSTRAINT "workclock_workers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO workclock_workers VALUES('cmi5oy7fg00098zsf2y8fsiqh','cmh61yv6o00008ztfctj0dso0','admin',NULL,NULL,NULL,NULL,'admin@example.com',NULL,NULL,5000.0,'Aパターン','Bパターン','Cパターン',NULL,NULL,'回数Aパターン','回数Bパターン','回数Cパターン',NULL,NULL,NULL,NULL,0,0,NULL,NULL,'worker',NULL,1763537929756,1764332422157,'テスト銀行 テスト支店 1234567');
INSERT INTO workclock_workers VALUES('cmi8anbe500018zo49tbjsic0','cmh61yv6s00048ztfz0yoonl9','ippanb','ippan','株式会社オオサワ創研',NULL,'っっっっっs','ohsawa1104@gmail.com','0823278787','6-4',1000.0,'Aパターン','Bパターン','Cパターン',1200.0,NULL,'回数Aパターン','回数Bパターン','回数Cパターン',5000.0,1500.0,NULL,30000,1,0,NULL,'["チームA"]','worker','テストテスト',1763695305582,1763957493124,NULL);
INSERT INTO workclock_workers VALUES('cmi8cdlp4002p8zo42n81kead','cmi8caigj00028zo432ixktrr','業務A','111',NULL,NULL,NULL,'',NULL,NULL,1100.0,'Aパターン','Bパターン','Cパターン',NULL,NULL,'回数Aパターン','回数Bパターン','回数Cパターン',NULL,NULL,NULL,NULL,0,0,NULL,'["チームA","チームB"]','admin',NULL,1763698211608,1763698301843,NULL);
INSERT INTO workclock_workers VALUES('cmi8ce0dy002r8zo4o71hyhkc','cmi8cb5x2000l8zo4lepmbdc8','業務B','111',NULL,NULL,NULL,'',NULL,NULL,0.0,'Aパターン','Bパターン','Cパターン',NULL,NULL,'回数Aパターン','回数Bパターン','回数Cパターン',2500.0,NULL,NULL,NULL,0,0,NULL,'["チームA","チームC"]','worker',NULL,1763698230646,1763698230646,NULL);
INSERT INTO workclock_workers VALUES('cmi8ceczr002t8zo4im3i6iq6','cmi8cbmk000178zo4pdk0ie7f','業務C','111',NULL,NULL,NULL,'',NULL,NULL,0.0,'Aパターン','Bパターン','Cパターン',NULL,NULL,'回数Aパターン','回数Bパターン','回数Cパターン',NULL,NULL,NULL,30000,1,0,NULL,'["チームB","チームC"]','worker',NULL,1763698246983,1763698246983,NULL);
INSERT INTO workclock_workers VALUES('cmi8cf2ig002v8zo436xax6rg','cmi8ccal1001t8zo41oyzgmu0','業務D','111',NULL,NULL,NULL,'',NULL,NULL,1200.0,'Aパターン','Bパターン','Cパターン',1500.0,NULL,'回数Aパターン','回数Bパターン','回数Cパターン',1500.0,30.0,NULL,50000,1,1,10.0,'["チームB"]','admin',NULL,1763698280056,1764333380818,'広島銀行　広支店　普通　9876543　ソウケンタロウ');
CREATE UNIQUE INDEX "task_members_taskId_employeeId_key" ON "task_members"("taskId", "employeeId");
CREATE UNIQUE INDEX "workspace_members_workspaceId_employeeId_key" ON "workspace_members"("workspaceId", "employeeId");
CREATE UNIQUE INDEX "card_members_cardId_employeeId_key" ON "card_members"("cardId", "employeeId");
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");
CREATE UNIQUE INDEX "employees_employeeNumber_key" ON "employees"("employeeNumber");
CREATE UNIQUE INDEX "master_data_type_value_key" ON "master_data"("type", "value");
CREATE UNIQUE INDEX "parttime_grant_schedule_serviceDays_workDaysPerWeek_key" ON "parttime_grant_schedule"("serviceDays", "workDaysPerWeek");
CREATE UNIQUE INDEX "grant_lots_dedupKey_key" ON "grant_lots"("dedupKey");
CREATE INDEX "grant_lots_employeeId_grantDate_idx" ON "grant_lots"("employeeId", "grantDate");
CREATE INDEX "consumptions_employeeId_date_idx" ON "consumptions"("employeeId", "date");
CREATE INDEX "consumptions_lotId_idx" ON "consumptions"("lotId");
CREATE INDEX "consumptions_requestId_idx" ON "consumptions"("requestId");
CREATE INDEX "time_off_requests_employeeId_idx" ON "time_off_requests"("employeeId");
CREATE INDEX "alert_events_employeeId_idx" ON "alert_events"("employeeId");
CREATE UNIQUE INDEX "alert_events_employeeId_kind_referenceDate_key" ON "alert_events"("employeeId", "kind", "referenceDate");
CREATE INDEX "audit_logs_employeeId_idx" ON "audit_logs"("employeeId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE UNIQUE INDEX "vacation_app_configs_version_key" ON "vacation_app_configs"("version");
CREATE UNIQUE INDEX "user_settings_employeeId_key_key" ON "user_settings"("employeeId", "key");
CREATE INDEX "vacation_balances_employeeId_grantDate_idx" ON "vacation_balances"("employeeId", "grantDate");
CREATE INDEX "time_off_requests_supervisorId_idx" ON "time_off_requests"("supervisorId");
CREATE UNIQUE INDEX "bulletin_categories_name_key" ON "bulletin_categories"("name");
CREATE INDEX "bulletins_publishedAt_idx" ON "bulletins"("publishedAt");
CREATE INDEX "convenience_categories_tenantId_position_idx" ON "convenience_categories"("tenantId", "position");
CREATE INDEX "convenience_entries_categoryId_position_idx" ON "convenience_entries"("categoryId", "position");
CREATE INDEX "convenience_entry_urls_entryId_position_idx" ON "convenience_entry_urls"("entryId", "position");
CREATE INDEX "workclock_time_entries_workerId_date_idx" ON "workclock_time_entries"("workerId", "date");
CREATE UNIQUE INDEX "workclock_workers_employeeId_key" ON "workclock_workers"("employeeId");
CREATE INDEX "workclock_rewards_workerId_date_idx" ON "workclock_rewards"("workerId", "date");
CREATE INDEX "workclock_reward_presets_workerId_idx" ON "workclock_reward_presets"("workerId");
COMMIT;
