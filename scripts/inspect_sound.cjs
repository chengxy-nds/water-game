const fs = require('fs');
const s = fs.readFileSync('demo/v10.html', 'utf8');
const p = s.indexOf('playRealisticPourSound');
console.log('p:', p);
if (p !== -1) {
  console.log(s.slice(p, p + 800));
}
