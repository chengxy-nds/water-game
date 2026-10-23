const fs = require('fs');
const s = fs.readFileSync('demo/v10.html', 'utf8');

function extractBlock(startStr, endStr) {
  const p1 = s.indexOf(startStr);
  if (p1 === -1) return 'NOT FOUND: ' + startStr;
  const p2 = s.indexOf(endStr, p1 + startStr.length);
  if (p2 === -1) return s.slice(p1, p1 + 2000);
  return s.slice(p1, p2 + endStr.length);
}

console.log('=== LEVEL MODAL HTML ===');
const levelModalStart = s.indexOf('id="level-modal-mask"');
if (levelModalStart !== -1) {
  console.log(s.slice(levelModalStart - 50, levelModalStart + 1500));
}

console.log('\n=== VICTORY MODAL HTML ===');
const victoryModalStart = s.indexOf('id="modal-mask"');
if (victoryModalStart !== -1) {
  console.log(s.slice(victoryModalStart - 50, victoryModalStart + 1500));
}

console.log('\n=== getPhysicalSpillAngleDeg & buildGravityStreamSVG ===');
const pourStart = s.indexOf('function getPhysicalSpillAngleDeg');
if (pourStart !== -1) {
  console.log(s.slice(pourStart, pourStart + 2500));
}
