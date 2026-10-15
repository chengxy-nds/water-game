import { Bag } from '../types/game';
import { COLORS } from '../constants/colors';

export function renderBagSVG(bag: Bag, bagIdx = 0): string {
  if (bag.locked) {
    return `
      <svg viewBox="6 2 92 122" width="100%" height="100%">
        <defs>
          <linearGradient id="lockBagFront-${bagIdx}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#dfe4ec"/>
            <stop offset="100%" stop-color="#c3cbd8"/>
          </linearGradient>
        </defs>
        <!-- 后侧圆形绳索提手 -->
        <path d="M 38,26 C 38,3 70,3 70,26" fill="none" stroke="#9ea7b8" stroke-width="3.4" stroke-linecap="round"/>
        <!-- 袋口立体深灰内腔 -->
        <polygon points="14,27 78,27 92,20 28,20" fill="#525a6b" />
        <!-- 正面白色/浅灰袋身 -->
        <polygon points="14,27 78,27 78,118 14,113" fill="url(#lockBagFront-${bagIdx})" />
        <!-- 右侧立体折角侧面 (Gusset) + 折角中缝线 -->
        <polygon points="78,27 92,20 92,109 78,118" fill="#a5aeba" />
        <polygon points="85,23.5 92,20 92,109 85,113.5" fill="#919aa8" />
        <line x1="85" y1="23.5" x2="85" y2="102" stroke="#7c8594" stroke-width="0.9" />
        <!-- 底部折角底座 -->
        <polygon points="14,96 78,100 78,118 14,113" fill="#8b94a3" />
        <polygon points="78,100 92,92 92,109 78,118" fill="#6d7585" />
        <polygon points="78,118 92,109 85,101" fill="#596170" />
        <!-- 提手圆形加固金属孔 -->
        <circle cx="29" cy="34" r="3.4" fill="#e6ebf2" stroke="#7a8494" stroke-width="1.2"/>
        <circle cx="29" cy="34" r="1.7" fill="#3b4252"/>
        <circle cx="63" cy="34" r="3.4" fill="#e6ebf2" stroke="#7a8494" stroke-width="1.2"/>
        <circle cx="63" cy="34" r="1.7" fill="#3b4252"/>
        <!-- 前侧白色立体绳索提手 -->
        <path d="M 29,34 C 29,2 63,2 63,34" fill="none" stroke="#b0b8c7" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M 29,34 C 29,2 63,2 63,34" fill="none" stroke="#f5f8fc" stroke-width="2.4" stroke-linecap="round"/>
        <!-- 前侧圆角观察窗 -->
        <rect x="24" y="42" width="44" height="55" rx="6" fill="#7c8594" />
        <rect x="27.2" y="45.2" width="37.6" height="49.5" rx="4.2" fill="#9ea7b5" />
        <polygon points="27.2,45.2 46,45.2 27.2,82" fill="rgba(255,255,255,0.25)" />
        <g transform="translate(33, 60)">
          <rect x="0" y="3" width="24" height="19" rx="5" fill="#78899c"/>
          <rect x="0" y="0" width="24" height="19" rx="5" fill="#ffffff" stroke="#b0c4d4" stroke-width="1"/>
          <polygon points="23,6 33,1 33,18 23,13" fill="#ffffff" stroke="#b0c4d4" stroke-width="1" stroke-linejoin="round"/>
          <polygon points="9,5 9,14 17,9.5" fill="#43586e"/>
        </g>
      </svg>
    `;
  }

  const col = (bag.color && COLORS[bag.color]) ? COLORS[bag.color] : COLORS.green;
  const packedCol = bag.packedBottle ? (COLORS[bag.packedBottle] || col) : null;

  // 当瓶子从购物袋口飞入后，在购物袋透明视窗内清晰呈现塞着原木塞的对应颜色完整3D瓶子！
  const packedBottleMarkup = packedCol
    ? `
    <g clip-path="url(#bagWindowClip-${bagIdx})">
      <g class="${bag.justPacked ? 'bag-bottle-drop-in' : ''}" transform="translate(27, 45)">
        <!-- 袋内完整塞木塞瓶子的投影 -->
        <ellipse cx="19" cy="49.5" rx="13" ry="2.6" fill="rgba(0,0,0,0.28)" />
        <!-- 瓶口原木塞 (IKEA风格圆台木塞) -->
        <path d="M 14.5,6.5 L 23.5,6.5 L 22.0,12.5 L 16.0,12.5 Z" fill="#a87642" />
        <path d="M 13.0,2.8 L 14.2,7.2 A 5.2,1.3 0 0,0 23.8,7.2 L 25.0,2.8 Z" fill="#e6c396" stroke="#9c6b36" stroke-width="0.6" />
        <ellipse cx="19" cy="2.8" rx="6.0" ry="1.4" fill="#fbf0dc" stroke="#cfa472" stroke-width="0.5" />
        <!-- 玻璃瓶口环 -->
        <ellipse cx="19" cy="7.2" rx="7.2" ry="1.6" fill="#4d88e5" stroke="#9be0ff" stroke-width="0.6" />
        <!-- 瓶身玻璃与内部满格对应颜色药水 -->
        <path d="M 14.8,7.8 L 23.2,7.8 L 23.0,11.5 Q 31.5,14.5 31.5,22.0 L 31.5,47.5 A 12.5,3.2 0 0,1 6.5,47.5 L 6.5,22.0 Q 6.5,14.5 15.0,11.5 Z"
              fill="rgba(22, 45, 105, 0.45)" stroke="#68a8ff" stroke-width="1.2" />
        <!-- 满格药水柱（直达瓶肩弧线，如参考图5） -->
        <path d="M 7.2,17.2 L 30.8,17.2 L 30.8,47.2 A 11.8,3.0 0 0,1 7.2,47.2 Z"
              fill="url(#bagBotLiq-${bagIdx})" />
        <!-- 药水顶面椭圆液面 -->
        <ellipse cx="19" cy="17.2" rx="11.8" ry="2.8" fill="${packedCol.topMid}" stroke="${packedCol.topLight}" stroke-width="0.7" />
        <!-- 玻璃瓶身立体高光条 -->
        <rect x="24.8" y="20" width="3.6" height="24" rx="1.8" fill="rgba(255,255,255,0.38)" />
        <ellipse cx="24.5" cy="15.2" rx="3.2" ry="1.8" transform="rotate(24, 24.5, 15.2)" fill="rgba(255,255,255,0.45)" />
        <!-- 瓶底蓝玻厚底座 -->
        <path d="M 6.8,47.2 A 12.2,3.2 0 0,0 31.2,47.2 L 30.8,49.2 A 12.0,3.4 0 0,1 7.2,49.2 Z" fill="#1b4f9c" />
      </g>
    </g>
  `
    : '';

  return `
    <svg viewBox="6 2 92 122" width="100%" height="100%">
      <defs>
        <linearGradient id="bagFrontWhite-${bagIdx}" x1="0%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="65%" stop-color="#f7f9fc"/>
          <stop offset="100%" stop-color="#e9eef5"/>
        </linearGradient>
        <linearGradient id="bagPvcPane-${bagIdx}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#dce1e8"/>
          <stop offset="55%" stop-color="#ccd3de"/>
          <stop offset="100%" stop-color="#b6bfd0"/>
        </linearGradient>
        ${
          packedCol
            ? `
          <linearGradient id="bagBotLiq-${bagIdx}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${packedCol.left}"/>
            <stop offset="35%" stop-color="${packedCol.mid}"/>
            <stop offset="78%" stop-color="${packedCol.highlight}"/>
            <stop offset="100%" stop-color="${packedCol.right}"/>
          </linearGradient>
        `
            : ''
        }
        <clipPath id="bagWindowClip-${bagIdx}">
          <rect x="27.2" y="45.2" width="37.6" height="49.5" rx="4.2" />
        </clipPath>
      </defs>

      <!-- 底部柔和投影 -->
      <ellipse cx="52" cy="117.5" rx="41" ry="4.2" fill="rgba(0, 0, 0, 0.42)" />

      <!-- 后侧白色立体圆绳提手（带阴影与高光立体感） -->
      <path d="M 38,26 C 38,3 70,3 70,26" fill="none" stroke="#b5bfd0" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M 38,26 C 38,3 70,3 70,26" fill="none" stroke="#eef3fa" stroke-width="2.2" stroke-linecap="round"/>

      <!-- 购物袋顶部敞口内腔（瓶子从该袋口垂直飞入） -->
      <polygon points="14,27 78,27 92,20 28,20" fill="#7c8596" stroke="#cdd5e2" stroke-width="0.6" />
      <polygon points="17,26.5 76,26.5 88,21 29,21" fill="#525b6c" />

      <!-- 购物袋正面纯白立体袋身 (#FFFFFF) -->
      <polygon points="14,27 78,27 78,118 14,113" fill="url(#bagFrontWhite-${bagIdx})" />

      <!-- 购物袋右侧立体风琴折角面 (Gusset: #D9D9D9 浅灰 + #A8A8A8 中灰内折角) -->
      <polygon points="78,27 92,20 92,109 78,118" fill="#d9dde4" />
      <polygon points="85,23.5 92,20 92,109 85,113.5" fill="#b4bcc8" />
      <line x1="85" y1="23.5" x2="85" y2="101" stroke="#969fab" stroke-width="1.0" />

      <!-- 前侧窗口：主题色圆角外框 + 灰色透明PVC视窗 (严丝合缝衔接底部色块，复刻图3) -->
      <rect x="23.5" y="41.5" width="45" height="56.5" rx="6.5" fill="${col.bagMain}" />
      <!-- 灰色透明PVC内腔底色与侧面内壁暗影 -->
      <rect x="27.2" y="45.2" width="37.6" height="49.5" rx="4.2" fill="url(#bagPvcPane-${bagIdx})" />
      <polygon points="54.5,45.2 64.8,45.2 64.8,94.7 54.5,94.7" fill="rgba(115, 125, 142, 0.35)" />

      <!-- 袋内完整塞木塞对应颜色药水瓶（位于PVC透明窗内） -->
      ${packedBottleMarkup}

      <!-- PVC透明视窗表面斜向高光反射层（覆盖在袋内瓶子前方，增强真实透明窗质感） -->
      <polygon points="27.2,45.2 47.5,45.2 27.2,84.5" fill="rgba(255, 255, 255, 0.38)" pointer-events="none" />
      <line x1="28.5" y1="46.2" x2="63.5" y2="46.2" stroke="rgba(255,255,255,0.55)" stroke-width="1.0" stroke-linecap="round" />

      <!-- 底部细节：主题色底座 + 侧面折角三角形工艺（完全复刻图3右下角特写） -->
      <polygon points="14,95.5 78,99.5 78,118 14,113" fill="${col.bagMain}" />
      <polygon points="78,99.5 92,91.5 92,109 78,118" fill="${col.bagDark}" />
      <!-- 右侧底部整齐的三角形折角工艺线 -->
      <polygon points="78,118 92,109 85,101.5" fill="rgba(0, 0, 0, 0.22)" />
      <line x1="78" y1="118" x2="85" y2="101.5" stroke="rgba(255,255,255,0.18)" stroke-width="0.7" />

      <!-- 袋身正面左边缘立体高光棱线與正右边缘折角线 -->
      <line x1="14.5" y1="27.5" x2="14.5" y2="112.5" stroke="#ffffff" stroke-width="1.2" opacity="0.9" />
      <line x1="78" y1="27" x2="78" y2="118" stroke="rgba(0,0,0,0.12)" stroke-width="1.0" />

      <!-- 提手固定孔：双层立体加固圆环铆钉（复刻图3左下特写） -->
      <circle cx="29" cy="34.5" r="3.6" fill="#eef2f8" stroke="#aeb7c6" stroke-width="1.2"/>
      <circle cx="29" cy="34.5" r="1.8" fill="#485264"/>
      <circle cx="63" cy="34.5" r="3.6" fill="#eef2f8" stroke="#aeb7c6" stroke-width="1.2"/>
      <circle cx="63" cy="34.5" r="1.8" fill="#485264"/>

      <!-- 前侧白色圆形绳索提手（带立体阴影与绳股高光） -->
      <path d="M 29,34.5 C 29,2 63,2 63,34.5" fill="none" stroke="rgba(90, 105, 130, 0.32)" stroke-width="5.2" stroke-linecap="round" transform="translate(0, 1.5)"/>
      <path d="M 29,34.5 C 29,2 63,2 63,34.5" fill="none" stroke="#d5dde9" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M 29,34.5 C 29,2 63,2 63,34.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
    </svg>
  `;
}
