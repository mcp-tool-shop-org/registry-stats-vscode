import * as vscode from "vscode";
import type { PackageStats } from "@mcptoolshop/registry-stats";
import type { StatsService } from "./stats-service.js";
import type { PkgRef } from "./scanner.js";
import { getConfig, type CodeLensConfig } from "./config.js";
import { formatDownloads, timeAgo, log } from "./util.js";

// ── Types ───────────────────────────────────────────────────────────

interface DepEntry {
  name: string;
  version: string;
  range: vscode.Range;
}

interface LensData {
  ref: PkgRef;
  stat: PackageStats | null;
}

// ── Provider ────────────────────────────────────────────────────────

export class StatsCodeLensProvider implements vscode.CodeLensProvider, vscode.Disposable {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private sessionCache = new Map<string, PackageStats | null>();
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(private service: StatsService) {
    // Refresh lenses when config changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("registryStats.codeLens") || e.affectsConfiguration("editor.codeLens")) {
          this._onDidChangeCodeLenses.fire();
        }
      }),
    );
  }

  /** Call to force a refresh of all lenses. */
  refresh(): void {
    this.sessionCache.clear();
    this._onDidChangeCodeLenses.fire();
  }

  /** Debounced refresh for file-save events. */
  debouncedRefresh(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this._onDidChangeCodeLenses.fire(), 400);
  }

  async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
    const config = getConfig();
    if (!config.codeLens.enabled) return [];

    // Respect VS Code global setting
    const globalLens = vscode.workspace.getConfiguration("editor").get<boolean>("codeLens", true);
    if (!globalLens) return [];

    // Only package.json for now
    const fileName = document.fileName.split(/[/\\]/).pop() ?? "";
    if (fileName !== "package.json") return [];

    const deps = parsePackageJsonDeps(document);
    if (deps.length === 0) return [];

    // Hard cap
    const max = config.codeLens.maxPerFile;
    if (deps.length > max) {
      // Single lens at top explaining the cap
      return [
        new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
          title: `$(warning) ${deps.length} deps exceed CodeLens cap (${max}) — increase registryStats.codeLens.maxPerFile`,
          command: "",
        }),
      ];
    }

    // Build PkgRefs
    const refs: { dep: DepEntry; ref: PkgRef }[] = deps.map((dep) => ({
      dep,
      ref: {
        registry: "npm" as const,
        name: dep.name,
        version: dep.version,
        file: document.uri,
        range: dep.range,
      },
    }));

    // Fetch stats (cache-first, non-blocking)
    const lenses: vscode.CodeLens[] = [];
    for (const { dep, ref } of refs) {
      const cacheKey = `npm:${dep.name}`;
      let stat = this.sessionCache.get(cacheKey);

      if (stat === undefined) {
        // Not in session cache — try service (which has globalState cache)
        // Don't await here to keep provideCodeLenses fast — fire and update
        const cached = await this.service.getStats(ref);
        stat = cached;
        this.sessionCache.set(cacheKey, stat);
      }

      const title = formatLensTitle(stat, config.codeLens);
      lenses.push(
        new vscode.CodeLens(dep.range, {
          title,
          command: "registryStats.codeLensClick",
          arguments: [ref, stat],
        }),
      );
    }

    return lenses;
  }

  dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this._onDidChangeCodeLenses.dispose();
    for (const d of this.disposables) d.dispose();
  }
}

// ── Click handler ───────────────────────────────────────────────────

