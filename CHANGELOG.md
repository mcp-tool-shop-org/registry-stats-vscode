# Changelog

## 1.1.0

- **CodeLens** — inline download stats above every dependency in `package.json`
  - Shows weekly downloads, registry, and data freshness per package
  - Click any lens for quick actions: Refresh, Copy LLM JSON, Copy Dev Markdown
  - Hard cap per file (`maxPerFile`, default 50) prevents lag on large manifests
  - Deduplicates packages across dependency sections
  - Session cache eliminates flicker on re-render
  - Off by default — enable via `registryStats.codeLens.enabled`
  - Optional auto-refresh on file save (`registryStats.codeLens.refreshOnSave`)
- New command: **Registry Stats: Refresh CodeLens**
- 5 new settings under `registryStats.codeLens.*`

## 1.0.0

- Initial release
- Status bar showing primary package download stats
- Hover provider for dependencies in package.json, pyproject.toml, .csproj
- Sidebar with audience switcher (Executive / LLM / Dev)
- Three report formats:
  - **Executive (PDF)** — one-page summary via pdfmake
  - **LLM (JSONL)** — machine-friendly with provenance and schema versioning
  - **Dev (Markdown)** — debuggable with collapsible trace
- Generate Report command with quick-pick workflow
- Copy commands for each report type
- Persistent cache in VS Code globalState with per-registry TTL
- Stale-while-revalidate caching strategy
- Configurable registries, TTL, concurrency, Docker token
