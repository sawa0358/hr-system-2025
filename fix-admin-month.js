const fs = require('fs');
const path = '/Users/ohsawa/Desktop/自社システム・webデータ/HR-system/app/workclock/admin/page.tsx';
let text = fs.readFileSync(path, 'utf8');

text = text.replace(
  /const year = currentDate\.getFullYear\(\)\s*\n\s*const month = currentDate\.getMonth\(\)\s*\n/, 
  "const year = currentDate.getFullYear()\n      const monthIndex = currentDate.getMonth()\n      const apiMonth = monthIndex + 1\n"
);

text = text.replace(
  /entryDate\.getMonth\(\) === month/, 
  'entryDate.getMonth() === monthIndex'
);

text = text.replace(
  /getRewardsByWorkerAndMonth\(worker\.id, year, month, currentUser\.id\)/, 
  'getRewardsByWorkerAndMonth(worker.id, year, apiMonth, currentUser.id)'
);

fs.writeFileSync(path, text, 'utf8');
console.log('patched admin/page.tsx');
