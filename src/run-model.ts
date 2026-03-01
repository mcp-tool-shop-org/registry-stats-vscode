import type { RegistryName, PackageStats } from "@mcptoolshop/registry-stats";
import type { PkgRef } from "./scanner.js";
import type { StatsService } from "./stats-service.js";
import type { PortfolioResult } from "./portfolio.js";
import { WorkspaceScanner } from "./scanner.js";
import { log, classifyError } from "./util.js";
import { randomUUID } from "crypto";
import * as vscode from "vscode";

// ── Types ───────────────────────────────────────────────────────────

export type RunScope = "all" | "primary" | "portfolio";

export interface RunScopeInfo {
  type: RunScope;
  portfolioSource?: "file" | "settings" | "merged";
  identityPackages?: number;
}

export interface Run {
  schemaVersion: "1.0";
  runId: string;
  startedAt: string;
  completedAt: string;
  workspace: { name: string; rootUri: string };
  scope: RunScopeInfo;
  packages: PkgResult[];
  trace: TraceEntry[];
  summary: RunSummary;
}

export interface PkgResult {
  registry: RegistryName;
  name: string;
  manifest: { file: string; line?: number };
  stats?: PackageStats;
  freshnessHours?: number;
  error?: { code: string; message: string; retryable: boolean };
}

export interface TraceEntry {
  time: string;
  level: "debug" | "info" | "warn" | "error";
  component: "scanner" | "cache" | "fetcher" | "reporter" | "portfolio";
  event: string;
  data?: Record<string, unknown>;
  durationMs?: number;
}

export interface RunSummary {
  total: number;
  succeeded: number;
  failed: number;
  stale: number;
  durationMs: number;
  registries: Record<string, { total: number; ok: number; failed: number }>;
}

// ── Builder ─────────────────────────────────────────────────────────

export async function buildRun(
  scanner: WorkspaceScanner,
  service: StatsService,
  scope: RunScope = "all",
  portfolioResult?: PortfolioResult,
): Promise<Run> {
  const start = Date.now();
  const trace: TraceEntry[] = [];
  const addTrace = (
    level: TraceEntry["level"],
    component: TraceEntry["component"],
    event: string,
    data?: Record<string, unknown>,
  ) => {
    trace.push({ time: new Date().toISOString(), level, component, event, data });
  };

  let refs: readonly PkgRef[];
  let scopeInfo: RunScopeInfo;

  if (scope === "portfolio" && portfolioResult) {
    // Portfolio mode — skip scanner, use portfolio refs
    addTrace("info", "portfolio", "portfolio.load", {
      source: portfolioResult.source,
      packages: portfolioResult.refs.length,
      identityPackages: portfolioResult.identityPackages,
      errors: portfolioResult.errors.length,
    });
    refs = portfolioResult.refs;
    scopeInfo = {
      type: "portfolio",
      portfolioSource: portfolioResult.source,
      identityPackages: portfolioResult.identityPackages,
    };
  } else {
    // Scanner mode — existing behavior
    addTrace("info", "scanner", "scan.start");
    const scanStart = Date.now();
    await scanner.scan();
    addTrace("info", "scanner", "scan.complete", {
      count: scanner.refs.length,
      durationMs: Date.now() - scanStart,
    });

    if (scope === "primary" && scanner.primary) {
      refs = [scanner.primary];
    } else {
      const seen = new Set<string>();
      refs = scanner.refs.filter((r) => {
        const key = `${r.registry}:${r.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    scopeInfo = { type: scope === "primary" ? "primary" : "all" };
  }

  // 3. Fetch stats
  addTrace("info", "fetcher", "fetch.start", { count: refs.length });
  const fetchStart = Date.now();

  const results: PkgResult[] = [];
  const statsMap = await service.getBulk([...refs]);
  const fetchDuration = Date.now() - fetchStart;
  addTrace("info", "fetcher", "fetch.complete", { durationMs: fetchDuration });

  // 4. Build PkgResults
  for (const ref of refs) {
    const key = `stats:${ref.registry}:${ref.name}`;
    const stat = statsMap.get(key);
    const result: PkgResult = {
      registry: ref.registry,
      name: ref.name,
      manifest: {
        file: ref.file.toString(),
        line: ref.range?.start.line,
      },
    };

    if (stat) {
      result.stats = stat;
      const ageMs = Date.now() - new Date(stat.fetchedAt).getTime();
      result.freshnessHours = Math.round((ageMs / 3_600_000) * 10) / 10;
    } else {
      result.error = {
        code: "FETCH_FAILED",
        message: `No data returned for ${ref.registry}/${ref.name}`,
        retryable: true,
      };
    }

    results.push(result);
  }

  // 5. Build summary
  const registrySummary: Record<string, { total: number; ok: number; failed: number }> = {};
  for (const r of results) {
    const entry = registrySummary[r.registry] ?? { total: 0, ok: 0, failed: 0 };
    entry.total++;
    if (r.stats) entry.ok++;
    else entry.failed++;
    registrySummary[r.registry] = entry;
  }

  const succeeded = results.filter((r) => r.stats).length;
  const failed = results.filter((r) => r.error).length;
  const stale = results.filter((r) => r.freshnessHours && r.freshnessHours > 24).length;

  const summary: RunSummary = {
    total: results.length,
    succeeded,
    failed,
    stale,
    durationMs: Date.now() - start,
    registries: registrySummary,
  };

  const workspace = vscode.workspace.workspaceFolders?.[0];

  return {
    schemaVersion: "1.0",
    runId: randomUUID(),
    startedAt: new Date(start).toISOString(),
    completedAt: new Date().toISOString(),
    workspace: {
      name: workspace?.name ?? "unknown",
      rootUri: workspace?.uri.toString() ?? "",
    },
    scope: scopeInfo,
    packages: results,
    trace,
    summary,
  };
}
