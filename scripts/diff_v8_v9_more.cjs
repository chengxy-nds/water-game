const fs = require('fs');

const v8 = fs.readFileSync('e:/GithubProjects/water-game/demo/v8.html', 'utf8');
const v9 = fs.readFileSync('e:/GithubProjects/water-game/demo/v9.html', 'utf8');

// 1. 对比 MECHANIC_INTROS
function extractObject(code, startStr) {
  const s = code.indexOf(startStr);
  if (s === -1) return '';
  const e = code.indexOf('};', s);
  return code.slice(s, e + 2);
}

const intro8 = extractObject(v8, 'const MECHANIC_INTROS =');
const intro9 = extractObject(v9, 'const MECHANIC_INTROS =');
console.log('MECHANIC_INTROS match?', intro8 === intro9);
if (intro8 !== intro9) {
  console.log('--- v8 MECHANIC_INTROS ---');
  console.log(intro8);
  console.log('--- v9 MECHANIC_INTROS ---');
  console.log(intro9);
}

// 2. 对比倒水规则函数 canPourInto, findBestPourMove, 等
const pourFns = ['canPourInto', 'getPourableCount', 'canSelectBottle', 'findBestPourMove'];
pourFns.forEach(fn => {
  const s8 = extractObject(v8, `function ${fn}`);
  const s9 = extractObject(v9, `function ${fn}`);
  console.log(`${fn} match?`, s8 === s9);
});

// 3. 对比 CSS 新增的 class
const v8Classes = new Set(v8.match(/\.[a-zA-Z0-9_-]+/g) || []);
const v9Classes = new Set(v9.match(/\.[a-zA-Z0-9_-]+/g) || []);
const newClasses = [...v9Classes].filter(c => !v8Classes.has(c));
console.log('--- 新增的 CSS 类 (前 30 个) ---', newClasses.slice(0, 30));
