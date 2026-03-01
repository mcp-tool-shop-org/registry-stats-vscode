import type { Run } from "../run-model.js";
import { formatDownloadsLong, timeAgo } from "../util.js";

export function renderDevMarkdown(run: Run): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Registry Stats — Dev Report`);
  lines.push("");
  lines.push(`**Workspace:** ${run.workspace.name}`);
  lines.push(`**Run ID:** \`${run.runId}\``);
  lines.push(`**Started:** ${run.startedAt}`);
  lines.push(`**Duration:** ${run.summary.durationMs}ms`);
  lines.push("");

  // Summary
  lines.push(`## Run Summary`);
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total packages | ${run.summary.total} |`);
  lines.push(`| Succeeded | ${run.summary.succeeded} |`);
  lines.push(`| Failed | ${run.summary.failed} |`);
  lines.push(`| Stale (>24h) | ${run.summary.stale} |`);
  lines.push(`| Duration | ${run.summary.durationMs}ms |`);
  lines.push("");

  // Per-registry breakdown
  lines.push(`## Registry Breakdown`);
  lines.push("");
  lines.push(`| Registry | Total | OK | Failed |`);
  lines.push(`|----------|-------|----|--------|`);
  for (const [reg, s] of Object.entries(run.summary.registries)) {
    lines.push(`| ${reg} | ${s.total} | ${s.ok} | ${s.failed} |`);
  }
  lines.push("");

  // Manifest scan
  lines.push(`## Manifest Scan`);
  lines.push("");
  const manifests = new Set(run.packages.map((p) => p.manifest.file));
  for (const file of manifests) {
    const pkgs = run.packages.filter((p) => p.manifest.file === file);
    lines.push(`- \`${file}\` — ${pkgs.length} package(s)`);
  }
  lines.push("");

  // Per-package results
  lines.push(`## Per-Package Results`);
  lines.push("");
  lines.push(`| Registry | Package | Weekly | Monthly | Total | Freshness |`);
  lines.push(`|----------|---------|--------|---------|-------|-----------|`);
  for (const pkg of run.packages) {
    if (pkg.stats) {
      const d = pkg.stats.downloads;
      lines.push(
        `| ${pkg.registry} | ${pkg.name} | ${formatDownloadsLong(d.lastWeek)} | ${formatDownloadsLong(d.lastMonth)} | ${formatDownloadsLong(d.total)} | ${pkg.freshnessHours != null ? `${pkg.freshnessHours}h` : "—"} |`,
      );
    } else {
      lines.push(`| ${pkg.registry} | ${pkg.name} | — | — | — | ERROR |`);
    }
  }
  lines.push("");

  // Errors
  const errors = run.packages.filter((p) => p.error);
  if (errors.length > 0) {
    lines.push(`## Errors`);
    lines.push("");
    for (const pkg of errors) {
      lines.push(`- **${pkg.registry}/${pkg.name}**: \`${pkg.error!.code}\` — ${pkg.error!.message}`);
      if (pkg.error!.retryable) lines.push(`  - Retryable: yes`);
    }
    lines.push("");
  }

  // Trace (collapsible)
  if (run.trace.length > 0) {
    lines.push(`## Trace`);
    lines.push("");
    lines.push(`<details>`);
    lines.push(`<summary>Raw trace (${run.trace.length} entries)</summary>`);
    lines.push("");
    lines.push("```");
    for (const t of run.trace) {
      const dur = t.durationMs != null ? ` (${t.durationMs}ms)` : "";
      const data = t.data ? ` ${JSON.stringify(t.data)}` : "";
      lines.push(`[${t.time}] [${t.level}] [${t.component}] ${t.event}${dur}${data}`);
    }
    lines.push("```");
    lines.push("");
    lines.push(`</details>`);
  }

  return lines.join("\n");
}
