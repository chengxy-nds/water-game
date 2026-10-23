const { execSync } = require('child_process');
const fs = require('fs');

const script = `
window.addEventListener("load", () => {
  setTimeout(() => {
    const slots = Array.from(document.querySelectorAll('.bottle-slot')).map((el, i) => {
      const r = el.getBoundingClientRect();
      const pad = el.querySelector('.burlap-coaster-pad')?.getBoundingClientRect();
      const svg = el.querySelector('.bottle-svg')?.getBoundingClientRect();
      return {
        i,
        slot: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        pad: pad ? { x: Math.round(pad.x), y: Math.round(pad.y), w: Math.round(pad.width), h: Math.round(pad.height) } : null,
        svg: svg ? { x: Math.round(svg.x), y: Math.round(svg.y), w: Math.round(svg.width), h: Math.round(svg.height) } : null
      };
    });
    const grid = document.querySelector('.bottles-grid')?.getBoundingClientRect();
    const topBar = document.querySelector('.top-bar')?.getBoundingClientRect();
    const bottomBar = (document.querySelector('.bottom-dock') || document.querySelector('.dock-bar') || document.querySelector('.bottom-bar'))?.getBoundingClientRect();
    const out = JSON.stringify({
      grid: grid ? { x: Math.round(grid.x), y: Math.round(grid.y), w: Math.round(grid.width), h: Math.round(grid.height) } : null,
      topBar: topBar ? { x: Math.round(topBar.x), y: Math.round(topBar.y), w: Math.round(topBar.width), h: Math.round(topBar.height) } : null,
      bottomBar: bottomBar ? { x: Math.round(bottomBar.x), y: Math.round(bottomBar.y), w: Math.round(bottomBar.width), h: Math.round(bottomBar.height) } : null,
      slots
    });
    console.log('METRICS_OUTPUT_START' + out + 'METRICS_OUTPUT_END');
  }, 600);
});
`;

let v10 = fs.readFileSync('e:/GithubProjects/water-game/demo/v10.html', 'utf8');
v10 = v10.replace('</body>', '<script>' + script + '</script></body>');
fs.writeFileSync('e:/GithubProjects/water-game/scripts/temp_v10_inspect.html', v10);

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
try {
  const res = execSync(`"${chromePath}" --headless=new --window-size=414,896 --enable-logging=stderr "file:///e:/GithubProjects/water-game/scripts/temp_v10_inspect.html"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  console.log(res);
} catch (err) {
  console.log(err.stdout || err.stderr || err.message);
}
