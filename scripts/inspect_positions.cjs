const fs = require('fs');
const s = fs.readFileSync('demo/v10.html', 'utf8');

const p = s.indexOf('function performLiquidPour');
const b = s.indexOf('function buildGravityStreamSVG');
console.log('p:', p, 'b:', b);
if (b < p) {
  // buildGravityStreamSVG is before performLiquidPour or inside it?
  console.log(s.slice(p, p + 2500));
} else {
  console.log(s.slice(p, p + 1500));
}
