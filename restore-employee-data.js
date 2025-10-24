const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreEmployeeData() {
  try {
    console.log('社員データの復元を開始します...');
    
    // バックアップファイルを読み込み
    const backupData = JSON.parse(fs.readFileSync('current-db-backup-2025-10-23T14-30-17.json', 'utf8'));
    
    console.log(`復元対象の社員数: ${backupData.employees.length}人`);
    
    // 各社員データを復元
    for (const employeeData of backupData.employees) {
      try {
        // 既存の社員をチェック
        const existingEmployee = await prisma.employee.findUnique({
          where: { employeeNumber: employeeData.employeeNumber }
        });
        
        if (existingEmployee) {
          console.log(`社員番号 ${employeeData.employeeNumber} は既に存在します。スキップします。`);
          continue;
        }
        
        // 社員データを作成
        const employee = await prisma.employee.create({
          data: {
            employeeId: employeeData.employeeId,
            employeeNumber: employeeData.employeeNumber,
            employeeType: employeeData.employeeType,
            name: employeeData.name,
            furigana: employeeData.furigana,
            email: employeeData.email,
            phone: employeeData.phone,
            department: employeeData.department,
            position: employeeData.position,
            organization: employeeData.organization,
            team: employeeData.team,
            joinDate: new Date(employeeData.joinDate),
            status: employeeData.status,
            password: employeeData.password,
            role: employeeData.role,
            myNumber: employeeData.myNumber,
            userId: employeeData.userId,
            url: employeeData.url,
            address: employeeData.address,
            selfIntroduction: employeeData.selfIntroduction,
 // descriptionフィールドを追加
            phoneInternal: employeeData.phoneInternal,
            phoneMobile: employeeData.phoneMobile,
            birthDate: employeeData.birthDate ? new Date(employeeData.birthDate) : null,
            showInOrgChart: employeeData.showInOrgChart,
            parentEmployeeId: employeeData.parentEmployeeId,
            isInvisibleTop: employeeData.isInvisibleTop,
            isSuspended: employeeData.isSuspended,
            retirementDate: employeeData.retirementDate ? new Date(employeeData.retirementDate) : null,
            privacyDisplayName: employeeData.privacyDisplayName,
            privacyOrganization: employeeData.privacyOrganization,
            privacyDepartment: employeeData.privacyDepartment,
            privacyPosition: employeeData.privacyPosition,
            privacyUrl: employeeData.privacyUrl,
            privacyAddress: employeeData.privacyAddress,
            privacyBio: employeeData.privacyBio,
            privacyEmail: employeeData.privacyEmail,
            privacyWorkPhone: employeeData.privacyWorkPhone,
            privacyExtension: employeeData.privacyExtension,
            privacyMobilePhone: employeeData.privacyMobilePhone,
            privacyBirthDate: employeeData.privacyBirthDate,
            orgChartLabel: employeeData.orgChartLabel,
          }
        });
        
        console.log(`社員データを復元しました: ${employee.name} (${employee.employeeNumber})`);
        
      } catch (error) {
        console.error(`社員データの復元エラー (${employeeData.employeeNumber}):`, error.message);
      }
    }
    
    console.log('社員データの復元が完了しました！');
    
  } catch (error) {
    console.error('復元処理でエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreEmployeeData();
