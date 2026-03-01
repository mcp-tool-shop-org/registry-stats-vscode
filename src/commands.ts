import * as vscode from "vscode";
import type { WorkspaceScanner } from "./scanner.js";
import type { StatsService } from "./stats-service.js";
import type { SidebarProvider, Audience } from "./views/sidebar.js";
import type { RunScope } from "./run-model.js";
import { buildRun } from "./run-model.js";
import { loadPortfolio } from "./portfolio.js";
import { renderDevMarkdown } from "./reporters/dev.js";
import { renderLLMJsonl } from "./reporters/llm.js";
import { renderExecutivePdf } from "./reporters/executive.js";
import { friendlyError, log } from "./util.js";

export function registerCommands(
  context: vscode.ExtensionContext,
  scanner: WorkspaceScanner,
  service: StatsService,
  sidebar: SidebarProvider,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("registryStats.generateReport", () =>
      generateReport(scanner, service),
    ),
    vscode.commands.registerCommand("registryStats.refresh", async () => {
      service.clearCache();
      await sidebar.generateAndShow();
      vscode.window.showInformationMessage("Registry Stats: Cache cleared and refreshing.");
    }),
    vscode.commands.registerCommand("registryStats.openSidebar", () => {
      vscode.commands.executeCommand("registryStats.sidebar.focus");
    }),
    vscode.commands.registerCommand("registryStats.copyExecutiveSummary", () =>
      copyReport(scanner, service, "executive"),
    ),
    vscode.commands.registerCommand("registryStats.copyLLMJsonl", () =>
      copyReport(scanner, service, "llm"),
    ),
    vscode.commands.registerCommand("registryStats.copyDevMarkdown", () =>
      copyReport(scanner, service, "dev"),
    ),
  );
}

async function generateReport(
  scanner: WorkspaceScanner,
  service: StatsService,
): Promise<void> {
  // Step 1: Pick scope
  const scopePick = await vscode.window.showQuickPick(
    [
      { label: "All Dependencies", description: "Every dependency in the workspace", value: "all" as RunScope },
      { label: "Current Package", description: "Only the primary package", value: "primary" as RunScope },
      { label: "My Packages (Portfolio)", description: "Your cross-registry portfolio", value: "portfolio" as RunScope },
    ],
    { placeHolder: "Select scope" },
  );
  if (!scopePick) return;

  // Step 2: Pick audience
  const audiencePick = await vscode.window.showQuickPick(
    [
      { label: "Executive (PDF)", description: "One-page summary for sharing", value: "executive" as Audience },
      { label: "LLM (JSONL)", description: "Machine-friendly with provenance", value: "llm" as Audience },
      { label: "Dev (Markdown)", description: "Debuggable, pasteable into issues", value: "dev" as Audience },
    ],
    { placeHolder: "Select report audience" },
  );
  if (!audiencePick) return;

  // Step 3: Pick output
  const outputPick = await vscode.window.showQuickPick(
    [
      { label: "Copy to Clipboard", value: "copy" },
      { label: "Save to File", value: "save" },
      { label: "Preview in Editor", value: "preview" },
    ],
    { placeHolder: "How would you like the report?" },
  );
  if (!outputPick) return;

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Generating report...", cancellable: false },
    async () => {
      try {
        let portfolioResult;
        if (scopePick.value === "portfolio") {
          portfolioResult = await loadPortfolio();
          if (portfolioResult.refs.length === 0) {
            vscode.window.showWarningMessage("No packages configured in your portfolio. Add packages via settings or a portfolio file.");
            return;
          }
        }
        const run = await buildRun(scanner, service, scopePick.value, portfolioResult);

        switch (audiencePick.value) {
          case "executive": {
            if (outputPick.value === "copy") {
              // Copy plain text summary
              const lines = buildPlainSummary(run);
              await vscode.env.clipboard.writeText(lines);
              vscode.window.showInformationMessage("Executive summary copied to clipboard.");
            } else if (outputPick.value === "save") {
              const pdf = await renderExecutivePdf(run);
              const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file("registry-stats-report.pdf"),
                filters: { "PDF Files": ["pdf"] },
              });
              if (uri) {
                await vscode.workspace.fs.writeFile(uri, pdf);
                vscode.window.showInformationMessage(`PDF saved to ${uri.fsPath}`);
              }
            } else {
              // Preview — show plain text in new editor
              const content = buildPlainSummary(run);
              const doc = await vscode.workspace.openTextDocument({ content, language: "plaintext" });
              await vscode.window.showTextDocument(doc);
            }
            break;
          }

          case "llm": {
            const jsonl = renderLLMJsonl(run);
            if (outputPick.value === "copy") {
              await vscode.env.clipboard.writeText(jsonl);
              vscode.window.showInformationMessage("LLM JSONL copied to clipboard.");
            } else if (outputPick.value === "save") {
              const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file("registry-stats-report.jsonl"),
                filters: { "JSONL Files": ["jsonl"] },
              });
              if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonl, "utf-8"));
                vscode.window.showInformationMessage(`JSONL saved to ${uri.fsPath}`);
              }
            } else {
              const doc = await vscode.workspace.openTextDocument({ content: jsonl, language: "json" });
              await vscode.window.showTextDocument(doc);
            }
            break;
          }

          case "dev": {
            const md = renderDevMarkdown(run);
            if (outputPick.value === "copy") {
              await vscode.env.clipboard.writeText(md);
              vscode.window.showInformationMessage("Dev Markdown copied to clipboard.");
            } else if (outputPick.value === "save") {
              const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file("registry-stats-report.md"),
                filters: { "Markdown Files": ["md"] },
              });
              if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(md, "utf-8"));
                vscode.window.showInformationMessage(`Markdown saved to ${uri.fsPath}`);
              }
            } else {
              const doc = await vscode.workspace.openTextDocument({ content: md, language: "markdown" });
              await vscode.window.showTextDocument(doc);
            }
            break;
          }
        }
      } catch (err) {
        friendlyError("Generate report", err);
      }
    },
  );
}

async function copyReport(
  scanner: WorkspaceScanner,
  service: StatsService,
  audience: Audience,
): Promise<void> {
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Generating...", cancellable: false },
    async () => {
      try {
        const run = await buildRun(scanner, service);
        let content: string;
        switch (audience) {
          case "executive":
            content = buildPlainSummary(run);
            break;
          case "llm":
            content = renderLLMJsonl(run);
            break;
          case "dev":
            content = renderDevMarkdown(run);
            break;
        }
        await vscode.env.clipboard.writeText(content);
        vscode.window.showInformationMessage(`${audience} report copied to clipboard.`);
      } catch (err) {
        friendlyError("Copy report", err);
      }
    },
  );
}

function buildPlainSummary(run: import("./run-model.js").Run): string {
  const lines: string[] = [];
  lines.push(`Registry Stats — Executive Summary`);
  lines.push(`Workspace: ${run.workspace.name}`);
  lines.push(`Date: ${new Date(run.startedAt).toLocaleDateString()}`);
  lines.push("");
  lines.push(`Packages: ${run.summary.total} | OK: ${run.summary.succeeded} | Failed: ${run.summary.failed}`);
  lines.push("");

  const top = [...run.packages]
    .filter((p) => p.stats)
    .sort((a, b) => (b.stats?.downloads.lastWeek ?? 0) - (a.stats?.downloads.lastWeek ?? 0))
    .slice(0, 10);

  for (const p of top) {
    const w = p.stats?.downloads.lastWeek;
    lines.push(`  ${p.name} (${p.registry}): ${w != null ? w.toLocaleString() : "—"}/wk`);
  }

  return lines.join("\n");
}
