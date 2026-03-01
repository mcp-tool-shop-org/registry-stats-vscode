import * as vscode from "vscode";

// ── Formatting ──────────────────────────────────────────────────────

export function formatDownloads(n: number | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatDownloadsLong(n: number | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function trendArrow(direction: "up" | "down" | "flat" | "unknown"): string {
  switch (direction) {
    case "up": return "\u2197\uFE0E";
    case "down": return "\u2198\uFE0E";
    case "flat": return "\u2192";
    default: return "—";
  }
}

// ── Logging ─────────────────────────────────────────────────────────

let _channel: vscode.OutputChannel | undefined;

export function initOutputChannel(): vscode.OutputChannel {
  if (!_channel) {
    _channel = vscode.window.createOutputChannel("Registry Stats");
  }
  return _channel;
}

export function log(msg: string): void {
  _channel?.appendLine(`[${new Date().toISOString()}] ${msg}`);
}

// ── Error Classification ────────────────────────────────────────────

export interface ErrorInfo {
  code: string;
  message: string;
  hint: string;
  cause?: string;
  retryable: boolean;
}

export function classifyError(context: string, err: unknown): ErrorInfo {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes("ECONNREFUSED") || raw.includes("ENOTFOUND")) {
    return {
      code: "NETWORK_ERROR",
      message: `${context}: Network request failed.`,
      hint: "Check your internet connection.",
      cause: raw,
      retryable: true,
    };
  }

  if (raw.includes("429") || raw.toLowerCase().includes("rate limit")) {
    return {
      code: "RATE_LIMITED",
      message: `${context}: Rate limited by registry.`,
      hint: "Wait a few minutes and try again.",
      cause: raw,
      retryable: true,
    };
  }

  if (raw.includes("404")) {
    return {
      code: "NOT_FOUND",
      message: `${context}: Package not found.`,
      hint: "Check the package name and registry.",
      cause: raw,
      retryable: false,
    };
  }

  return {
    code: "RUNTIME_ERROR",
    message: `${context}: ${raw}`,
    hint: "Check the output channel for details.",
    cause: raw,
    retryable: false,
  };
}

export function friendlyError(context: string, err: unknown): void {
  const info = classifyError(context, err);
  log(`[${info.code}] ${info.message}`);
  if (info.retryable) {
    vscode.window.showWarningMessage(`${info.message} ${info.hint}`);
  } else {
    vscode.window.showErrorMessage(`${info.message} ${info.hint}`);
  }
}
