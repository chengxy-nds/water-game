const fs = require('fs');

const v8 = fs.readFileSync('e:/GithubProjects/water-game/demo/v8.html', 'utf8');
const v9 = fs.readFileSync('e:/GithubProjects/water-game/demo/v9.html', 'utf8');

console.log(`v8 lines: ${v8.split('\n').length}, v9 lines: ${v9.split('\n').length}`);

// 提取主要标题或版本注释
const v9Comments = v9.match(/<!--.*?-->/gs) || [];
const v8Comments = new Set(v8.match(/<!--.*?-->/gs) || []);

const newComments = v9Comments.filter(c => !v8Comments.has(c));
console.log('--- 新增或修改的 HTML 注释标记 (前 20 条) ---');
console.log(newComments.slice(0, 20).join('\n'));

// 查找关卡生成器或核心逻辑中的关键字差异
const keywords = [
  'version', 'special', 'mechanic', 'potion', 'ice', 'stone', 'lock', 'cat',
  'bag', 'vine', 'crystal', 'shield', 'fire', 'portal', 'bomb', 'magnet',
  'curse', 'gold', 'rainbow', 'mirror', 'bubble', 'cloud', 'light'
];

console.log('--- 关键字在 v8 vs v9 中的出现频次对比 ---');
keywords.forEach(kw => {
  const c8 = (v8.match(new RegExp(kw, 'gi')) || []).length;
  const c9 = (v9.match(new RegExp(kw, 'gi')) || []).length;
  if (c8 !== c9) {
    console.log(`${kw.padEnd(12)}: v8=${c8}, v9=${c9} (diff: ${c9 - c8})`);
  }
});
