# 水排序益智游戏视觉契约与规范 (Water Game Style Contract)

> 本规范基于工业级游戏 UI 设计工作流建立，是本项目所有界面、组件、动效与美术素材的唯一视觉事实来源（Single Source of Truth）。

---

## 1. 平台与视口契约 (Platform & Viewport)

- **目标平台**：Web / Mobile H5 / 微信小游戏 (支持响应式适配)
- **基准比例**：9:16 (移动端纵向基准 375x667 ~ 430x932)
- **安全区规范**：
  - 顶部安全区：≥ 44px (留出系统状态栏与胶囊按钮间距)
  - 底部安全区：≥ 34px (留出 iOS Home Indicator 空间)
  - 内容区边距：水平内边距 16px

---

## 2. 光影与材质规范 (Lighting & Materials)

- **全局统一光源**：`Top-Left 45°` 柔和顶光。
  - **原则**：游戏场景内的所有物体（瓶子高光、水流反光、购物袋阴影、按钮突起）必须共享此光源方向，严禁不同元素光源方向冲突导致拼贴感。
- **材质定义**：
  1. **瓶身/试管 (Bottle Container)**：高透亚克力 / 光洁玻璃质感。左上方带有细条白色线性高光（Opacity 0.45），内壁折射微反光。
  2. **水体液体 (Water Liquids)**：半透明果冻液体质感。各层水体交界处保留 1px 微微表面张力弧线；顶层液体受水流冲击时有轻微水波凹陷反馈。
  3. **水流 (Water Stream)**：平滑抛物线贝塞尔曲线（Cubic Bezier），带水柱半透明高光与注入点微水花。
  4. **功能底框与模态窗口 (Panels & Modals)**：现代毛玻璃质感（Glassmorphism），`backdrop-filter: blur(16px)`，边框带有 1px 半透明白色微光描边。

---

## 3. 几何与尺寸规范 (Geometry & Tokens)

| 元素分类 | 尺寸基准 (px) | 圆角阶梯 (Border Radius) | 描边规范 (Stroke) |
| :--- | :--- | :--- | :--- |
| **主试管 (Bottle)** | 宽 64px × 高 170px | 顶部开口 4px, 底部圆角 24px | 2px 浅蓝白色高光外描边 |
| **主操作按钮 (Primary Btn)** | 高 48px ~ 52px | 16px / 全圆角 Pill | 2px 浅色浮雕高光 |
| **小工具按钮 (Utility Btn)** | 42px × 42px 正方形 | 12px 圆角 | 1px 细边框 |
| **弹窗卡片 (Modal Card)** | 最大宽度 400px | 24px 大圆角 | 1px 半透明微发光边框 |

---

## 4. 动效与时间契约 (Motion & Timing Contract)

为杜绝卡顿与跳跃，动效严格执行统一的物理时间常数：

```yaml
motion:
  bottle_lift:
    duration_ms: 180
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" # 选中抬升轻盈迅速
  bottle_pour_tilt:
    duration_ms: 380
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"   # 倾倒平滑无顿挫
  liquid_fill:
    duration_ms: 400
    easing: "cubic-bezier(0.25, 0.1, 0.25, 1)" # 液体平稳上涨
  modal_popup:
    duration_ms: 220
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" # 弹窗轻微弹性弹出
```

---

## 5. 组件状态机规范 (Component State Machine)

任何交互控件必须完整定义以下状态，禁止“无状态反馈”：

- **瓶子容器状态**：
  1. `IDLE`（静止待命）：平稳立于底座。
  2. `HOVER` / `TAP`（轻触）：轻微发光缩放反馈。
  3. `SELECTED`（选中态）：平滑上移 20px，外发光光晕呼吸循环。
  4. `POURING`（倾倒态）：平滑平移并倾斜 -72°，瓶口对准目标瓶口。
  5. `FILLING`（受水态）：轻微垂直沉降 2px 后恢复，液面平稳上涨。
  6. `COMPLETED`（装满同色通关）：瓶口弹出五彩碎纸与光圈粒子特效。

- **按钮状态**：
  1. `Normal`：默认明亮饱满。
  2. `Hover`：亮度提升 8%，缩放 1.04。
  3. `Pressed`：下陷 2px，缩放 0.96，亮度降低 5%。
  4. `Disabled`：饱和度降低 50%，不透明度 0.45，禁止指针事件。

---

## 6. 素材制作与交付铁律 (Asset Delivery Policies)

1. **底模无文字铁律（No-Text Policy）**：
   - 所有生成的切图（按钮底板、关卡框、弹窗面板、标签底纹）**严禁包含汉字、英文或数字**。
   - 所有文案（如“重来”、“撤销”、“提示”、“第 1 关”）均由代码层动态居中排版渲染。
2. **透明通道（Real Alpha Channel）**：
   - 瓶身外部、按钮边缘、图标背景必须为真透明 PNG 或 SVG，边缘平滑无白边/黑边杂色残留。
3. **9-Slice 九宫格拉伸标准**：
   - 可变长度的背景框切图必须标注 `[left, right, top, bottom]` 保留边距，确保拉伸时不发生角点变形。
