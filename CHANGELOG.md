# Changelog

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
