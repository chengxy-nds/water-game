// Test tilted liquid polygon logic
const w = 56.0;
const h = 171.0;
const inner_l = 0.03284 * w; // 1.84
const inner_r = 0.96716 * w; // 54.16
const inner_w = inner_r - inner_l; // 52.32
const cx = (inner_l + inner_r) * 0.5; // 28.0
const bot_y = 0.92255 * h; // 157.75
const unit_h = 0.17745 * h; // 30.34
const rx = inner_w * 0.5; // 26.16

function getLayerPoly(cur_bot, cur_top, tilt_deg) {
  const rad = tilt_deg * Math.PI / 180.0;
  // Slope in tube coordinates: m = -tan(rad)
  const m = -Math.tan(rad);
  
  // Surface at cur_top
  const y_top_l = cur_top - m * rx;
  const y_top_r = cur_top + m * rx;
  
  // Bottom interface at cur_bot
  const y_bot_l = cur_bot - m * rx;
  const y_bot_r = cur_bot + m * rx;
  
  console.log(`Tilt ${tilt_deg}deg: TopL=${y_top_l.toFixed(1)}, TopR=${y_top_r.toFixed(1)}, BotL=${y_bot_l.toFixed(1)}, BotR=${y_bot_r.toFixed(1)}`);
}

console.log('=== Tilt Tests ===');
getLayerPoly(157.75 - 30.34, 157.75 - 60.68, 0);
getLayerPoly(157.75 - 30.34, 157.75 - 60.68, 45);
getLayerPoly(157.75 - 30.34, 157.75 - 60.68, 65);
getLayerPoly(157.75 - 30.34, 157.75 - 60.68, -65);
