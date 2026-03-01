import * as vscode from "vscode";
import type { WorkspaceScanner } from "../scanner.js";
import type { StatsService } from "../stats-service.js";
import type { RunScope } from "../run-model.js";
import { buildRun } from "../run-model.js";
import { renderDevMarkdown } from "../reporters/dev.js";
import { renderLLMJsonl } from "../reporters/llm.js";
import { renderExecutivePdf } from "../reporters/executive.js";
import { loadPortfolio } from "../portfolio.js";
import { log, friendlyError, formatDownloads } from "../util.js";
import { generateInsights } from "../analysis/index.js";

export type Audience = "executive" | "llm" | "dev";
export type SidebarScope = "dependencies" | "workspace" | "portfolio";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "registryStats.sidebar";

  private view?: vscode.WebviewView;
  private audience: Audience = "dev";
  private scope: SidebarScope = "dependencies";
  private lastReport = "";
  private lastPdf?: Uint8Array;

  constructor(
    private extensionUri: vscode.Uri,
    private scanner: WorkspaceScanner,
    private service: StatsService,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.command) {
        case "setAudience":
          this.audience = msg.audience;
          await this.generateAndShow();
          break;
        case "setScope":
          this.scope = msg.scope;
          await this.generateAndShow();
          break;
        case "refresh":
          this.service.clearCache();
          await this.generateAndShow();
          break;
        case "copy":
          if (this.lastReport) {
            await vscode.env.clipboard.writeText(this.lastReport);
            vscode.window.showInformationMessage("Report copied to clipboard.");
          }
          break;
        case "export":
          await this.exportReport();
          break;
        case "createPortfolioFile":
          await this.createPortfolioFile();
          break;
        case "openSettings":
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "registryStats.myPackages",
          );
          break;
      }
    });

    this.renderShell();
  }

  async generateAndShow(): Promise<void> {
    if (!this.view) return;

    this.view.webview.postMessage({ command: "loading" });

    try {
      let runScope: RunScope;
      let portfolioResult;

      if (this.scope === "portfolio") {
        portfolioResult = await loadPortfolio();
        if (portfolioResult.refs.length === 0) {
          this.view.webview.postMessage({ command: "emptyPortfolio" });
          return;
        }
        runScope = "portfolio";
      } else {
        runScope = this.scope === "workspace" ? "primary" : "all";
      }

      const run = await buildRun(this.scanner, this.service, runScope, portfolioResult);

      switch (this.audience) {
        case "dev":
          this.lastReport = renderDevMarkdown(run);
          this.lastPdf = undefined;
          break;
        case "llm":
          this.lastReport = renderLLMJsonl(run);
          this.lastPdf = undefined;
          break;
        case "executive":
          this.lastReport = buildExecutivePreview(run);
          this.lastPdf = await renderExecutivePdf(run);
          break;
      }

      // For portfolio scope, send structured data for table rendering
      if (this.scope === "portfolio") {
        const totalWeekly = run.packages.reduce(
          (sum, p) => sum + (p.stats?.downloads.lastWeek ?? 0), 0,
        );
        const freshCount = run.packages.filter(
          (p) => p.freshnessHours != null && p.freshnessHours <= 24,
        ).length;
        const freshPct = run.summary.total > 0
          ? Math.round((freshCount / run.summary.total) * 100)
          : 0;

        // Build registry share summary
        const regTotals: Record<string, number> = {};
        for (const p of run.packages) {
          if (p.stats?.downloads.lastWeek != null) {
            regTotals[p.registry] = (regTotals[p.registry] ?? 0) + p.stats.downloads.lastWeek;
          }
        }
        const regShares = Object.entries(regTotals)
          .sort(([, a], [, b]) => b - a)
          .map(([reg, val]) => ({
            registry: reg,
            pct: totalWeekly > 0 ? Math.round((val / totalWeekly) * 100) : 0,
          }));

        // Build row data
        const rows = run.packages.map((p) => {
          const weekly = p.stats?.downloads.lastWeek;
          const monthly = p.stats?.downloads.lastMonth;
          let trend = 0;
          if (weekly != null && monthly != null && monthly > 0) {
            const weeklyRate = weekly / 7;
            const monthlyRate = monthly / 30;
            trend = Math.round(((weeklyRate - monthlyRate) / monthlyRate) * 100);
          }
          return {
            name: p.name,
            registry: p.registry,
            weekly: weekly ?? 0,
            weeklyFmt: formatDownloads(weekly),
            trend,
            freshness: p.freshnessHours ?? -1,
            status: p.error ? "Error" : (p.freshnessHours != null && p.freshnessHours > 24 ? "Stale" : "OK"),
          };
        });

        this.view.webview.postMessage({
          command: "portfolio",
          audience: this.audience,
          content: this.lastReport,
          header: {
            totalWeekly: formatDownloads(totalWeekly),
            count: run.summary.total,
            freshPct,
            regShares,
            source: run.scope.portfolioSource,
          },
          rows,
        });
      } else {
        this.view.webview.postMessage({
          command: "report",
          audience: this.audience,
          content: this.lastReport,
        });
      }
    } catch (err) {
      friendlyError("Generate report", err);
      this.view.webview.postMessage({ command: "error", message: String(err) });
    }
  }

  private async exportReport(): Promise<void> {
    if (this.audience === "executive" && this.lastPdf) {
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file("registry-stats-report.pdf"),
        filters: { "PDF Files": ["pdf"] },
      });
      if (uri) {
        await vscode.workspace.fs.writeFile(uri, this.lastPdf);
        vscode.window.showInformationMessage(`PDF saved to ${uri.fsPath}`);
      }
    } else if (this.lastReport) {
      const ext = this.audience === "llm" ? "jsonl" : "md";
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`registry-stats-report.${ext}`),
        filters: { [ext.toUpperCase()]: [ext] },
      });
      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(this.lastReport, "utf-8"));
        vscode.window.showInformationMessage(`Report saved to ${uri.fsPath}`);
      }
    }
  }

  private async createPortfolioFile(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) {
      vscode.window.showWarningMessage("No workspace folder open.");
      return;
    }

    const fileUri = vscode.Uri.joinPath(folders[0].uri, "registry-stats.portfolio.json");

    try {
      await vscode.workspace.fs.stat(fileUri);
      // File exists — just open it
      const doc = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(doc);
      return;
    } catch {
      // File doesn't exist — create it
    }

    const template = [
      "{",
      '  // Registry Stats Portfolio — My Packages',
      '  "version": 1,',
      '  "packages": [',
      '    // { "registry": "npm", "name": "my-package" },',
      '    // { "registry": "pypi", "name": "my-python-pkg" }',
      "  ],",
      '  "identities": {',
      '    // "npm": ["my-npm-username"],',
      '    // "vscode": ["my-publisher"],',
      '    // "docker": ["my-namespace"]',
      "  }",
      "}",
      "",
    ].join("\n");

    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(template, "utf-8"));
    const doc = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(doc);
  }

  private renderShell(): void {
    if (!this.view) return;
    this.view.webview.html = getWebviewHtml(this.audience, this.scope);
  }
}

