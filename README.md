<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats-vscode/readme.png" width="400" alt="Registry Stats">
</p>

<p><strong>See download stats for every dependency — right inside VS Code. Supports npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.registry-stats-vscode" alt="VS Marketplace"></a>
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## What it does

Registry Stats scans your workspace for package manifests (`package.json`, `pyproject.toml`, `*.csproj`) and pulls live download statistics from five registries. No API keys required for npm, PyPI, NuGet, or VS Code Marketplace.

**Three report formats, three audiences:**

| Audience | Format | Use case |
|----------|--------|----------|
| **Executive** | PDF | Share with stakeholders — one-page KPIs, top packages, risks |
| **LLM** | JSONL | Feed to AI tools — schema-versioned, provenance-tagged, streaming-friendly |
| **Dev** | Markdown | Paste into issues/PRs — collapsible trace, per-package table, error details |

## Getting started

1. Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode)
2. Open a project that has a `package.json`, `pyproject.toml`, or `*.csproj`
3. The status bar shows your primary package's download count automatically
4. Click the **Registry Stats** icon in the activity bar to open the sidebar

## Features

### Status bar

Your primary package's weekly downloads appear in the status bar. Hover for a detailed tooltip with daily, weekly, monthly, and all-time counts. Click to open the sidebar.

### Hover on dependencies

Hover over any dependency name in `package.json`, `pyproject.toml`, or `*.csproj` to see its download stats in a tooltip table.

### Sidebar with audience switcher

The sidebar lets you switch between Executive, LLM, and Dev report views. Hit **Refresh** to fetch fresh data, **Copy** to clipboard, or **Export** to save to file.

- **Executive** exports as PDF (generated with pdfmake — no browser engine, works everywhere)
- **LLM** exports as JSONL (one JSON object per line, includes freshness and error metadata)
- **Dev** exports as Markdown (collapsible raw trace, structured error listing)

### Generate Report command

`Ctrl+Shift+P` → **Registry Stats: Generate Report** walks you through:
1. Pick an audience (Executive / LLM / Dev)
2. Pick an output (Copy / Save / Preview in editor)

## Commands

| Command | Description |
|---------|-------------|
| **Registry Stats: Generate Report** | Guided report generation (audience → output) |
| **Registry Stats: Refresh Stats** | Clear cache and re-fetch all data |
| **Registry Stats: Open Sidebar** | Focus the sidebar panel |
| **Registry Stats: Copy Executive Summary** | Quick-copy executive report |
| **Registry Stats: Copy LLM Log (JSONL)** | Quick-copy LLM report |
| **Registry Stats: Copy Dev Log (Markdown)** | Quick-copy dev report |

## Supported registries

| Registry | Data available | Auth needed |
|----------|---------------|-------------|
| **npm** | Daily, weekly, monthly downloads | No |
| **PyPI** | Daily, weekly, monthly, all-time | No |
| **NuGet** | All-time total | No |
| **VS Code Marketplace** | All-time installs, ratings | No |
| **Docker Hub** | All-time pulls | Optional (raises rate limits) |

## Manifest detection

The extension auto-detects your workspace's packages:

| Manifest | Registry | What's scanned |
|----------|----------|----------------|
| `package.json` | npm | `dependencies`, `devDependencies`. If it has `publisher` + `engines.vscode`, the primary is detected as a VS Code extension. |
| `pyproject.toml` | PyPI | `[project].dependencies`, `[tool.poetry.dependencies]` |
| `*.csproj` | NuGet | `<PackageReference>` elements |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `registryStats.enabledRegistries` | All five | Which registries to query |
| `registryStats.cacheTtlHours` | `{ npm: 6, pypi: 6, nuget: 12, vscode: 12, docker: 24 }` | Cache TTL per registry |
| `registryStats.statusBar.enabled` | `true` | Show status bar item |
| `registryStats.hover.enabled` | `true` | Show stats on hover over dependencies |
| `registryStats.devLogging.enabled` | `false` | Include detailed trace in reports |
| `registryStats.devLogging.level` | `info` | Trace verbosity (`info` or `debug`) |
| `registryStats.dockerToken` | `""` | Docker Hub token to raise rate limits |
| `registryStats.maxConcurrentRequests` | `3` | Max parallel registry requests |

## Caching

Stats are cached in VS Code's `globalState` (persists across restarts). Each registry has its own TTL. The extension uses **stale-while-revalidate**: if cached data exists but is stale, it's returned immediately while a background refresh runs. This keeps the UI fast.

## Report formats in detail

### Executive (PDF)

A one-page report generated with [pdfmake](https://pdfmake.github.io/docs/) (pure JavaScript, no Chromium required). Contains:

- KPI cards: total packages, registries covered, data freshness, failures
- Top 15 packages ranked by weekly downloads
- Registry breakdown table
- Risks and recommendations

### LLM (JSONL)

Schema-versioned JSON Lines output. Each line is a self-contained JSON object:

```
{"type":"header","schema_version":"1.0","run_id":"...","workspace":{...}}
{"type":"package","registry":"npm","name":"express","downloads":{...},"freshness_hours":0.5}
{"type":"package","registry":"pypi","name":"flask","error":{"code":"FETCH_FAILED","retryable":true}}
{"type":"summary","total":48,"succeeded":45,"failed":3,"duration_ms":2100}
{"type":"trace","level":"info","component":"fetcher","event":"fetch.complete","duration_ms":1800}
```

Every stat includes `freshness_hours` and `source_registry` so LLMs can reason about data quality.

### Dev (Markdown)

Structured Markdown with collapsible sections:

- **Run Summary** — success/fail/stale counts, total duration
- **Registry Breakdown** — per-registry table
- **Manifest Scan** — which files contributed which packages
- **Per-Package Results** — full stats table
- **Errors** — structured error details with retry hints
- **Trace** — raw event log in a collapsible `<details>` block

## Threat model

**Data touched:** Package names and download counts from public registry APIs. Manifest files (`package.json`, `pyproject.toml`, `*.csproj`) are read to detect dependencies — no file writes.

**Data NOT touched:** Source code contents, credentials, environment variables, git history, terminal output.

**Network:** Read-only requests to public APIs (npm, PyPI, NuGet, VS Code Marketplace, Docker Hub). No data is sent upstream. The optional Docker Hub token is stored in VS Code settings.

**No telemetry.** No analytics. No tracking.

## Scorecard

Assessed with [@mcptoolshop/shipcheck](https://github.com/mcp-tool-shop-org/shipcheck).

| Gate | Status | Notes |
|------|--------|-------|
| **A. Security** | Pass | SECURITY.md, threat model, no telemetry, no secrets |
| **B. Error Handling** | Pass | Structured error shape (`code`/`message`/`hint`/`retryable`), VS Code notification API |
| **C. Operator Docs** | Pass | Full README, CHANGELOG, LICENSE |
| **D. Shipping Hygiene** | Pass | `verify` script, lockfile, `engines.node`, clean VSIX |
| **E. Identity** | Pass | Logo, translations, landing page, repo metadata |

## Built with

- [@mcptoolshop/registry-stats](https://github.com/mcp-tool-shop-org/registry-stats) — the core stats engine (zero dependencies)
- [pdfmake](https://pdfmake.github.io/docs/) — PDF generation (pure JS, no native deps)

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
