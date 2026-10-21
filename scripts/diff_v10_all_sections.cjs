const fs = require('fs');
const path = require('path');

const c9 = fs.readFileSync(path.join(__dirname, '../demo/v9.html'), 'utf-8');
const c10 = fs.readFileSync(path.join(__dirname, '../demo/v10.html'), 'utf-8');

// 按照主要模块切割比对
const sections = [
  { name: 'Head & CSS', start: '<head>', end: '</head>' },
  { name: 'HTML Structure', start: '<body>', end: '<script>' },
  { name: 'Colors & Constants', start: '<script>', end: 'const MECHANIC_INTROS' },
  { name: 'Mechanic Intros & Levels', start: 'const MECHANIC_INTROS', end: 'let currentLevelId' },
  { name: 'Global State & UI Utils', start: 'let currentLevelId', end: 'function renderBagSVG' },
  { name: 'SVG Renderers', start: 'function renderBagSVG', end: 'function renderAll' },
  { name: 'Core Stage Render & Layout', start: 'function renderAll', end: 'function onBagClick' },
  { name: 'Bag & Selection Logic', start: 'function onBagClick', end: 'function performLiquidPour' },
  { name: 'Pour Motion & Effects', start: 'function performLiquidPour', end: 'const bgStarCanvas' },
  { name: 'Audio Engine & Init', start: 'let audioCtx = null', end: 'initGame();' }
];

sections.forEach(sec => {
  const p9Start = c9.indexOf(sec.start);
  const p9End = c9.indexOf(sec.end, p9Start);
  const p10Start = c10.indexOf(sec.start);
  const p10End = c10.indexOf(sec.end, p10Start);

  if (p9Start === -1 || p9End === -1 || p10Start === -1 || p10End === -1) {
    console.log(`[Section] ${sec.name}: marker not found`);
    return;
  }

  const s9 = c9.slice(p9Start, p9End).trim();
  const s10 = c10.slice(p10Start, p10End).trim();

  if (s9 === s10) {
    console.log(`[Section] ${sec.name}: 100% IDENTICAL`);
  } else {
    console.log(`[Section] ${sec.name}: CHANGED! Length v9=${s9.length}, v10=${s10.length}, diff=${s10.length - s9.length}`);
  }
});