function buildExecutivePreview(run: import("../run-model.js").Run): string {
  const lines: string[] = [];
  const title = run.scope?.type === "portfolio"
    ? `EXECUTIVE REPORT — My Packages (${run.scope.portfolioSource})`
    : `EXECUTIVE REPORT — ${run.workspace.name}`;
  lines.push(title);
  lines.push(`Date: ${new Date(run.startedAt).toLocaleDateString()}`);
  lines.push("");
  lines.push(`Packages: ${run.summary.total}  |  OK: ${run.summary.succeeded}  |  Failed: ${run.summary.failed}`);
  lines.push("");

  const top = [...run.packages]
    .filter((p) => p.stats)
    .sort((a, b) => (b.stats?.downloads.lastWeek ?? 0) - (a.stats?.downloads.lastWeek ?? 0))
    .slice(0, 10);

  if (top.length > 0) {
    lines.push("Top Packages (Weekly Downloads):");
    for (const p of top) {
      const w = p.stats?.downloads.lastWeek;
      lines.push(`  ${p.name} (${p.registry}): ${w != null ? w.toLocaleString() : "—"}`);
    }
  }

  // Insights
  const insights = generateInsights(run);
  if (insights.length > 0) {
    lines.push("");
    lines.push("INSIGHTS & SIGNALS");
    for (const s of insights) {
      const tag = s.severity === "high" ? "HIGH" : s.severity === "moderate" ? "MOD" : "LOW";
      const conf = s.confidence < 1.0 ? ` (confidence: ${s.confidence.toFixed(2)})` : "";
      lines.push(`  [${tag}] ${s.message}${conf}`);
    }
  }

  lines.push("");
  lines.push("Export as PDF for the full formatted report.");
  return lines.join("\n");
}

