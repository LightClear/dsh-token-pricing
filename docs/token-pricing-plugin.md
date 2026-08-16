# dsh-token-pricing —— 给你的每个对话一份「账单」

> 这是一款**第三方（非官方）插件**，由社区维护，与 deepseek-ai 官方发布无关。

还在靠猜来估算一次对话花了多少 token、多少美元？`dsh-token-pricing` 让 DeepSeek Harness 的 Web 界面直接显示会话费用：按提供方/模型配置一次价格，之后**每一轮、每一个模型花了多少钱，界面上都能实时看到**。

- 🔗 **GitHub 仓库**：[LightClear/dsh-token-pricing](https://github.com/LightClear/dsh-token-pricing)
- 🚀 **一条命令安装**：`dsh plugin --profile web add dsh-token-pricing`

## 它能做什么

简单说，它做两件事：**配置价格**，以及**展示费用**。

配置价格在「设置 → 模型定价」完成：为每个提供方、每个模型填好每百万 token 的美元单价（输入缓存未命中、输入缓存命中、输出三档，可另配高峰时段价格）。配置完成后，费用会在三个地方呈现：

- **底部数据栏** —— 一眼看到会话的 `输入 $X · 输出 $Y · 总计 $Z`
- **费用浮窗** —— 右下角的小球，点开能看按轮 / 按模型的明细
- **设置页** —— 随时回来修改价格

## 功能一览

### 配置模型价格与高峰时段规则

![设置页：展示具体模型的设置页面，读取已设置的模型配置，并配置模型价格与高峰期计价规则](settings-page.png)

模型目录按提供方分组为卡片，每个模型带已配置/未配置圆点。展开模型即可编辑三档基础费率，以及可选的高峰期计价：启用后可增删任意多个高峰时段，支持跨午夜（如 22:00–08:00）、本地时间或 UTC，当前时间落入任一时段即按高峰价计费。

### 底部数据栏的实时费用

![会话底部数据栏：展示对话框底部数据区域的计价数据](bottom-data-view.png)

对话框底部数据栏在出厂统计行旁显示会话费用，随对话实时更新，和浮窗总计永远一致。

### 可折叠、可拖拽的费用浮窗

![费用浮窗折叠态：右下角小球显示会话总费用](floating-window-folded.png)

平时收起为右下角的小球，显示会话累计费用，不占空间；点击即展开。

![费用浮窗展开态：完整窗口，含标题栏、视图切换与底部总计](floating-window-expanded.png)

展开后可在「按轮计价」与「按模型计价」两种视图间切换，小球、标题栏、底部总计栏都可拖拽，想放哪就放哪。

#### 按轮计价

![费用浮窗的按轮计价页面](floating-window-turn.png)

按对话轮次列出每一轮（轮次号与开始时间）用到的路由、token 数与费用；一轮中途切换模型时自动拆成多行。

#### 按模型计价

![费用浮窗的按模型计价页面](floating-window-model.png)

按会话中使用过的所有模型聚合 token 数与费用，按首次使用顺序排列。未配置价格的模型仍会显示 token 数，并提示 `未设置计价`。

## 为什么值得用

- **一次配置，处处可见** —— 价格只需配一次，所有会话的读数自动生效。
- **零侵入、零开销** —— 不向模型请求添加任何工具、提示或消息，不影响 token 消耗与 KV 缓存，纯「只读」展示。
- **数据随会话持久化** —— 费用明细来自会话日志，重启后还原，归档的会话也一并保留；改价之后历史费用会按新价自动重算。
- **轻量依赖** —— 仅自用两个运行时依赖，安装不会拉取任何内部包。

## 快速开始

安装到 web profile：

```sh
dsh plugin --profile web add dsh-token-pricing
dsh web
```

随后打开「设置 → 模型定价」配置价格，回到对话即可看到费用读数。更新与卸载：

```sh
dsh plugin --profile web update dsh-token-pricing
dsh plugin --profile web remove dsh-token-pricing
```

完整的安装说明（含前置条件与 git 源安装）见 [README.md](../README.md)。

## 获取插件

- **GitHub 仓库**：[LightClear/dsh-token-pricing](https://github.com/LightClear/dsh-token-pricing) —— 源码、构建产物、使用文档都在这里
- **安装**：`dsh plugin --profile web add dsh-token-pricing`（未发布到 npm 时可用 `dsh plugin --profile web add github:LightClear/dsh-token-pricing`）

## 已知限制

- 压缩摘要步骤不计费（与内置 token 计量口径一致）。
- 未上报计费的适配器调用不产生记录。
- 浮窗拖拽位置刷新后重置。
- 底部数据栏只覆盖已配置价格的路由，未配置部分在浮窗的按模型视图中显示为未计价。

欢迎到 GitHub 仓库提 Issue 或 Star ⭐。
