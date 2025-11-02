// 有給管理の計算ロジック検証スクリプト
// 実行: node scripts/test-vacation-calculation.js

const readFileSync = require('fs').readFileSync;
const path = require('path');

// テストケース
const testCases = [
  {
    name: '入社日: 2023/02/02, 次回付与日: 2026/08/02',
    joinDate: '2023-02-02',
    nextGrantDate: '2026-08-02',
    expectedYears: 3.5,
    expectedDays: 14, // 3.5年の場合は14日
  },
  {
    name: '入社日: 2023/02/02, 付与日: 2025/08/02',
    joinDate: '2023-02-02',
    nextGrantDate: '2025-08-02',
    expectedYears: 2.5,
    expectedDays: 12, // 2.5年の場合は12日
  },
];

// diffInYearsHalfStepの実装を再現
function diffInYearsHalfStep(join, target) {
  const months = differenceInMonths(target, join);
  return Math.floor(months / 6) / 2; // 0.5刻み
}

function differenceInMonths(dateLeft, dateRight) {
  const yearDiff = dateLeft.getFullYear() - dateRight.getFullYear();
  const monthDiff = dateLeft.getMonth() - dateRight.getMonth();
  return yearDiff * 12 + monthDiff;
}

// 付与表から該当する日数を検索
function findDays(rows, years) {
  const eligible = rows
    .filter((r) => r.years <= years)
    .sort((a, b) => b.years - a.years)[0];
  return eligible?.days ?? 0;
}

// パターンA（正社員用）の付与表
const fullTimeTable = [
  { years: 0.5, days: 10 },
  { years: 1.5, days: 11 },
  { years: 2.5, days: 12 },
  { years: 3.5, days: 14 },
  { years: 4.5, days: 16 },
  { years: 5.5, days: 18 },
  { years: 6.5, days: 20 },
];

// テスト実行
console.log('=== 有給管理の計算ロジック検証 ===\n');

testCases.forEach((testCase, index) => {
  console.log(`テストケース ${index + 1}: ${testCase.name}`);
  
  const joinDate = new Date(testCase.joinDate);
  const nextGrantDate = new Date(testCase.nextGrantDate);
  
  // 勤続年数を計算
  const calculatedYears = diffInYearsHalfStep(joinDate, nextGrantDate);
  const calculatedDays = findDays(fullTimeTable, calculatedYears);
  
  console.log(`  - 計算された勤続年数: ${calculatedYears}年`);
  console.log(`  - 期待される勤続年数: ${testCase.expectedYears}年`);
  console.log(`  - 計算された付与日数: ${calculatedDays}日`);
  console.log(`  - 期待される付与日数: ${testCase.expectedDays}日`);
  
  // 検証
  const yearsMatch = calculatedYears === testCase.expectedYears;
  const daysMatch = calculatedDays === testCase.expectedDays;
  
  if (yearsMatch && daysMatch) {
    console.log('  ✓ テスト成功\n');
  } else {
    console.log('  ✗ テスト失敗');
    if (!yearsMatch) {
      console.log(`    勤続年数の不一致: ${calculatedYears} ≠ ${testCase.expectedYears}`);
    }
    if (!daysMatch) {
      console.log(`    付与日数の不一致: ${calculatedDays} ≠ ${testCase.expectedDays}`);
    }
    console.log('');
  }
});

console.log('=== 検証完了 ===');

