---
title: Reference
description: Commands, registries, report formats, settings, and export options.
sidebar:
  order: 2
---

## Commands

| Command | Description |
|---------|-------------|
| `Registry Stats: Generate Report` | Guided report generation (audience then output) |
| `Registry Stats: Refresh Stats` | Clear cache and re-fetch all data |
| `Registry Stats: Open Sidebar` | Focus the sidebar panel |
| `Registry Stats: Copy Executive Summary` | Quick-copy executive report |
| `Registry Stats: Copy LLM Log (JSONL)` | Quick-copy LLM report |
| `Registry Stats: Copy Dev Log (Markdown)` | Quick-copy dev report |

## Supported registries

| Registry | Data available | Auth needed |
|----------|---------------|-------------|
| **npm** | Daily, weekly, monthly downloads | No |
| **PyPI** | Daily, weekly, monthly, all-time | No |
| **NuGet** | All-time total | No |
| **VS Code Marketplace** | All-time installs | No |
| **Docker Hub** | All-time pulls | Only for private images |

### Registry-specific notes

- **npm** has rate limits — bulk queries may receive HTTP 429 responses. The extension spaces out requests automatically.
- **VS Code Marketplace** and **NuGet** only report all-time totals, not weekly or monthly breakdowns.
- **Docker Hub** (GHCR) does not expose public pull counts.

## Report formats

### Executive (PDF)

One-page report with KPIs, top packages by downloads, and risk indicators (declining trends, unmaintained dependencies). Generated with pdfmake — no browser engine required, works everywhere.

### LLM (JSONL)

Schema-versioned, provenance-tagged, streaming-friendly format. One JSON object per line. Includes freshness metadata and error details. Designed for feeding into AI tools and automated pipelines.

### Dev (Markdown)

Structured per-package table with collapsible raw trace and error listing. Designed for pasting into GitHub issues, PRs, or internal documentation.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `registryStats.autoRefresh` | `true` | Auto-fetch stats when workspace opens |
| `registryStats.cacheTtlMinutes` | `60` | Cache duration before re-fetching |
| `registryStats.statusBarPackage` | Auto-detect | Package to show in status bar |
| `registryStats.dockerAuth` | — | Docker Hub authentication token (for private images) |

## Data flow

1. Extension scans workspace for package manifests
2. Extracts dependency names and versions
3. Queries each registry's public API (no auth for npm/PyPI/NuGet/VS Code)
4. Caches results locally for the configured TTL
5. Displays in status bar, hover tooltips, and sidebar

## Security and data scope

- **Read-only** — the extension only reads package manifests and fetches public API data
- **No workspace modifications** — no files are written except exported reports (user-initiated)
- **No telemetry** collected or sent
- Network access is limited to registry APIs (registry.npmjs.org, pypi.org, api.nuget.org, marketplace.visualstudio.com, hub.docker.com)
