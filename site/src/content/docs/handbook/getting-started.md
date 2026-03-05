---
title: Getting Started
description: Install the extension, open a project, and see your first download stats.
sidebar:
  order: 1
---

This page walks you through installing Registry Stats, opening a project, and viewing download statistics for your dependencies.

## Prerequisites

- **VS Code** 1.80 or later
- A project with at least one package manifest (`package.json`, `pyproject.toml`, or `*.csproj`)

No API keys are required for npm, PyPI, NuGet, or VS Code Marketplace. Docker Hub requires authentication only for private images.

## Installation

### From the Marketplace

Search for "Registry Stats" in the VS Code Extensions panel, or install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode).

### From source

```bash
git clone https://github.com/mcp-tool-shop-org/registry-stats-vscode.git
cd registry-stats-vscode
npm ci
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host.

## Viewing stats

### Status bar

Once installed, your primary package's weekly download count appears automatically in the VS Code status bar. Hover for a tooltip with daily, weekly, monthly, and all-time breakdowns. Click to open the sidebar.

### Hover on dependencies

Open any `package.json`, `pyproject.toml`, or `*.csproj` file. Hover over a dependency name to see its download stats in a tooltip table.

### Sidebar panel

Click the **Registry Stats** icon in the activity bar to open the sidebar. From here you can:

1. **Switch audience** — Executive, LLM, or Dev report views
2. **Refresh** — fetch fresh data from all registries
3. **Copy** — copy the current report to clipboard
4. **Export** — save to a file (PDF for Executive, JSONL for LLM, Markdown for Dev)

## Generating a report

1. Open the Command Palette (`Ctrl+Shift+P`)
2. Run **Registry Stats: Generate Report**
3. Pick an audience (Executive / LLM / Dev)
4. Pick an output (Copy / Save / Preview in editor)

## Next steps

See [Reference](/registry-stats-vscode/handbook/reference/) for the full command list, supported registries, report format details, and all settings.
