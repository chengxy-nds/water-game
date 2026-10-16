const fs = require('fs');
const { execSync } = require('child_process');

let stdout = '';
try {
  stdout = execSync('git diff --no-index demo/v5.html demo/v7.html', { maxBuffer: 10 * 1024 * 1024 }).toString();
} catch (e) {
  stdout = e.stdout ? e.stdout.toString() : '';
}

const lines = stdout.split('\n');
console.log('Total diff lines:', lines.length);

let addedCount = 0;
let removedCount = 0;
for (const l of lines) {
  if (l.startsWith('+') && !l.startsWith('+++')) addedCount++;
  if (l.startsWith('-') && !l.startsWith('---')) removedCount++;
}
console.log('Added lines:', addedCount, 'Removed lines:', removedCount);

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

console.log('Total chunks:', chunks.length);

chunks.forEach((chunk, i) => {
  console.log(`\n--- Chunk ${i + 1}: ${chunk[0]} ---`);
  const diffs = chunk.filter(l => (l.startsWith('+') || l.startsWith('-')) && !l.startsWith('+++') && !l.startsWith('---'));
  console.log(diffs.slice(0, 25).join('\n'));
});
