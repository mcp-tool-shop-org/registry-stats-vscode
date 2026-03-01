import * as vscode from "vscode";
import type { RegistryName } from "@mcptoolshop/registry-stats";

export interface CodeLensConfig {
  enabled: boolean;
  maxPerFile: number;
  showFreshness: boolean;
  showTrend: boolean;
  refreshOnSave: boolean;
}

export interface ExtConfig {
  enabledRegistries: RegistryName[];
  cacheTtlHours: Record<string, number>;
  statusBarEnabled: boolean;
  hoverEnabled: boolean;
  devLoggingEnabled: boolean;
  devLoggingLevel: "info" | "debug";
  dockerToken: string;
  maxConcurrentRequests: number;
  codeLens: CodeLensConfig;
}

const DEFAULT_TTL: Record<string, number> = {
  npm: 6,
  pypi: 6,
  nuget: 12,
  vscode: 12,
  docker: 24,
};

export function getConfig(): ExtConfig {
  const cfg = vscode.workspace.getConfiguration("registryStats");
  return {
    enabledRegistries: cfg.get<RegistryName[]>("enabledRegistries", [
      "npm", "pypi", "nuget", "vscode", "docker",
    ]),
    cacheTtlHours: { ...DEFAULT_TTL, ...cfg.get<Record<string, number>>("cacheTtlHours", {}) },
    statusBarEnabled: cfg.get<boolean>("statusBar.enabled", true),
    hoverEnabled: cfg.get<boolean>("hover.enabled", true),
    devLoggingEnabled: cfg.get<boolean>("devLogging.enabled", false),
    devLoggingLevel: cfg.get<"info" | "debug">("devLogging.level", "info"),
    dockerToken: cfg.get<string>("dockerToken", ""),
    maxConcurrentRequests: cfg.get<number>("maxConcurrentRequests", 3),
    codeLens: {
      enabled: cfg.get<boolean>("codeLens.enabled", false),
      maxPerFile: cfg.get<number>("codeLens.maxPerFile", 50),
      showFreshness: cfg.get<boolean>("codeLens.showFreshness", true),
      showTrend: cfg.get<boolean>("codeLens.showTrend", true),
      refreshOnSave: cfg.get<boolean>("codeLens.refreshOnSave", false),
    },
  };
}

export function getTtlMs(registry: string): number {
  const config = getConfig();
  const hours = config.cacheTtlHours[registry] ?? 6;
  return hours * 3_600_000;
}
