import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Registry Stats',
  description: 'Multi-registry download stats for VS Code — Executive PDF, LLM JSONL, and Dev Markdown reports',
  logoBadge: 'RS',
  brandName: 'registry-stats-vscode',
  repoUrl: 'https://github.com/mcp-tool-shop-org/registry-stats-vscode',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'VS Code Extension',
    headline: 'Download Stats',
    headlineAccent: 'in your editor.',
    description: 'See npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub download stats for every dependency — right where you code.',
    primaryCta: { href: 'https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode', label: 'Install from Marketplace' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Status Bar', code: '$(package) 67.4M/wk' },
      { label: 'Hover', code: 'express — npm\nWeekly:  67,367,773\nMonthly: 283,472,710' },
      { label: 'Report', code: 'Ctrl+Shift+P → Registry Stats: Generate Report\n→ Executive (PDF) / LLM (JSONL) / Dev (Markdown)' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Three audiences, three formats, one extension.',
      features: [
        { title: 'Executive PDF', desc: 'One-page report with KPIs, top packages, and risk recommendations. Share with stakeholders.' },
        { title: 'LLM JSONL', desc: 'Schema-versioned, provenance-tagged output. Every stat includes freshness and confidence.' },
        { title: 'Dev Markdown', desc: 'Collapsible trace, error details, per-package tables. Paste into issues or PRs.' },
        { title: 'Status Bar', desc: 'Primary package download count at a glance. Hover for the full breakdown.' },
        { title: 'Hover on Deps', desc: 'Hover over any dependency in package.json, pyproject.toml, or .csproj for live stats.' },
        { title: 'Smart Caching', desc: 'Stale-while-revalidate with per-registry TTL. Persists across restarts.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'registries',
      title: 'Supported Registries',
      subtitle: 'Five registries, no API keys required (Docker Hub token optional).',
      columns: ['Registry', 'Data', 'Auth'],
      rows: [
        ['npm', 'Daily, weekly, monthly', 'None'],
        ['PyPI', 'Daily, weekly, monthly, all-time', 'None'],
        ['NuGet', 'All-time total', 'None'],
        ['VS Code Marketplace', 'All-time installs, ratings', 'None'],
        ['Docker Hub', 'All-time pulls', 'Optional token'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Quick Start',
      cards: [
        { title: 'Install', code: 'ext install mcp-tool-shop.registry-stats-vscode' },
        { title: 'Generate a report', code: 'Ctrl+Shift+P → Registry Stats: Generate Report\n\n1. Pick audience: Executive / LLM / Dev\n2. Pick output: Copy / Save / Preview' },
      ],
    },
  ],
};
