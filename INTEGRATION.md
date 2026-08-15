# Token Pricing Plugin — 独立存档仓库

这是 `@deepseek-ai/dsh-client-token-pricing` 的源码存档：DeepSeek Harness 的**模型定价**插件——按提供方/模型配置每百万 token 价格（输入缓存命中/未命中、输出、任意多个高峰时段），提供会话费用数据栏读数与可折叠可拖拽的费用浮窗（按轮计价 / 按模型计价），按轮用量由 `tokenPricing` 会话投影持久化（随会话归档一并保留）。

> **本仓库不是自包含项目**：插件的运行时与构建都依赖 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 主仓库（内部包 `@deepseek-ai/dsh-*` 全部是 `workspace:^` 引用且未发布到 npm，构建走 harness 的 `tsdown` 客户端预设，装载依赖 `dsh.client` manifest 约定）。请按下方「安装到 harness」的步骤使用。

## 仓库结构

```
src/settings.ts            持久化设置命名空间 schema（token-pricing 段，多时段 + 旧单时段迁移 transform）
src/types.ts               tokenPricing 投影视图类型 + SessionProjectionMap 合并
src/projection.ts          Host 投影单元：会话日志折叠为逐步用量事实（路由归属 + 轮次分组）
src/index.ts               node 半身：注册设置命名空间 + 投影单元
src/invariant.ts           包 invariant 伴随件
src/client/pricing.ts      纯费用计算（多时段判定/路由匹配/逐步计价/按轮按模型聚合/格式化）
src/client/PricingDock.tsx 会话底部数据栏读数（仅费用，无模型名）
src/client/PricingFloat.tsx 浮窗（折叠球 + 展开面板、拖拽、顶部锚定）
src/client/PricingSection.tsx  设置页（模型页风格、多时段编辑器）
tests/                     6 个 spec（jsdom 组件 + 纯函数 + 投影折叠 + apply 生命周期）
docs/                      6 张界面截图（README 功能亮点配图）
harness-integration.patch  harness 主仓库侧的全部集成改动（见下）
```

## 安装到 harness（推荐用法）

1. 克隆 harness 并切到与本存档一致的基线（本存档基于 `master@47f943859b`）
2. 把本仓库的 `src/`、`tests/`、`package.json`、`tsconfig.json`、`tsconfig.host.json`、`tsdown.config.ts` 复制到 `packages/client/token-pricing/`
3. 应用 `harness-integration.patch`（在 harness 根目录执行 `git apply <本仓库>/harness-integration.patch`）——包含：
   - `packages/bundle/web-app/cordis.patch.yml`：`ui-token-pricing` 行
   - `packages/bundle/web-app/package.json`：依赖声明
   - `tsconfig.client.json`：客户端聚合引用
   - `tsconfig.host.json`：Host 聚合引用（`packages/client/token-pricing/tsconfig.host.json`，供 host 侧投影 spec 编译）
   - `packages/host/apiproxy/src/api-proxy.ts`：`WEB_SETTINGS_NAMESPACES` 加入 `token-pricing`（wire 暴露白名单，**缺少它设置页无法读写配置**）
   - `packages/client/ui-primitives`：`IconCoinOutline16` 图标 + 图标计数测试
   - `packages/client/ui-settings-general`：设置导航把 `model-pricing` 映射到硬币图标 + 测试
   - 对应的测试文件
4. `pnpm install && pnpm run build`，重启 `dsh web`
5. 打开 设置 → 模型定价 配置价格；价格持久化在 `$DSH_HOME/settings.yaml`

## 独立构建（受限、不推荐）

理论上可以把 `workspace:^` 依赖换成指向 harness 克隆的 `file:` 依赖并内联构建预设，但当前存在硬性障碍：**wire 暴露白名单在 apiproxy 包内**，独立仓库无法自我声明暴露（apiproxy 注释中标记为延期工作）。在 harness 实现 `settings.register()` 自我暴露之前，独立仓库无法端到端运行。因此本存档只保证「放回 harness」用法。

## 行为摘要

- 数据栏显示 `输入 $X · 输出 $Y · 总计 $Z`，对每个已计价步骤按其自身时间与派发路由计价；未配置计价的路由不计入数据栏数字
- 浮窗（右下角小球）折叠态显示全会话总计；展开后可在「按轮计价」/「按模型计价」间切换，未配置计价的路由显示 token 数与 `未设置计价` 提示；小球、标题栏与底部总计栏均可拖拽，展开态顶部锚定、底部延展
- 按轮用量来自 `tokenPricing` 会话投影（重放会话日志），随会话持久化与归档，不产生任何新会话事件
- 高峰定价支持任意多个时段（默认一段，可增删），当前时间落入任一时段即按高峰价计费；支持跨午夜窗口、本地时间或 UTC
- 缓存写入按缓存未命中价计费（DeepSeek 计费语义）；旧版单时段条目（`peakStart`/`peakEnd`）在读取时自动迁移为 `peakWindows`

详见 [README.md](README.md)（含已知限制）。
