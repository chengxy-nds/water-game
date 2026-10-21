const fs = require('fs');
const path = require('path');

const c9 = fs.readFileSync(path.join(__dirname, '../demo/v9.html'), 'utf-8');
const c10 = fs.readFileSync(path.join(__dirname, '../demo/v10.html'), 'utf-8');

// 1. 查看新增函数 playWarmAcousticNote 和 playNoiseBrush
function getSnippetAround(content, term, linesBefore = 5, linesAfter = 35) {
  const lines = content.split('\n');
  const idx = lines.findIndex(l => l.includes(term));
  if (idx === -1) return null;
  const start = Math.max(0, idx - linesBefore);
  const end = Math.min(lines.length, idx + linesAfter);
  return lines.slice(start, end).join('\n');
}

console.log('=== playWarmAcousticNote Snippet in v10 ===');
console.log(getSnippetAround(c10, 'function playWarmAcousticNote'));

console.log('\n=== playNoiseBrush Snippet in v10 ===');
console.log(getSnippetAround(c10, 'function playNoiseBrush'));

// 2. 查看 playSound 函数在 v9 与 v10 的区别
console.log('\n=== playSound around pour sound in v10 ===');
console.log(getSnippetAround(c10, "case 'pour':"));

// 3. 查看 performLiquidPour 的倒水与落座逻辑
console.log('\n=== performLiquidPour landing in v10 ===');
console.log(getSnippetAround(c10, 'startSettleSloshAnimation', 10, 20));
