import { describe, it, expect } from "vitest";
import { formatDownloads, formatDownloadsLong, timeAgo, trendArrow, classifyError } from "../src/util.js";

// Mock vscode module
import { vi } from "vitest";
vi.mock("vscode", () => ({
  window: {
    createOutputChannel: () => ({ appendLine: vi.fn() }),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
  },
}));

describe("formatDownloads", () => {
  it("formats billions", () => {
    expect(formatDownloads(1_500_000_000)).toBe("1.5B");
  });

  it("formats millions", () => {
    expect(formatDownloads(67_367_773)).toBe("67.4M");
  });

  it("formats thousands", () => {
    expect(formatDownloads(4_500)).toBe("4.5K");
  });

  it("formats small numbers", () => {
    expect(formatDownloads(42)).toBe("42");
  });

  it("handles undefined", () => {
    expect(formatDownloads(undefined)).toBe("—");
  });

  it("handles zero", () => {
    expect(formatDownloads(0)).toBe("0");
  });
});

describe("formatDownloadsLong", () => {
  it("formats with commas", () => {
    expect(formatDownloadsLong(1_234_567)).toBe("1,234,567");
  });

  it("handles undefined", () => {
    expect(formatDownloadsLong(undefined)).toBe("—");
  });
});

describe("timeAgo", () => {
  it("shows just now", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
  });

  it("shows minutes ago", () => {
    const d = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgo(d)).toBe("5m ago");
  });

  it("shows hours ago", () => {
    const d = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(timeAgo(d)).toBe("3h ago");
  });

  it("shows days ago", () => {
    const d = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(timeAgo(d)).toBe("2d ago");
  });
});

describe("trendArrow", () => {
  it("returns up arrow", () => {
    expect(trendArrow("up")).toBe("\u2197\uFE0E");
  });

  it("returns down arrow", () => {
    expect(trendArrow("down")).toBe("\u2198\uFE0E");
  });

  it("returns flat arrow", () => {
    expect(trendArrow("flat")).toBe("\u2192");
  });

  it("returns dash for unknown", () => {
    expect(trendArrow("unknown")).toBe("—");
  });
});

describe("classifyError", () => {
  it("classifies connection refused", () => {
    const info = classifyError("test", new Error("ECONNREFUSED"));
    expect(info.code).toBe("NETWORK_ERROR");
    expect(info.retryable).toBe(true);
  });

  it("classifies rate limit", () => {
    const info = classifyError("test", new Error("429 Too Many Requests"));
    expect(info.code).toBe("RATE_LIMITED");
    expect(info.retryable).toBe(true);
  });

  it("classifies not found", () => {
    const info = classifyError("test", new Error("404 Not Found"));
    expect(info.code).toBe("NOT_FOUND");
    expect(info.retryable).toBe(false);
  });

  it("classifies unknown errors", () => {
    const info = classifyError("test", new Error("something weird"));
    expect(info.code).toBe("RUNTIME_ERROR");
    expect(info.retryable).toBe(false);
  });
});
