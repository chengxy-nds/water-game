const fs = require('fs');
const s = fs.readFileSync('demo/v10.html', 'utf8');

const p = s.indexOf('function performLiquidPour');
if (p !== -1) {
  console.log(s.slice(p, p + 4000));
}

const b = s.indexOf('function buildGravityStreamSVG');
if (b !== -1) {
  console.log(s.slice(b, b + 2500));
}
