const fs = require('fs');
const path = require('path');

const v9 = fs.readFileSync(path.join(__dirname, '../demo/v9.html'), 'utf-8').split('\n');
const v10 = fs.readFileSync(path.join(__dirname, '../demo/v10.html'), 'utf-8').split('\n');

console.log(`v9 total lines: ${v9.length}`);
console.log(`v10 total lines: ${v10.length}`);

// 逐块比对关键函数与区域
const diffSections = [];
const v9Map = new Map();
const v10Map = new Map();

// 找出在 v10 中新增、删除或修改的行/块
let diffCount = 0;
const sampleDiffs = [];

// 使用简单行扫描
let i9 = 0, i10 = 0;
while (i9 < v9.length || i10 < v10.length) {
  const line9 = v9[i9] ? v9[i9].trim() : null;
  const line10 = v10[i10] ? v10[i10].trim() : null;

  if (line9 !== line10) {
    sampleDiffs.push({
      lineNum9: i9 + 1,
      lineNum10: i10 + 1,
      v9: line9 ? line9.slice(0, 100) : '<EOF>',
      v10: line10 ? line10.slice(0, 100) : '<EOF>'
    });
    diffCount++;
    if (sampleDiffs.length >= 30) break;
  }
  i9++;
  i10++;
}

console.log('Sample diffs:', JSON.stringify(sampleDiffs, null, 2));
