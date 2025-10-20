const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// JSON配列をパースするヘルパー関数
function parseJsonArray(value) {
  if (!value) return [];
  
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(item => item && item.trim() !== '') : [value];
  } catch {
    // JSONでない場合は単一の値として扱う
    return value ? [value] : [];
  }
}

// 最初の要素を取得するヘルパー関数
function getFirstElement(value) {
  const parsed = parseJsonArray(value);
  return parsed.length > 0 ? parsed[0] : (value || '未設定');
}

async function fixJsonData() {
  try {
    console.log('🔍 破損データの修正を開始します...');
    
    // 全社員データを取得
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        position: true,
        organization: true
      }
    });
    
    console.log(`📊 対象社員数: ${employees.length}件`);
    
    let fixedCount = 0;
    const errors = [];
    
    for (const employee of employees) {
      try {
        // JSON配列かどうかチェック
        const isJsonDept = employee.department && employee.department.includes('[');
        const isJsonPos = employee.position && employee.position.includes('[');
        const isJsonOrg = employee.organization && employee.organization.includes('[');
        
        if (isJsonDept || isJsonPos || isJsonOrg) {
          console.log(`🔧 修正中: ${employee.name} (${employee.id})`);
          
          const updateData = {};
          
          if (isJsonDept) {
            updateData.department = getFirstElement(employee.department);
            console.log(`  - 部署: "${employee.department}" → "${updateData.department}"`);
          }
          
          if (isJsonPos) {
            updateData.position = getFirstElement(employee.position);
            console.log(`  - 役職: "${employee.position}" → "${updateData.position}"`);
          }
          
          if (isJsonOrg) {
            updateData.organization = getFirstElement(employee.organization);
            console.log(`  - 組織: "${employee.organization}" → "${updateData.organization}"`);
          }
          
          // データベースを更新
          await prisma.employee.update({
            where: { id: employee.id },
            data: updateData
          });
          
          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ エラー: ${employee.name} (${employee.id})`, error.message);
        errors.push({ id: employee.id, name: employee.name, error: error.message });
      }
    }
    
    console.log(`\n✅ 修正完了: ${fixedCount}件のレコードを修正しました`);
    
    if (errors.length > 0) {
      console.log(`\n❌ エラーが発生したレコード: ${errors.length}件`);
      errors.forEach(err => {
        console.log(`  - ${err.name} (${err.id}): ${err.error}`);
      });
    }
    
    // 修正後の確認
    console.log('\n🔍 修正後の確認...');
    const remainingJsonRecords = await prisma.employee.findMany({
      where: {
        OR: [
          { department: { contains: '[' } },
          { position: { contains: '[' } },
          { organization: { contains: '[' } }
        ]
      },
      select: {
        id: true,
        name: true,
        department: true,
        position: true,
        organization: true
      }
    });
    
    if (remainingJsonRecords.length === 0) {
      console.log('✅ 全てのJSON配列データが正常に修正されました');
    } else {
      console.log(`⚠️ まだ修正が必要なレコード: ${remainingJsonRecords.length}件`);
      remainingJsonRecords.forEach(emp => {
        console.log(`  - ${emp.name}: dept=${emp.department}, pos=${emp.position}, org=${emp.organization}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 修正処理でエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 実行
fixJsonData();