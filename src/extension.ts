import * as vscode from "vscode";
import { WorkspaceScanner } from "./scanner.js";
import { StatsService } from "./stats-service.js";
import { StatusBarController } from "./views/status-bar.js";
import { SidebarProvider } from "./views/sidebar.js";
import { registerHoverProviders } from "./hover.js";
import { registerCommands } from "./commands.js";
import { StatsCodeLensProvider, handleCodeLensClick } from "./codelens.js";
import { getConfig } from "./config.js";
import { initOutputChannel, log } from "./util.js";

export function activate(context: vscode.ExtensionContext): void {
  // 1. Output channel
  const channel = initOutputChannel();
  context.subscriptions.push(channel);
  log("Registry Stats activating...");

  // 2. Core services
  const scanner = new WorkspaceScanner();
  const service = new StatsService(context.globalState);

  // 3. Status bar
  const statusBar = new StatusBarController(service, scanner);
  context.subscriptions.push(statusBar);

  // 4. Sidebar
  const sidebar = new SidebarProvider(context.extensionUri, scanner, service);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebar),
  );

  // 5. Hover providers
  const hovers = registerHoverProviders(scanner, service);
  context.subscriptions.push(...hovers);

  // 6. CodeLens
  const codeLensProvider = new StatsCodeLensProvider(service);
  context.subscriptions.push(
    codeLensProvider,
    vscode.languages.registerCodeLensProvider(
      { language: "json", pattern: "**/package.json" },
      codeLensProvider,
    ),
    vscode.commands.registerCommand("registryStats.codeLensClick", (ref, stat) =>
      handleCodeLensClick(service, ref, stat),
    ),
    vscode.commands.registerCommand("registryStats.refreshCodeLens", () => {
      codeLensProvider.refresh();
      vscode.window.showInformationMessage("Registry Stats: CodeLens refreshed.");
    }),
  );

  // 7. Commands
  registerCommands(context, scanner, service, sidebar);

  // 8. Re-scan on manifest save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      const name = doc.fileName.split(/[/\\]/).pop() ?? "";
      if (
        name === "package.json" ||
        name === "pyproject.toml" ||
        name.endsWith(".csproj")
      ) {
        scanner.scan().then(() => statusBar.refresh());

        // CodeLens refresh on save (if enabled)
        if (name === "package.json" && getConfig().codeLens.refreshOnSave) {
          codeLensProvider.debouncedRefresh();
        }
      }
    }),
  );

  log("Registry Stats activated.");
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
