const fs = require('fs');
const path = require('path');

const c10 = fs.readFileSync(path.join(__dirname, '../demo/v10.html'), 'utf-8');
const p = c10.indexOf('elapsed < moveDuration + pourDuration + returnDuration');
console.log(c10.slice(p - 100, p + 2200));
