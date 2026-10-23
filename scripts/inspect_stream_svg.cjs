const fs = require('fs');
const s = fs.readFileSync('demo/v10.html', 'utf8');

const b = 335489;
console.log(s.slice(b, b + 4500));
