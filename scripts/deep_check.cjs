const fs = require('fs');
const { execSync } = require('child_process');

let stdout = '';
try {
  stdout = execSync('git diff -U4 --no-index demo/v5.html demo/v7.html', { maxBuffer: 10 * 1024 * 1024 }).toString();
} catch (e) {
  stdout = e.stdout ? e.stdout.toString() : '';
}

const lines = stdout.split('\n');
let chunks = [];
let cur = [];
for (const l of lines) {
  if (l.startsWith('@@')) {
    if (cur.length) chunks.push(cur);
    cur = [l];
  } else if (cur.length) {
    cur.push(l);
  }
}
if (cur.length) chunks.push(cur);

console.log(`=== 深度排查：v5.html -> v7.html 共 ${chunks.length} 个差异区块 ===\n`);

chunks.forEach((c, idx) => {
  const header = c[0];
  const diffs = c.filter(l => (l.startsWith('+') || l.startsWith('-')) && !l.startsWith('+++') && !l.startsWith('---'));
  console.log(`【Chunk ${idx + 1}】: ${header}`);
  diffs.forEach(d => console.log('  ' + d));
  console.log('');
});
