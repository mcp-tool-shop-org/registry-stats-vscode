<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats-vscode/readme.png" width="400" alt="Registry Stats">
</p>

<p><strong>查看每个依赖项的下载统计信息——直接在 VS Code 中查看。支持 npm、PyPI、NuGet、VS Code Marketplace 和 Docker Hub。</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.registry-stats-vscode" alt="VS Marketplace"></a>
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## 功能

Registry Stats 会扫描您的工作区，查找包清单文件（`package.json`、`pyproject.toml`、`*.csproj`），并从五个注册中心获取实时下载统计数据。对于 npm、PyPI、NuGet 和 VS Code Marketplace，无需 API 密钥。

**三种报告格式，三种受众：**

| 受众 | 格式 | 使用场景 |
|----------|--------|----------|
| **Executive** | PDF | 与利益相关者分享——单页 KPI、热门包、风险 |
| **LLM** | JSONL | 提供给 AI 工具——具有版本号、包含来源信息、适合流式处理 |
| **Dev** | Markdown | 粘贴到问题/拉取请求中——可折叠的跟踪信息、每个包的表格、错误详情 |

## 入门

1. 从 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode) 安装。
2. 打开一个包含 `package.json`、`pyproject.toml` 或 `*.csproj` 文件的项目。
3. 状态栏会自动显示您主要包的下载次数。
4. 点击活动栏中的 **Registry Stats** 图标，打开侧边栏。

## 功能

### 状态栏

您的主要包的每周下载量会显示在状态栏中。悬停以查看详细的工具提示，其中包含每日、每周、每月和总下载量。点击以打开侧边栏。

### 悬停在依赖项上

将鼠标悬停在 `package.json`、`pyproject.toml` 或 `*.csproj` 中的任何依赖项名称上，以查看其下载统计信息，这些信息会显示在工具提示表格中。

### 带有受众选择器的侧边栏

侧边栏允许您在“管理层”、“LLM”和“开发人员”报告视图之间切换。点击 **刷新** 以获取最新数据，点击 **复制** 以复制到剪贴板，或点击 **导出** 以保存到文件。

- **管理层** 导出为 PDF（使用 pdfmake 生成，无需浏览器引擎，可在任何地方使用）。
- **LLM** 导出为 JSONL（每行一个 JSON 对象，包含新鲜度和错误元数据）。
- **开发人员** 导出为 Markdown（可折叠的原始跟踪信息、结构化的错误列表）。

### 生成报告命令

`Ctrl+Shift+P` → **Registry Stats: Generate Report** 会引导您完成以下步骤：
1. 选择受众（管理层 / LLM / 开发人员）。
2. 选择输出（复制 / 保存 / 在编辑器中预览）。

## 命令

| 命令 | 描述 |
|---------|-------------|
| **Registry Stats: Generate Report** | 引导式报告生成（受众 → 输出） |
| **Registry Stats: Refresh Stats** | 清除缓存并重新获取所有数据 |
| **Registry Stats: Open Sidebar** | 聚焦侧边栏面板 |
| **Registry Stats: Copy Executive Summary** | 快速复制管理层报告 |
| **Registry Stats: Copy LLM Log (JSONL)** | 快速复制 LLM 报告 |
| **Registry Stats: Copy Dev Log (Markdown)** | 快速复制开发人员报告 |

## 支持的注册中心

| 注册中心 | 可用数据 | 是否需要身份验证 |
|----------|---------------|-------------|
| **npm** | 每日、每周、每月的下载量 | No |
| **PyPI** | 每日、每周、每月的下载量 | No |
| **NuGet** | 总下载量 | No |
| **VS Code Marketplace** | 总安装量、评分 | No |
| **Docker Hub** | 总拉取次数 | 可选（可能会超出速率限制） |

## 清单检测

该扩展程序会自动检测您工作区的包：

| 清单 | 注册中心 | 扫描的内容 |
|----------|----------|----------------|
| `package.json` | npm | `dependencies`、`devDependencies`。 如果它具有 `publisher` + `engines.vscode`，则会检测为 VS Code 扩展。 |
| `pyproject.toml` | PyPI | `[project].dependencies`, `[tool.poetry.dependencies]` |
| `*.csproj` | NuGet | `<PackageReference>` 元素 |

## 设置

