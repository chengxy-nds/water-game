const fs = require('fs');
const path = require('path');

const c9 = fs.readFileSync(path.join(__dirname, '../demo/v9.html'), 'utf-8');
const c10 = fs.readFileSync(path.join(__dirname, '../demo/v10.html'), 'utf-8');

// 对比 playSound 完整实现
const ps9 = c9.slice(c9.indexOf('function playSound('), c9.indexOf('function ensureAudio('));
const ps10 = c10.slice(c10.indexOf('function playSound('), c10.indexOf('function ensureAudio('));

console.log('playSound diff length:', ps9.length, ps10.length);

// 提取 performLiquidPour 的完整实现并对比行
function extractFunc(str, fnName) {
  const p = str.indexOf('function ' + fnName);
  let depth = 0;
  let start = false;
  for (let i = p; i < str.length; i++) {
    if (str[i] === '{') { depth++; start = true; }
    else if (str[i] === '}') {
      depth--;
      if (start && depth === 0) return str.slice(p, i + 1);
    }
  }
  return '';
}

const pp9 = extractFunc(c9, 'performLiquidPour');
const pp10 = extractFunc(c10, 'performLiquidPour');

const l9 = pp9.split('\n');
const l10 = pp10.split('\n');

console.log(`performLiquidPour lines: v9=${l9.length}, v10=${l10.length}`);

// 找出所有不同的行
const diffLines = [];
let maxL = Math.max(l9.length, l10.length);
for (let i = 0; i < maxL; i++) {
  const line9 = l9[i] ? l9[i].trim() : '';
  const line10 = l10[i] ? l10[i].trim() : '';
  if (line9 !== line10) {
    diffLines.push({ line: i + 1, v9: line9.slice(0, 80), v10: line10.slice(0, 80) });
  }
}

console.log('Total diff lines in performLiquidPour:', diffLines.length);
console.log('Diff sample:', JSON.stringify(diffLines.slice(0, 15), null, 2));
console.log('Diff end sample:', JSON.stringify(diffLines.slice(-15), null, 2));
