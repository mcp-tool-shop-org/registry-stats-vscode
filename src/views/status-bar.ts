import * as vscode from "vscode";
import type { StatsService } from "../stats-service.js";
import type { WorkspaceScanner } from "../scanner.js";
import { formatDownloads, formatDownloadsLong, timeAgo } from "../util.js";
import { getConfig } from "../config.js";

export class StatusBarController implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private service: StatsService,
    private scanner: WorkspaceScanner,
  ) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = "registryStats.openSidebar";
    this.item.text = "$(package) Registry Stats";
    this.item.tooltip = "Loading...";

    if (getConfig().statusBarEnabled) {
      this.item.show();
    }

    // Re-scan + refresh on workspace change
    this.disposables.push(
      vscode.workspace.onDidChangeWorkspaceFolders(() => this.refresh()),
    );

    // Initial refresh
    this.refresh();
  }

  async refresh(): Promise<void> {
    const config = getConfig();
    if (!config.statusBarEnabled) {
      this.item.hide();
      return;
    }

    await this.scanner.scan();
    const refs = this.scanner.refs;

    if (refs.length === 0) {
      this.item.text = "$(package) No packages";
      this.item.tooltip = "No package manifests detected in this workspace.";
      return;
    }

    // Count unique deps (exclude primary)
    const deps = refs.filter((r) => !r.isPrimary);
    const uniqueDeps = new Set(deps.map((r) => `${r.registry}:${r.name}`)).size;

    // Fetch primary package stats
    const primary = this.scanner.primary;
    if (primary) {
      const stat = await this.service.getStats(primary);
      if (stat) {
        const weekly = stat.downloads.lastWeek;
        const monthly = stat.downloads.lastMonth;
        const display = weekly != null ? `${formatDownloads(weekly)}/wk` : monthly != null ? `${formatDownloads(monthly)}/mo` : "—";
        this.item.text = `$(package) ${display}`;

        const tooltip = new vscode.MarkdownString();
        tooltip.appendMarkdown(`**${primary.name}** (${primary.registry})\n\n`);
        if (stat.downloads.lastDay != null) tooltip.appendMarkdown(`Daily: ${formatDownloadsLong(stat.downloads.lastDay)}\n\n`);
        if (stat.downloads.lastWeek != null) tooltip.appendMarkdown(`Weekly: ${formatDownloadsLong(stat.downloads.lastWeek)}\n\n`);
        if (stat.downloads.lastMonth != null) tooltip.appendMarkdown(`Monthly: ${formatDownloadsLong(stat.downloads.lastMonth)}\n\n`);
        if (stat.downloads.total != null) tooltip.appendMarkdown(`Total: ${formatDownloadsLong(stat.downloads.total)}\n\n`);
        tooltip.appendMarkdown(`---\n\n`);
        tooltip.appendMarkdown(`${uniqueDeps} dependencies tracked \u2022 Last updated: ${timeAgo(stat.fetchedAt)}`);
        this.item.tooltip = tooltip;
      } else {
        this.item.text = `$(package) ${uniqueDeps} deps`;
        this.item.tooltip = `${uniqueDeps} dependencies detected. Stats unavailable.`;
      }
    } else {
      this.item.text = `$(package) ${uniqueDeps} deps`;
      this.item.tooltip = `${uniqueDeps} dependencies detected.`;
    }
  }

  dispose(): void {
    this.item.dispose();
    for (const d of this.disposables) d.dispose();
  }
}
