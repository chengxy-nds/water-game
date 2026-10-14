# 游戏素材资产流水线规范 (Asset Pipeline)

本目录为 Stitch / Figma / 原型设计工具导入的专属素材池，严禁与运行时代码直接混杂。

## 目录分层架构

1. **`raw_assets/` (一级：源素材池)**
   - 专门存放从 Stitch、Figma、截图工具导出的原始大图、整页 UI 截图、带背景原画。
   - 严禁在代码中直接引用本目录。

2. **`processed_assets/` (二级：加工资产池)**
   - 经 MCP 智能抠图 (Alpha Matting) 处理后的纯净 32-bit RGBA 透明底模。
   - 严禁包含静态文字（遵循 No-Text 铁律）。

3. **`public/assets/` (三级：运行时产物池)**
   - 经过尺寸规整、压缩优化（WebP/PNG）供游戏直接引用的最终生产级资产。
