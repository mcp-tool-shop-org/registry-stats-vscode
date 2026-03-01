import type { Run } from "../run-model.js";

/**
 * Renders a Run as JSONL (JSON Lines) — one line per record.
 * Line 1: run metadata header
 * Lines 2..N: one per package result
 * Last line: summary
 */
export function renderLLMJsonl(run: Run): string {
  const lines: string[] = [];

  // Header line
  lines.push(JSON.stringify({
    type: "header",
    schema_version: run.schemaVersion,
    run_id: run.runId,
    started_at: run.startedAt,
    completed_at: run.completedAt,
    workspace: run.workspace,
    scope: run.scope,
  }));

  // One line per package
  for (const pkg of run.packages) {
    const record: Record<string, unknown> = {
      type: "package",
      registry: pkg.registry,
      name: pkg.name,
      manifest: pkg.manifest,
    };

    if (pkg.stats) {
      record.downloads = pkg.stats.downloads;
      record.fetched_at = pkg.stats.fetchedAt;
      record.freshness_hours = pkg.freshnessHours;
      record.source_registry = pkg.stats.registry;
      if (pkg.stats.extra) {
        record.extra = pkg.stats.extra;
      }
    }

    if (pkg.error) {
      record.error = {
        code: pkg.error.code,
        message: pkg.error.message,
        retryable: pkg.error.retryable,
      };
    }

    lines.push(JSON.stringify(record));
  }

  // Summary line
  lines.push(JSON.stringify({
    type: "summary",
    total: run.summary.total,
    succeeded: run.summary.succeeded,
    failed: run.summary.failed,
    stale: run.summary.stale,
    duration_ms: run.summary.durationMs,
    registries: run.summary.registries,
  }));

  // Trace lines (only if dev logging was on)
  for (const t of run.trace) {
    lines.push(JSON.stringify({
      type: "trace",
      time: t.time,
      level: t.level,
      component: t.component,
      event: t.event,
      ...(t.data ? { data: t.data } : {}),
      ...(t.durationMs != null ? { duration_ms: t.durationMs } : {}),
    }));
  }

  return lines.join("\n");
}
