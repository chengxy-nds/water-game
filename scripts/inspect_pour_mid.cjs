const fs = require('fs');
const s = fs.readFileSync('demo/v10.html', 'utf8');

const p = s.indexOf('function performLiquidPour');
const nextFunc = s.indexOf('function buildGravityStreamSVG');
console.log(s.slice(p + 1500, nextFunc));
