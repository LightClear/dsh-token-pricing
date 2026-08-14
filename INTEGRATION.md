# Token Pricing Plugin — 独立存档仓库

这是 `@deepseek-ai/dsh-client-token-pricing` 的源码存档：DeepSeek Harness 的**模型定价**插件——按提供方/模型配置每百万 token 价格（输入缓存命中/未命中、输出、可选高峰时段），并在会话底部数据栏显示输入/输出/总费用。

> **本仓库不是自包含项目**：插件的运行时与构建都依赖 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 主仓库（内部包 `@deepseek-ai/dsh-*` 全部是 `workspace:^` 引用且未发布到 npm，构建走 harness 的 `tsdown` 客户端预设，装载依赖 `dsh.client` manifest 约定）。请按下方「安装到 harness」的步骤使用。

## 仓库结构

```
src/settings.ts            持久化设置命名空间 schema（token-pricing 段）
src/index.ts               node 半身：注册设置命名空间
src/invariant.ts           包 invariant 伴随件
src/client/pricing.ts      纯费用计算（窗口/匹配/计价/格式化）
src/client/PricingDock.tsx 会话底部数据栏读数
src/client/PricingSection.tsx  设置页（模型页风格）
tests/                     4 个 spec（jsdom 组件 + 纯函数 + apply 生命周期）
harness-integration.patch  harness 主仓库侧的全部集成改动（见下）
```

## 安装到 harness（推荐用法）

1. 克隆 harness 并切到与本存档一致的基线（本存档基于 `master@2026-08-14`）
2. 把本仓库的 `src/`、`tests/`、`package.json`、`tsconfig.json`、`tsdown.config.ts` 复制到 `packages/client/token-pricing/`
3. 应用 `harness-integration.patch`（在 harness 根目录执行 `git apply <本仓库>/harness-integration.patch`）——包含：
   - `packages/bundle/web-app/cordis.patch.yml`：`ui-token-pricing` 行
   - `packages/bundle/web-app/package.json`：依赖声明
   - `tsconfig.client.json`：客户端聚合引用
   - `packages/host/apiproxy/src/api-proxy.ts`：`WEB_SETTINGS_NAMESPACES` 加入 `token-pricing`（wire 暴露白名单，**缺少它设置页无法读写配置**）
   - `packages/client/ui-primitives`：`IconCoinOutline16` 图标 + 图标计数测试
   - `packages/client/ui-settings-general`：设置导航把 `model-pricing` 映射到硬币图标 + 测试
   - 对应的测试文件
4. `pnpm install && pnpm run build`，重启 `dsh web`
5. 打开 设置 → 模型定价 配置价格；价格持久化在 `$DSH_HOME/settings.yaml`

## 独立构建（受限、不推荐）

理论上可以把 `workspace:^` 依赖换成指向 harness 克隆的 `file:` 依赖并内联构建预设，但当前存在硬性障碍：**wire 暴露白名单在 apiproxy 包内**，独立仓库无法自我声明暴露（apiproxy 注释中标记为延期工作）。在 harness 实现 `settings.register()` 自我暴露之前，独立仓库无法端到端运行。因此本存档只保证「放回 harness」用法。

## 行为摘要

- 未配置价格的模型在底部数据栏**不显示任何费用**（提供方+模型精确匹配）
- 高峰定价按当前时间选择高峰/非高峰档（支持跨午夜窗口、本地时间或 UTC，每分钟刷新）
- 缓存写入按缓存未命中价计费（DeepSeek 计费语义）；读数为按当前价格的估算，不是逐请求账单

详见 [README.md](README.md)（含已知限制）。