export async function handleCodeLensClick(
  service: StatsService,
  ref: PkgRef,
  stat: PackageStats | null,
): Promise<void> {
  const items: (vscode.QuickPickItem & { action: string })[] = [
    { label: "$(refresh) Refresh this package", description: "Force re-fetch from registry", action: "refresh" },
    { label: "$(json) Copy LLM JSON", description: "Single package record as JSON", action: "copyJson" },
    { label: "$(markdown) Copy Dev Markdown", description: "Single package as Markdown snippet", action: "copyMd" },
  ];

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: `${ref.name} (${ref.registry})`,
  });
  if (!pick) return;

  switch (pick.action) {
    case "refresh": {
      const fresh = await service.getStats(ref, { force: true });
      if (fresh) {
        vscode.window.showInformationMessage(
          `${ref.name}: ${formatDownloads(fresh.downloads.lastWeek)}/wk`,
        );
      }
      break;
    }
    case "copyJson": {
      const record = {
        registry: ref.registry,
        name: ref.name,
        downloads: stat?.downloads ?? null,
        fetchedAt: stat?.fetchedAt ?? null,
        extra: stat?.extra ?? null,
      };
      await vscode.env.clipboard.writeText(JSON.stringify(record, null, 2));
      vscode.window.showInformationMessage(`${ref.name} JSON copied to clipboard.`);
      break;
    }
    case "copyMd": {
      const d = stat?.downloads;
      const lines = [
        `**${ref.name}** (${ref.registry})`,
        "",
        "| Period | Downloads |",
        "|--------|----------:|",
      ];
      if (d?.lastDay != null) lines.push(`| Daily | ${d.lastDay.toLocaleString()} |`);
      if (d?.lastWeek != null) lines.push(`| Weekly | ${d.lastWeek.toLocaleString()} |`);
      if (d?.lastMonth != null) lines.push(`| Monthly | ${d.lastMonth.toLocaleString()} |`);
      if (d?.total != null) lines.push(`| Total | ${d.total.toLocaleString()} |`);
      if (stat) lines.push("", `*Fetched ${timeAgo(stat.fetchedAt)}*`);
      await vscode.env.clipboard.writeText(lines.join("\n"));
      vscode.window.showInformationMessage(`${ref.name} Markdown copied to clipboard.`);
      break;
    }
  }
}

// ── Lens title formatting ───────────────────────────────────────────

function formatLensTitle(stat: PackageStats | null, config: CodeLensConfig): string {
  if (!stat) return "$(circle-slash) Unavailable";

  const parts: string[] = [];

  // Downloads
  const weekly = stat.downloads.lastWeek;
  const monthly = stat.downloads.lastMonth;
  if (weekly != null) {
    parts.push(`${formatDownloads(weekly)}/wk`);
  } else if (monthly != null) {
    parts.push(`${formatDownloads(monthly)}/mo`);
  } else if (stat.downloads.total != null) {
    parts.push(`${formatDownloads(stat.downloads.total)} total`);
  } else {
    parts.push("—");
  }

  // Registry
  parts.push(stat.registry);

  // Freshness
  if (config.showFreshness) {
    parts.push(timeAgo(stat.fetchedAt));
  }

  return parts.join(" \u2022 ");
}

// ── package.json parser ─────────────────────────────────────────────

function parsePackageJsonDeps(document: vscode.TextDocument): DepEntry[] {
  const text = document.getText();
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(text);
  } catch {
    return [];
  }

  const lines = text.split("\n");
  const entries: DepEntry[] = [];
  const seen = new Set<string>();

  for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const) {
    const deps = pkg[section];
    if (!deps || typeof deps !== "object") continue;

    for (const [name, ver] of Object.entries(deps as Record<string, string>)) {
      if (seen.has(name)) continue;
      seen.add(name);

      // Find precise line for this dep key
      const lineIdx = findDepLine(lines, name, section);
      if (lineIdx < 0) continue;

      entries.push({
        name,
        version: typeof ver === "string" ? ver : "",
        range: new vscode.Range(lineIdx, 0, lineIdx, lines[lineIdx].length),
      });
    }
  }

  return entries;
}

/**
 * Find the line index of a dependency key within its section.
 * Scopes search to lines between the section key and the next closing brace
 * to avoid false matches across sections.
 */
function findDepLine(lines: string[], depName: string, section: string): number {
  const sectionPattern = `"${section}"`;
  const depPattern = `"${depName}"`;

  let inSection = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inSection) {
      if (line.includes(sectionPattern)) inSection = true;
      continue;
    }
    // Inside the section — look for the dep
    if (line.includes(depPattern)) return i;
    // Section ended (closing brace at same or less indentation)
    if (line.trimStart().startsWith("}")) break;
  }

  return -1;
}
