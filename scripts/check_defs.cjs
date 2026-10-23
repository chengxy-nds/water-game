const fs = require('fs');
const path = require('path');

const v10Path = path.resolve(__dirname, '../demo/v10.html');
const v10Content = fs.readFileSync(v10Path, 'utf8');

const defsStart = v10Content.indexOf('let d = `') + 9;
const defsEnd = v10Content.indexOf('`;\n      defsEl.innerHTML = d;', defsStart);
const rawDefs = v10Content.slice(defsStart, defsEnd);

console.log('rawDefs starts with:', rawDefs.slice(0, 80));
console.log('rawDefs ends with:', rawDefs.slice(-80));