| 设置项 | 默认值 | 描述 |
|---------|---------|-------------|
| `registryStats.enabledRegistries` | 全部五个 | 要查询的注册表 |
| `registryStats.cacheTtlHours` | `{ npm: 6, pypi: 6, nuget: 12, vscode: 12, docker: 24 }` | 每个注册表的缓存过期时间 (TTL) |
| `registryStats.statusBar.enabled` | `true` | 显示状态栏项目 |
| `registryStats.hover.enabled` | `true` | 鼠标悬停时显示依赖项统计信息 |
| `registryStats.devLogging.enabled` | `false` | 在报告中包含详细的跟踪信息 |
| `registryStats.devLogging.level` | `info` | 跟踪详细程度（`info` 或 `debug`） |
| `registryStats.dockerToken` | `""` | Docker Hub 令牌，用于提高速率限制 |
| `registryStats.maxConcurrentRequests` | `3` | 最大并行注册表请求数 |

## 缓存

统计信息缓存在 VS Code 的 `globalState` 中（重启后仍然有效）。每个注册表都有自己的 TTL。该扩展使用 **staleness-while-revalidate**：如果存在缓存数据但已过期，则立即返回该数据，同时在后台进行刷新。这可以保持 UI 的快速响应。

## 报告格式的详细信息

### 管理报告 (PDF)

使用 [pdfmake](https://pdfmake.github.io/docs/) 生成的单页报告（纯 JavaScript，无需 Chromium）。包含：

- KPI 指标卡：总包数、覆盖的注册表数、数据新鲜度、失败次数
- 按每周下载量排序的前 15 个包
- 注册表分解表
- 风险和建议

### LLM (JSONL)

基于模式的版本 JSON Lines 输出。每一行是一个独立的 JSON 对象：

```
{"type":"header","schema_version":"1.0","run_id":"...","workspace":{...}}
{"type":"package","registry":"npm","name":"express","downloads":{...},"freshness_hours":0.5}
{"type":"package","registry":"pypi","name":"flask","error":{"code":"FETCH_FAILED","retryable":true}}
{"type":"summary","total":48,"succeeded":45,"failed":3,"duration_ms":2100}
{"type":"trace","level":"info","component":"fetcher","event":"fetch.complete","duration_ms":1800}
```

每个统计信息都包含 `freshness_hours` 和 `source_registry`，以便 LLM 可以评估数据质量。

### 开发报告 (Markdown)

结构化的 Markdown，带有可折叠的部分：

- **运行摘要** — 成功/失败/过期次数，总持续时间
- **注册表分解** — 每个注册表的表格
- **清单扫描** — 哪些文件贡献了哪些包
- **每个包的结果** — 完整的统计信息表
- **错误** — 结构化的错误详细信息，带有重试提示
- **跟踪** — 原始事件日志，位于可折叠的 `<details>` 块中

## 威胁模型

**访问的数据：** 从公共注册表 API 获取的包名称和下载计数。读取清单文件 (`package.json`, `pyproject.toml`, `*.csproj`) 以检测依赖项——不进行任何文件写入。

**未访问的数据：** 源代码内容、凭据、环境变量、git 历史记录、终端输出。

**网络：** 只读请求发送到公共 API（npm、PyPI、NuGet、VS Code Marketplace、Docker Hub）。不发送任何数据到服务器。可选的 Docker Hub 令牌存储在 VS Code 的设置中。

**无遥测。** 没有分析。没有跟踪。

## 安全评估

使用 [@mcptoolshop/shipcheck](https://github.com/mcp-tool-shop-org/shipcheck) 进行评估。

| 网关 | 状态 | 备注 |
|------|--------|-------|
| **A. Security** | 通过 | SECURITY.md、威胁模型、无遥测、无敏感信息 |
| **B. Error Handling** | 通过 | 结构化的错误格式 (`code`/`message`/`hint`/`retryable`），VS Code 通知 API |
| **C. Operator Docs** | 通过 | 完整的 README、CHANGELOG、LICENSE |
| **D. Shipping Hygiene** | 通过 | `verify` 脚本、lockfile、`engines.node`、干净的 VSIX |
| **E. Identity** | 通过 | Logo、翻译、着陆页、仓库元数据 |

## 构建于

- [@mcptoolshop/registry-stats](https://github.com/mcp-tool-shop-org/registry-stats) — 核心统计引擎（无任何依赖）
- [pdfmake](https://pdfmake.github.io/docs/) — PDF 生成（纯 JS，无原生依赖）

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建
