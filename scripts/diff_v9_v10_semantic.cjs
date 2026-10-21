const fs = require('fs');
const path = require('path');

const c9 = fs.readFileSync(path.join(__dirname, '../demo/v9.html'), 'utf-8');
const c10 = fs.readFileSync(path.join(__dirname, '../demo/v10.html'), 'utf-8');

// 1. 查找 v10 中新增的关键词 / 函数
const funcs9 = (c9.match(/function\s+([a-zA-Z0-9_$]+)/g) || []).map(s => s.replace('function ', '').trim());
const funcs10 = (c10.match(/function\s+([a-zA-Z0-9_$]+)/g) || []).map(s => s.replace('function ', '').trim());

const newFuncs = funcs10.filter(f => !funcs9.includes(f));
const delFuncs = funcs9.filter(f => !funcs10.includes(f));

console.log('New functions in v10:', newFuncs);
console.log('Removed functions in v10:', delFuncs);

// 2. 检查 CSS 变更
const style9 = c9.match(/<style>([\s\S]*?)<\/style>/)[1];
const style10 = c10.match(/<style>([\s\S]*?)<\/style>/)[1];

console.log(`Style size: v9=${style9.length}, v10=${style10.length}`);

// 3. 检查 HTML 模板结构变更
const body9 = c9.match(/<body[\s\S]*?<\/body>/)[0];
const body10 = c10.match(/<body[\s\S]*?<\/body>/)[0];
console.log(`Body size: v9=${body9.length}, v10=${body10.length}`);

// 4. 重点比对：倒水动画 performLiquidPour、落座、选中、关卡配置
function extractFunction(content, name) {
  const marker = 'function ' + name;
  const idx = content.indexOf(marker);
  if (idx === -1) return null;
  // 简易括号平衡提取
  let openBraces = 0;
  let started = false;
  let endIdx = idx;
  for (let i = idx; i < content.length; i++) {
    if (content[i] === '{') {
      openBraces++;
      started = true;
    } else if (content[i] === '}') {
      openBraces--;
      if (started && openBraces === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  return content.slice(idx, endIdx);
}

const checkList = [
  'performLiquidPour',
  'startSettleSloshAnimation',
  'updateBottleSelectionDOM',
  'canSelectBottle',
  'findBestPourMove',
  'computeProceduralStageLayout',
  'initGame',
  'showWinModal'
];

checkList.forEach(fn => {
  const f9 = extractFunction(c9, fn);
  const f10 = extractFunction(c10, fn);
  if (!f9 || !f10) {
    console.log(`[Function] ${fn}: missing in one version (v9:${!!f9}, v10:${!!f10})`);
  } else if (f9 !== f10) {
    console.log(`[Function] ${fn}: CHANGED! Length v9=${f9.length}, v10=${f10.length}`);
    // 找出首个不同的行
    const lines9 = f9.split('\n');
    const lines10 = f10.split('\n');
    for (let i = 0; i < Math.min(lines9.length, lines10.length); i++) {
      if (lines9[i].trim() !== lines10[i].trim()) {
        console.log(`  First diff in ${fn} at line ${i+1}:`);
        console.log(`    v9 : ${lines9[i].trim()}`);
        console.log(`    v10: ${lines10[i].trim()}`);
        break;
      }
    }
  } else {
    console.log(`[Function] ${fn}: identical`);
  }
});
