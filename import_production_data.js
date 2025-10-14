const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

async function importProductionData() {
  try {
    console.log('本番データのインポートを開始します...');
    
    // 既存のデータをクリア
    await prisma.employee.deleteMany();
    console.log('既存のデータをクリアしました');
    
    const employees = [];
    
    // CSVファイルを読み込み
    await new Promise((resolve, reject) => {
      fs.createReadStream('employees_export.csv')
        .pipe(csv())
        .on('data', (row) => {
          // データを整形
          const employee = {
            id: row.id,
            employeeId: row.employeeId,
            employeeNumber: row.employeeNumber,
            employeeType: row.employeeType,
            name: row.name,
            furigana: row.furigana || null,
            email: row.email || null,
            phone: row.phone || null,
            department: row.department,
            position: row.position,
            organization: row.organization,
            team: row.team || null,
            joinDate: new Date(row.joinDate),
            status: row.status,
            password: row.password,
            role: row.role || null,
            myNumber: row.myNumber || null,
            userId: row.userId || null,
            url: row.url || null,
            address: row.address || null,
            selfIntroduction: row.selfIntroduction || null,
            phoneInternal: row.phoneInternal || null,
            phoneMobile: row.phoneMobile || null,
            birthDate: row.birthDate ? new Date(row.birthDate) : null,
            showInOrgChart: row.showInOrgChart === 't',
            parentEmployeeId: row.parentEmployeeId || null,
            isInvisibleTop: row.isInvisibleTop === 't',
            isSuspended: row.isSuspended === 't',
            retirementDate: row.retirementDate ? new Date(row.retirementDate) : null,
            privacyDisplayName: row.privacyDisplayName === 't',
            privacyOrganization: row.privacyOrganization === 't',
            privacyDepartment: row.privacyDepartment === 't',
            privacyPosition: row.privacyPosition === 't',
            privacyUrl: row.privacyUrl === 't',
            privacyAddress: row.privacyAddress === 't',
            privacyBio: row.privacyBio === 't',
            privacyEmail: row.privacyEmail === 't',
            privacyWorkPhone: row.privacyWorkPhone === 't',
            privacyExtension: row.privacyExtension === 't',
            privacyMobilePhone: row.privacyMobilePhone === 't',
            privacyBirthDate: row.privacyBirthDate === 't',
            originalEmployeeId: row.originalEmployeeId || null,
            orgChartLabel: row.orgChartLabel || null
          };
          employees.push(employee);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`${employees.length}件の社員データを読み込みました`);
    
    // データベースに挿入
    for (const employee of employees) {
      await prisma.employee.create({
        data: employee
      });
    }
    
    console.log('✅ 本番データのインポートが完了しました');
    
    // インポート結果を確認
    const count = await prisma.employee.count();
    console.log(`データベース内の社員数: ${count}件`);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importProductionData();
