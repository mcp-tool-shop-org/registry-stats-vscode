import { describe, it, expect } from "vitest";
import { vi } from "vitest";
import type { Run } from "../src/run-model.js";
import { renderDevMarkdown } from "../src/reporters/dev.js";
import { renderLLMJsonl } from "../src/reporters/llm.js";

// Mock vscode
vi.mock("vscode", () => ({}));

function makeRun(overrides?: Partial<Run>): Run {
  return {
    schemaVersion: "1.0",
    runId: "test-run-123",
    startedAt: "2026-03-01T12:00:00.000Z",
    completedAt: "2026-03-01T12:00:02.000Z",
    workspace: { name: "test-workspace", rootUri: "file:///test" },
    packages: [
      {
        registry: "npm",
        name: "express",
        manifest: { file: "/test/package.json", line: 10 },
        stats: {
          registry: "npm",
          package: "express",
          downloads: { lastDay: 100_000, lastWeek: 700_000, lastMonth: 3_000_000, total: 500_000_000 },
          fetchedAt: "2026-03-01T12:00:01.000Z",
        },
        freshnessHours: 0.1,
      },
      {
        registry: "pypi",
        name: "flask",
        manifest: { file: "/test/pyproject.toml", line: 5 },
        error: { code: "FETCH_FAILED", message: "No data returned", retryable: true },
      },
    ],
    trace: [
      { time: "2026-03-01T12:00:00.000Z", level: "info", component: "scanner", event: "scan.start" },
      { time: "2026-03-01T12:00:00.500Z", level: "info", component: "scanner", event: "scan.complete", data: { count: 2 }, durationMs: 500 },
      { time: "2026-03-01T12:00:01.000Z", level: "info", component: "fetcher", event: "fetch.start", data: { count: 2 } },
      { time: "2026-03-01T12:00:02.000Z", level: "info", component: "fetcher", event: "fetch.complete", durationMs: 1000 },
    ],
    summary: {
      total: 2,
      succeeded: 1,
      failed: 1,
      stale: 0,
      durationMs: 2000,
      registries: {
        npm: { total: 1, ok: 1, failed: 0 },
        pypi: { total: 1, ok: 0, failed: 1 },
      },
    },
    ...overrides,
  };
}

describe("renderDevMarkdown", () => {
  it("produces valid markdown with all sections", () => {
    const md = renderDevMarkdown(makeRun());

    expect(md).toContain("# Registry Stats — Dev Report");
    expect(md).toContain("test-workspace");
    expect(md).toContain("test-run-123");

    // Summary table
    expect(md).toContain("| Total packages | 2 |");
    expect(md).toContain("| Succeeded | 1 |");
    expect(md).toContain("| Failed | 1 |");

    // Registry breakdown
    expect(md).toContain("| npm | 1 | 1 | 0 |");
    expect(md).toContain("| pypi | 1 | 0 | 1 |");

    // Package results
    expect(md).toContain("express");
    expect(md).toContain("700,000");

    // Error section
    expect(md).toContain("## Errors");
    expect(md).toContain("FETCH_FAILED");

    // Trace
    expect(md).toContain("scan.start");
    expect(md).toContain("<details>");
  });

  it("handles empty run", () => {
    const md = renderDevMarkdown(makeRun({
      packages: [],
      trace: [],
      summary: { total: 0, succeeded: 0, failed: 0, stale: 0, durationMs: 100, registries: {} },
    }));
    expect(md).toContain("| Total packages | 0 |");
    expect(md).not.toContain("## Errors");
  });
});

describe("renderLLMJsonl", () => {
  it("produces valid JSONL", () => {
    const jsonl = renderLLMJsonl(makeRun());
    const lines = jsonl.split("\n").filter(Boolean);

    // Each line should be valid JSON
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }

    // First line is header
    const header = JSON.parse(lines[0]);
    expect(header.type).toBe("header");
    expect(header.schema_version).toBe("1.0");
    expect(header.run_id).toBe("test-run-123");
  });

  it("includes package records with provenance", () => {
    const jsonl = renderLLMJsonl(makeRun());
    const lines = jsonl.split("\n").filter(Boolean).map((l) => JSON.parse(l));

    const pkgLines = lines.filter((l) => l.type === "package");
    expect(pkgLines).toHaveLength(2);

    const npm = pkgLines.find((p: Record<string, unknown>) => p.registry === "npm");
    expect(npm.name).toBe("express");
    expect(npm.downloads).toBeDefined();
    expect(npm.freshness_hours).toBeDefined();
    expect(npm.source_registry).toBe("npm");

    const pypi = pkgLines.find((p: Record<string, unknown>) => p.registry === "pypi");
    expect(pypi.error).toBeDefined();
    expect(pypi.error.code).toBe("FETCH_FAILED");
    expect(pypi.error.retryable).toBe(true);
  });

  it("includes summary line", () => {
    const jsonl = renderLLMJsonl(makeRun());
    const lines = jsonl.split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const summary = lines.find((l) => l.type === "summary");
    expect(summary.total).toBe(2);
    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toBe(1);
  });

  it("includes trace lines", () => {
    const jsonl = renderLLMJsonl(makeRun());
    const lines = jsonl.split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const traces = lines.filter((l) => l.type === "trace");
    expect(traces.length).toBe(4);
    expect(traces[0].event).toBe("scan.start");
  });
});
