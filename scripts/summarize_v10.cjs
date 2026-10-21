const fs = require('fs');
const path = require('path');

const c9 = fs.readFileSync(path.join(__dirname, '../demo/v9.html'), 'utf-8');
const c10 = fs.readFileSync(path.join(__dirname, '../demo/v10.html'), 'utf-8');

// 提取 v10 的新变动主题
const features = [];

// 1. 检查声学系统
if (c10.includes('playWarmAcousticNote')) {
  features.push({
    category: '真实物理生活级拟音声学系统 (Warm Acoustic ASMR)',
    details: [
      '新增 playWarmAcousticNote：合成温润木质/玻璃/软木塞原声，带低通滤波截断，彻底消除刺耳噪点',
      '新增 playNoiseBrush：基于粉红噪声模拟指尖触碰磨砂玻璃与亚麻布软垫微摩擦声',
      '重构 playSound 中的 select、deselect、bottle_land、pack、win 音效，带来沉浸式生活拟物感'
    ]
  });
}

// 2. 检查起飞与倒水无跳动
if (c10.includes('preLiftedRectL') || c10.includes('确保起飞第0帧零跳动')) {
  features.push({
    category: '起飞与落座双向绝对零跳动 (Zero-Jank Motion Engine)',
    details: [
      '起飞前精确测量被选中抬起状态下的真实屏幕坐标（preLiftedRectL / preLiftedRectR），消除移除 .selected 时的瞬移闪烁',
      '瓶口微物理对齐采用更加自然的弧线飞行轨迹',
      '落座时彻底剔除 settling 二次拔高，并无缝衔接 bottle_land 触垫微音与 startSettleSloshAnimation 阻尼回弹'
    ]
  });
}

// 3. 检查瓶身浮动高度与视觉投影
if (c10.includes('translateY(-20px) scale(1.03)')) {
  features.push({
    category: '高定视觉调优 (Refined Visual Depth)',
    details: [
      '拿起浮动高度由 -22px 调整为更为克制优雅的 -20px，缩放比例优化为 1.03',
      '亚麻布接触阴影与悬停双层投影柔化，过渡更加自然高级'
    ]
  });
}

console.log('=== V10 核心升级特性清单 ===');
console.log(JSON.stringify(features, null, 2));
