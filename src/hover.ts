import * as vscode from "vscode";
import type { StatsService } from "./stats-service.js";
import type { WorkspaceScanner } from "./scanner.js";
import { formatDownloadsLong, timeAgo } from "./util.js";
import { getConfig } from "./config.js";

export function registerHoverProviders(
  scanner: WorkspaceScanner,
  service: StatsService,
): vscode.Disposable[] {
  const provider = new StatsHoverProvider(scanner, service);

  return [
    vscode.languages.registerHoverProvider(
      { language: "json", pattern: "**/package.json" },
      provider,
    ),
    vscode.languages.registerHoverProvider(
      { language: "toml", pattern: "**/pyproject.toml" },
      provider,
    ),
    vscode.languages.registerHoverProvider(
      { language: "xml", pattern: "**/*.csproj" },
      provider,
    ),
  ];
}

class StatsHoverProvider implements vscode.HoverProvider {
  constructor(
    private scanner: WorkspaceScanner,
    private service: StatsService,
  ) {}

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | null> {
    if (!getConfig().hoverEnabled) return null;

    // Find a PkgRef whose range contains this position
    const ref = this.scanner.refs.find(
      (r) =>
        r.file.toString() === document.uri.toString() &&
        r.range?.contains(position),
    );
    if (!ref) return null;

    const stat = await this.service.getStats(ref);
    if (!stat) return null;

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${ref.name}** \u2014 ${ref.registry}\n\n`);

    const d = stat.downloads;
    md.appendMarkdown(`| Period | Downloads |\n`);
    md.appendMarkdown(`|--------|----------:|\n`);
    if (d.lastDay != null) md.appendMarkdown(`| Daily | ${formatDownloadsLong(d.lastDay)} |\n`);
    if (d.lastWeek != null) md.appendMarkdown(`| Weekly | ${formatDownloadsLong(d.lastWeek)} |\n`);
    if (d.lastMonth != null) md.appendMarkdown(`| Monthly | ${formatDownloadsLong(d.lastMonth)} |\n`);
    if (d.total != null) md.appendMarkdown(`| Total | ${formatDownloadsLong(d.total)} |\n`);

    md.appendMarkdown(`\n*Cached ${timeAgo(stat.fetchedAt)}*`);
    md.isTrusted = true;

    return new vscode.Hover(md, ref.range);
  }
}
