# Changelog

## 1.3.0

- **My Packages (Portfolio Mode)** — cross-registry portfolio dashboard for package maintainers
  - Define packages via `registry-stats.portfolio.json` (JSONC) at workspace root
  - Or configure via VS Code settings: `registryStats.myPackages.manual` + identity arrays
  - Identity discovery: auto-discovers all packages for npm usernames, VS Code publishers, and Docker namespaces
  - File + settings merge with deduplication (file wins on conflicts)
  - New sidebar scope dropdown: All Dependencies / Current Package / My Packages
  - Portfolio table with sortable columns: Package, Registry, Weekly, Trend, Freshness, Status
  - Aggregate header showing total weekly downloads, package count, and freshness %
  - Empty state with "Create Portfolio File" and "Open Settings" buttons
  - Scope metadata in all report formats (Dev Markdown, LLM JSONL, Executive PDF)
  - Portfolio-aware subtitle in Executive reports
  - File watcher auto-refreshes when portfolio file changes
  - 5 supported registries: npm, PyPI, NuGet, VS Code Marketplace, Docker Hub
  - 14 new tests (66 total)

## 1.2.0

- **Intelligence Layer** — structured insights and signals in Executive reports
  - Concentration signal: flags when top 3 packages hold 65%+ of weekly downloads
  - Momentum signal: detects packages accelerating or declining via week-vs-month velocity proxy
  - Registry exposure signal: warns when 80%+ of downloads come from a single registry
  - Opportunity signal: surfaces mid-tier packages with 15%+ acceleration
  - All signals are confidence-gated (≥ 0.7), deterministic, and numerically justified
  - New "Insights & Signals" section in Executive PDF and sidebar preview
  - New "Methodology" block at bottom of Executive PDF
  - 18 new tests (52 total)

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
