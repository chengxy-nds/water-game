/**
 * 水排序益智游戏设计令牌 (Design Tokens)
 * 遵循 Game UI Design Workflow 视觉契约体系
 * 统一管理全局动效时长、尺寸常数与光照规范，消除硬编码魔法数字
 */

export const MOTION_TOKENS = {
  /** 瓶子选中抬升时长 (ms) */
  BOTTLE_LIFT_MS: 180,
  /** 瓶子倒水倾斜旋转时长 (ms) */
  BOTTLE_POUR_TILT_MS: 380,
  /** 液体平稳上涨填充时长 (ms) */
  LIQUID_FILL_MS: 400,
  /** 模态弹窗弹出时长 (ms) */
  MODAL_POPUP_MS: 220,

  /** 缓动曲线 */
  EASING: {
    BOTTLE_LIFT: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    POUR_SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
    LIQUID_FILL: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    MODAL_SPRING: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export const GEOMETRY_TOKENS = {
  /** 试管标准宽度 (px) */
  BOTTLE_WIDTH: 64,
  /** 试管标准高度 (px) */
  BOTTLE_HEIGHT: 170,
  /** 试管圆角 (px) */
  BOTTLE_RADIUS_BOTTOM: 24,
  BOTTLE_RADIUS_TOP: 4,

  /** 倾倒角度 (deg) */
  POUR_TILT_ANGLE_DEG: 72,

  /** 水层总容量格数 */
  MAX_WATER_SEGMENTS: 4,
} as const;

export const LIGHTING_TOKENS = {
  /** 全局统一光源方向 */
  LIGHT_DIRECTION: 'top-left-45deg',
  /** 高透试管外壁线性高光透明度 */
  HIGHLIGHT_OPACITY: 0.45,
  /** 水体表面张力微弧线厚度 */
  MENISCUS_HEIGHT_PX: 2,
} as const;
