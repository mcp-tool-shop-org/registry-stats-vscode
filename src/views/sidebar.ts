import * as vscode from "vscode";
import type { WorkspaceScanner } from "../scanner.js";
import type { StatsService } from "../stats-service.js";
import { buildRun } from "../run-model.js";
import { renderDevMarkdown } from "../reporters/dev.js";
import { renderLLMJsonl } from "../reporters/llm.js";
import { renderExecutivePdf } from "../reporters/executive.js";
import { log, friendlyError } from "../util.js";
import { generateInsights } from "../analysis/index.js";

export type Audience = "executive" | "llm" | "dev";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "registryStats.sidebar";

  private view?: vscode.WebviewView;
  private audience: Audience = "dev";
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
      }
    });

    this.renderShell();
  }

  async generateAndShow(): Promise<void> {
    if (!this.view) return;

    this.view.webview.postMessage({ command: "loading" });

    try {
      const run = await buildRun(this.scanner, this.service);

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

      this.view.webview.postMessage({
        command: "report",
        audience: this.audience,
        content: this.lastReport,
      });
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

  private renderShell(): void {
    if (!this.view) return;
    this.view.webview.html = getWebviewHtml(this.audience);
  }
}

function buildExecutivePreview(run: import("../run-model.js").Run): string {
  // Plain text preview for the sidebar (PDF is exported separately)
  const lines: string[] = [];
  lines.push(`EXECUTIVE REPORT — ${run.workspace.name}`);
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

function getWebviewHtml(audience: Audience): string {
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
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
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
    .loading {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }
    .error {
      color: var(--vscode-errorForeground);
    }
    .hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <select id="audience">
      <option value="executive" ${audience === "executive" ? "selected" : ""}>Executive (PDF)</option>
      <option value="llm" ${audience === "llm" ? "selected" : ""}>LLM (JSONL)</option>
      <option value="dev" ${audience === "dev" ? "selected" : ""}>Dev (Markdown)</option>
    </select>
    <button class="btn-primary" id="btnRefresh">Refresh</button>
    <button id="btnCopy">Copy</button>
    <button id="btnExport">Export</button>
  </div>
  <div id="output">Click <b>Refresh</b> to generate a report.</div>
  <div class="hint" id="hint"></div>

  <script>
    const vscode = acquireVsCodeApi();

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
