const fs = require('fs');

const v8 = fs.readFileSync('e:/GithubProjects/water-game/demo/v8.html', 'utf8');
const v9 = fs.readFileSync('e:/GithubProjects/water-game/demo/v9.html', 'utf8');

// 1. 检查 JS 函数差异
function extractFunctions(code) {
  const fns = {};
  const regex = /function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/g;
  let m;
  while ((m = regex.exec(code)) !== null) {
    fns[m[1]] = m[2];
  }
  return fns;
}

const f8 = extractFunctions(v8);
const f9 = extractFunctions(v9);

const newFns = Object.keys(f9).filter(k => !f8[k]);
const delFns = Object.keys(f8).filter(k => !f9[k]);
console.log('--- 新增函数 ---', newFns);
console.log('--- 删除函数 ---', delFns);

// 2. 检查 MECHANIC_INTROS 或 checkAndShowMechanicIntro 附近的变动
function getSnippet(code, startPattern, endPattern) {
  const start = code.indexOf(startPattern);
  if (start === -1) return '';
  const end = code.indexOf(endPattern, start);
  return end === -1 ? code.slice(start, start + 2000) : code.slice(start, end);
}

console.log('\n--- checkAndShowMechanicIntro in v9 ---');
const idxIntro = v9.indexOf('function checkAndShowMechanicIntro');
if (idxIntro !== -1) {
  console.log(v9.slice(idxIntro, idxIntro + 1200));
}

// 3. 检查弹窗 F 的 DOM 结构
const idxModalF_v9 = v9.indexOf('id="mechanic-modal-mask"');
if (idxModalF_v9 !== -1) {
  console.log('\n--- 弹窗 F DOM (v9) ---');
  console.log(v9.slice(idxModalF_v9 - 100, idxModalF_v9 + 1800));
}