function getWebviewHtml(audience: Audience, scope: SidebarScope): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      padding: 8px 12px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
    }
    .toolbar {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .toolbar-row { display: flex; gap: 6px; flex-wrap: wrap; width: 100%; }
    select, button {
      padding: 4px 8px;
      font-size: 12px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 3px;
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground, #444);
    }
    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
    }
    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    #output {
      white-space: pre-wrap;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      line-height: 1.5;
      padding: 8px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      overflow-x: auto;
      min-height: 100px;
    }
    .loading { color: var(--vscode-descriptionForeground); font-style: italic; }
    .error { color: var(--vscode-errorForeground); }
    .hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 8px;
    }
    /* Portfolio styles */
    .portfolio-header {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: bold;
    }
    .portfolio-header .stat { white-space: nowrap; }
    .portfolio-sub {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 10px;
    }
    .portfolio-badge {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 8px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      margin-left: 4px;
    }
    .ptable {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      white-space: nowrap;
    }
    .ptable th {
      text-align: left;
      padding: 4px 6px;
      border-bottom: 1px solid var(--vscode-panel-border);
      cursor: pointer;
      user-select: none;
      color: var(--vscode-descriptionForeground);
    }
    .ptable th:hover { color: var(--vscode-foreground); }
    .ptable th .arrow { font-size: 9px; margin-left: 2px; }
    .ptable td {
      padding: 3px 6px;
      border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.15));
    }
    .ptable .num { text-align: right; font-variant-numeric: tabular-nums; }
    .trend-up { color: #27ae60; }
    .trend-down { color: #e74c3c; }
    .trend-flat { color: var(--vscode-descriptionForeground); }
    .status-ok { color: #27ae60; }
    .status-error { color: #e74c3c; }
    .status-stale { color: #f39c12; }
    .empty-state {
      text-align: center;
      padding: 24px 12px;
    }
    .empty-state p { margin: 8px 0; }
    .empty-state .actions { display: flex; gap: 8px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-row">
      <select id="scope">
        <option value="dependencies" ${scope === "dependencies" ? "selected" : ""}>All Dependencies</option>
        <option value="workspace" ${scope === "workspace" ? "selected" : ""}>Current Package</option>
        <option value="portfolio" ${scope === "portfolio" ? "selected" : ""}>My Packages</option>
      </select>
      <select id="audience">
        <option value="executive" ${audience === "executive" ? "selected" : ""}>Executive (PDF)</option>
        <option value="llm" ${audience === "llm" ? "selected" : ""}>LLM (JSONL)</option>
        <option value="dev" ${audience === "dev" ? "selected" : ""}>Dev (Markdown)</option>
      </select>
    </div>
    <div class="toolbar-row">
      <button class="btn-primary" id="btnRefresh">Refresh</button>
      <button id="btnCopy">Copy</button>
      <button id="btnExport">Export</button>
    </div>
  </div>
  <div id="output">Click <b>Refresh</b> to generate a report.</div>
  <div class="hint" id="hint"></div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentSort = { col: 'weekly', dir: 'desc' };
    let portfolioRows = [];

    document.getElementById('scope').addEventListener('change', (e) => {
      vscode.postMessage({ command: 'setScope', scope: e.target.value });
    });
    document.getElementById('audience').addEventListener('change', (e) => {
      vscode.postMessage({ command: 'setAudience', audience: e.target.value });
    });
    document.getElementById('btnRefresh').addEventListener('click', () => {
      vscode.postMessage({ command: 'refresh' });
    });
    document.getElementById('btnCopy').addEventListener('click', () => {
      vscode.postMessage({ command: 'copy' });
    });
    document.getElementById('btnExport').addEventListener('click', () => {
      vscode.postMessage({ command: 'export' });
    });

    function sortRows(rows, col, dir) {
      const numCols = ['weekly', 'trend', 'freshness'];
      return [...rows].sort((a, b) => {
        let av = a[col], bv = b[col];
        if (numCols.includes(col)) {
          av = Number(av) || 0;
          bv = Number(bv) || 0;
        } else {
          av = String(av).toLowerCase();
          bv = String(bv).toLowerCase();
        }
        if (av < bv) return dir === 'asc' ? -1 : 1;
        if (av > bv) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    function renderPortfolio(header, rows) {
      portfolioRows = rows;
      const output = document.getElementById('output');
      const hint = document.getElementById('hint');
      const sorted = sortRows(rows, currentSort.col, currentSort.dir);

      const regLine = header.regShares.map(r => r.registry + ' ' + r.pct + '%').join(' · ');
      const srcBadge = header.source ? '<span class="portfolio-badge">' + header.source + '</span>' : '';

      let html = '<div class="portfolio-header">';
      html += '<span class="stat">' + header.totalWeekly + ' weekly</span>';
      html += '<span class="stat">' + header.count + ' packages</span>';
      html += '<span class="stat">Fresh ' + header.freshPct + '%</span>';
      html += srcBadge;
      html += '</div>';
      html += '<div class="portfolio-sub">' + regLine + '</div>';

      html += '<table class="ptable"><thead><tr>';
      const cols = [
        { key: 'name', label: 'Package' },
        { key: 'registry', label: 'Registry' },
        { key: 'weekly', label: 'Weekly' },
        { key: 'trend', label: 'Trend' },
        { key: 'freshness', label: 'Fresh' },
        { key: 'status', label: 'Status' },
      ];
      for (const c of cols) {
        const arrow = currentSort.col === c.key ? (currentSort.dir === 'asc' ? ' ↑' : ' ↓') : '';
        html += '<th data-col="' + c.key + '">' + c.label + '<span class="arrow">' + arrow + '</span></th>';
      }
      html += '</tr></thead><tbody>';

      for (const r of sorted) {
        const trendCls = r.trend > 5 ? 'trend-up' : r.trend < -5 ? 'trend-down' : 'trend-flat';
        const trendStr = r.trend > 0 ? '+' + r.trend + '%' : r.trend + '%';
        const freshStr = r.freshness < 0 ? '—' : r.freshness < 1 ? '<1h' : Math.round(r.freshness) + 'h';
        const statusCls = r.status === 'OK' ? 'status-ok' : r.status === 'Error' ? 'status-error' : 'status-stale';
        html += '<tr>';
        html += '<td>' + r.name + '</td>';
        html += '<td>' + r.registry + '</td>';
        html += '<td class="num">' + r.weeklyFmt + '</td>';
        html += '<td class="num ' + trendCls + '">' + trendStr + '</td>';
        html += '<td class="num">' + freshStr + '</td>';
        html += '<td class="' + statusCls + '">' + r.status + '</td>';
        html += '</tr>';
      }
      html += '</tbody></table>';

      output.innerHTML = html;
      hint.textContent = 'Click column headers to sort. Export for full report.';

      // Attach sort handlers
      output.querySelectorAll('th[data-col]').forEach(th => {
        th.addEventListener('click', () => {
          const col = th.getAttribute('data-col');
          if (currentSort.col === col) {
            currentSort.dir = currentSort.dir === 'desc' ? 'asc' : 'desc';
          } else {
            currentSort.col = col;
            currentSort.dir = col === 'name' || col === 'registry' || col === 'status' ? 'asc' : 'desc';
          }
          renderPortfolio(header, portfolioRows);
        });
      });
    }

    function renderEmptyPortfolio() {
      const output = document.getElementById('output');
      const hint = document.getElementById('hint');
      output.innerHTML = '<div class="empty-state">' +
        '<p><b>No packages configured</b></p>' +
        '<p>Add packages to monitor your portfolio across registries.</p>' +
        '<div class="actions">' +
        '<button class="btn-primary" id="btnCreatePortfolio">Create Portfolio File</button>' +
        '<button id="btnOpenSettings">Open Settings</button>' +
        '</div></div>';
      hint.textContent = '';

      document.getElementById('btnCreatePortfolio')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'createPortfolioFile' });
      });
      document.getElementById('btnOpenSettings')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'openSettings' });
      });
    }

    window.addEventListener('message', (e) => {
      const msg = e.data;
      const output = document.getElementById('output');
      const hint = document.getElementById('hint');

      switch (msg.command) {
        case 'loading':
          output.innerHTML = '<span class="loading">Fetching stats...</span>';
          hint.textContent = '';
          break;
        case 'report':
          output.textContent = msg.content;
          if (msg.audience === 'executive') {
            hint.textContent = 'Click Export to save as PDF.';
          } else if (msg.audience === 'llm') {
            hint.textContent = 'JSONL format — one JSON object per line.';
          } else {
            hint.textContent = 'Markdown format — paste into GitHub issues or PRs.';
          }
          break;
        case 'portfolio':
          renderPortfolio(msg.header, msg.rows);
          break;
        case 'emptyPortfolio':
          renderEmptyPortfolio();
          break;
        case 'error':
          output.innerHTML = '<span class="error">Error: ' + msg.message + '</span>';
          hint.textContent = '';
          break;
      }
    });
  </script>
</body>
</html>`;
}
