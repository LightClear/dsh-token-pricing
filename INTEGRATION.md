# dsh-token-pricing 插件仓库

DeepSeek Harness 的**模型定价**插件：按提供方/模型配置每百万 token 价格（输入缓存命中/未命中、输出、任意多个高峰时段），提供会话费用数据栏读数与可折叠可拖拽的费用浮窗（按轮计价 / 按模型计价）。按轮用量由 `tokenPricing` 会话投影从会话日志派生，随会话持久化与归档。

> 本仓库是 harness 的**插件包**（dual-face：node 半身 + `dsh.client` 浏览器半身）。`dsh-token-pricing` 是一款**第三方（非官方）插件**，由社区维护，与 deepseek-ai 官方发布无关；安装走的是 harness 官方的 `dsh plugin` 机制。本包只声明两个自用运行时依赖（`schemastery`、`zod`）；其余 `@deepseek-ai/dsh-*` 由 dsh 安装本身提供（双锚点解析），因此安装不会拉取任何未发布的内部包。

## 安装（推荐：官方 dsh plugin 机制）

前置：Node ≥ 22、pnpm、已安装 dsh（`npm i -g` 或源码 `pnpm dsh`）。

```sh
# 1. 安装到 web profile（自动初始化 profile、安装依赖、注册补丁层）
dsh plugin --profile web add dsh-token-pricing

# 2. 启动
dsh web          # 或 dsh --profile web web
```

`dsh plugin add` 内部完成三件事：把本包装进 `$DSH_HOME/profiles/web/` 的依赖 → 依据 `dsh.bundle` 声明把它加入 profile 的补丁层栈 → `cordis.patch.yml` 里的一行 row 同时挂载 node 半身（Host）与浏览器半身（`dsh.client` 扫描）。更新与卸载：

```sh
dsh plugin --profile web update dsh-token-pricing    # 更新
dsh plugin --profile web remove dsh-token-pricing    # 卸载（依赖与补丁层一并移除）
```

未发布到 npm 时，同一机制支持 git 源（仓库内已提交构建好的 `lib/`）：

```sh
dsh plugin --profile web add github:LightClear/dsh-token-pricing
```

## 从源码安装进 harness 主仓库（开发/集成用）

1. 克隆 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 并切到基线（本存档基于 `master@47f943859b`）
2. 把本仓库的 `src/`、`tests/`、`package.json`、`tsconfig.json`、`tsconfig.host.json`、`tsdown.config.ts` 复制到 `packages/client/token-pricing/`（注意把 `src/invariant.ts` 的包名与 `tsdown.config.ts` 的 id 改回 `@deepseek-ai/dsh-client-token-pricing`）
3. 应用 `harness-integration.patch`（`git apply <本仓库>/harness-integration.patch`）——包含 web-app bundle 行、依赖声明、两个 tsconfig 聚合引用、`IconCoinOutline16` 导航图标与测试
4. `pnpm install && pnpm run build`，重启 `dsh web`

> settings 的 wire 暴露不再需要改 apiproxy：上游 self-exposure 机制（`SettingsRegisterOptions.remote`）合入后，本插件的注册自带 `remote: true`。若基线早于该 PR，补丁内的 apiproxy 白名单行是等价的临时方案。

## 仓库结构

```
cordis.patch.yml           dsh.bundle 补丁层（一行 token-pricing row）
src/settings.ts            持久化设置命名空间 schema（多时段 + 旧单时段迁移 transform）
src/types.ts               tokenPricing 投影视图类型 + SessionProjectionMap 合并
src/projection.ts          Host 投影单元：会话日志折叠为逐步用量事实
src/index.ts               node 半身：注册设置命名空间（remote: true）+ 投影单元
src/invariant.ts           包 invariant 伴随件
src/client/pricing.ts      纯费用计算（多时段判定/路由匹配/逐步计价/聚合/格式化）
src/client/PricingDock.tsx 会话底部数据栏读数（仅费用）
src/client/PricingFloat.tsx 浮窗（折叠球 + 展开面板、拖拽、顶部锚定）
src/client/PricingSection.tsx 设置页（多时段编辑器）
lib/                       预构建产物（node 半身 + 浏览器 bundle，随包发布）
tests/                     6 个 spec
docs/                      6 张界面截图（README 功能亮点配图）
harness-integration.patch  源码集成进 harness 主仓库的全部改动
```

## 行为摘要

- 数据栏显示 `输入 $X · 输出 $Y · 总计 $Z`，对每个已计价步骤按其自身时间与派发路由计价；未配置计价的路由不计入数据栏数字
- 浮窗折叠态是右下角费用小球；展开后可在「按轮计价」/「按模型计价」间切换，未配置计价的路由显示 token 数与 `未设置计价` 提示；小球、标题栏与底部总计栏均可拖拽，展开态顶部锚定、底部延展
- 高峰定价支持任意多个时段（默认一段，可增删），当前时间落入任一时段即按高峰价计费；支持跨午夜窗口、本地时间或 UTC
- 旧版单时段条目（`peakStart`/`peakEnd`）在读取时自动迁移为 `peakWindows`

详见 [README.md](README.md)（含已知限制与界面截图）。
