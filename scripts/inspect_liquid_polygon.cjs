const fs = require('fs');
const s = fs.readFileSync('demo/v10.html', 'utf8');

const p = 208917;
console.log(s.slice(p + 8500, p + 14000));
