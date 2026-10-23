const fs = require('fs');
const s = fs.readFileSync('demo/v10.html', 'utf8');

const modals = [];
const regex = /id="([^"]*modal[^"]*)"/gi;
let match;
while ((match = regex.exec(s)) !== null) {
  modals.push(match[1]);
}
console.log('Modals found:', modals);

// Check pour functions
const pourFuncs = [];
const pourRegex = /function\s+([a-zA-Z0-9_]*pour[a-zA-Z0-9_]*|[a-zA-Z0-9_]*spill[a-zA-Z0-9_]*|[a-zA-Z0-9_]*stream[a-zA-Z0-9_]*|[a-zA-Z0-9_]*slosh[a-zA-Z0-9_]*)\s*\(/gi;
while ((match = pourRegex.exec(s)) !== null) {
  pourFuncs.push(match[1]);
}
console.log('Pour functions:', pourFuncs);

// Check settings and level select
const otherFuncs = [];
const otherRegex = /function\s+([a-zA-Z0-9_]*level[a-zA-Z0-9_]*|[a-zA-Z0-9_]*setting[a-zA-Z0-9_]*|[a-zA-Z0-9_]*victory[a-zA-Z0-9_]*|[a-zA-Z0-9_]*particle[a-zA-Z0-9_]*)\s*\(/gi;
while ((match = otherRegex.exec(s)) !== null) {
  otherFuncs.push(match[1]);
}
console.log('Other VFX/Game functions:', otherFuncs);
