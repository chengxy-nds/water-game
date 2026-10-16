const fs = require('fs');
const v5 = fs.readFileSync('demo/v5.html', 'utf8');

console.log('--- TOP BUTTONS ---');
let idx = 0;
while ((idx = v5.indexOf('class="svg-btn-top"', idx)) !== -1) {
  let start = v5.lastIndexOf('<svg', idx);
  let end = v5.indexOf('</svg>', idx) + 6;
  console.log(v5.slice(start, end));
  idx = end;
}

console.log('--- BOTTOM BUTTONS ---');
idx = 0;
while ((idx = v5.indexOf('class="svg-btn-bottom"', idx)) !== -1) {
  let start = v5.lastIndexOf('<svg', idx);
  let end = v5.indexOf('</svg>', idx) + 6;
  console.log('BUTTON AT', start, ':');
  console.log(v5.slice(start, end));
  idx = end;
}
