const fs = require('fs');
const s = fs.readFileSync('demo/v10.html', 'utf8');

const p = 350393;
console.log(s.slice(p + 8000, p + 13000));
