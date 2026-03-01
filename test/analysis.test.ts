import { describe, it, expect, vi } from "vitest";
import type { Run, PkgResult } from "../src/run-model.js";

vi.mock("vscode", () => ({}));

import { generateInsights } from "../src/analysis/index.js";
import { concentrationSignals } from "../src/analysis/concentration.js";
import { momentumSignals } from "../src/analysis/momentum.js";
import { exposureSignals } from "../src/analysis/exposure.js";
import { opportunitySignals } from "../src/analysis/opportunity.js";

// ── Helpers ─────────────────────────────────────────────────────

function pkg(
  name: string,
  registry: string,
  weekly: number,
  monthly?: number,
): PkgResult {
  return {
    registry: registry as PkgResult["registry"],
    name,
    manifest: { file: "/test/package.json", line: 1 },
    stats: {
      registry: registry as PkgResult["registry"],
      package: name,
      downloads: {
        lastWeek: weekly,
        lastMonth: monthly ?? weekly * 4,
        lastDay: Math.floor(weekly / 7),
      },
      fetchedAt: new Date().toISOString(),
    },
    freshnessHours: 0.1,
  };
}

function run(packages: PkgResult[]): Run {
  const registries: Record<string, { total: number; ok: number; failed: number }> = {};
  for (const p of packages) {
    const r = registries[p.registry] ?? { total: 0, ok: 0, failed: 0 };
    r.total++;
    if (p.stats) r.ok++;
    else r.failed++;
    registries[p.registry] = r;
  }
  return {
    schemaVersion: "1.0",
    runId: "test-run",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    workspace: { name: "test", rootUri: "file:///test" },
    packages,
    trace: [],
    summary: {
      total: packages.length,
      succeeded: packages.filter((p) => p.stats).length,
      failed: packages.filter((p) => !p.stats).length,
      stale: 0,
      durationMs: 100,
      registries,
    },
  };
}

// ── Concentration ───────────────────────────────────────────────

describe("concentrationSignals", () => {
  it("returns high when top 3 hold ≥ 80%", () => {
    const r = run([
      pkg("a", "npm", 500_000),
      pkg("b", "npm", 300_000),
      pkg("c", "npm", 100_000),
      pkg("d", "npm", 50_000),
      pkg("e", "npm", 50_000),
    ]);
    const signals = concentrationSignals(r);
    expect(signals).toHaveLength(1);
    expect(signals[0].severity).toBe("high");
    expect(signals[0].confidence).toBe(1.0);
    expect(signals[0].message).toContain("a, b, c");
  });

  it("returns moderate when top 3 hold 65–80%", () => {
    const r = run([
      pkg("a", "npm", 300_000),
      pkg("b", "npm", 200_000),
      pkg("c", "npm", 150_000),
      pkg("d", "npm", 100_000),
      pkg("e", "npm", 100_000),
      pkg("f", "npm", 80_000),
    ]);
    // top3 = 650k / 930k = 69.9%
    const signals = concentrationSignals(r);
    expect(signals).toHaveLength(1);
    expect(signals[0].severity).toBe("moderate");
  });

  it("returns no signal when spread across many packages", () => {
    // 10 packages each with 100k → top 3 = 30%
    const pkgs = Array.from({ length: 10 }, (_, i) => pkg(`pkg-${i}`, "npm", 100_000));
    const signals = concentrationSignals(run(pkgs));
    expect(signals).toHaveLength(0);
  });

  it("returns no signal with fewer than 4 packages", () => {
    const r = run([
      pkg("a", "npm", 500_000),
      pkg("b", "npm", 300_000),
      pkg("c", "npm", 100_000),
    ]);
    const signals = concentrationSignals(r);
    expect(signals).toHaveLength(0);
  });
});

// ── Momentum ────────────────────────────────────────────────────

describe("momentumSignals", () => {
  it("detects growers with ≥ 10% acceleration", () => {
    // weekly=10000, monthly=28000 → weeklyRate=1428, monthlyRate=933 → delta=+53%
    const r = run([
      pkg("growing", "npm", 10_000, 28_000),
      pkg("stable", "npm", 10_000, 40_000),
    ]);
    const signals = momentumSignals(r);
    const grower = signals.find((s) => s.id === "momentum-growers");
    expect(grower).toBeDefined();
    expect(grower!.message).toContain("growing");
  });

  it("detects decliners and marks high severity for top-5", () => {
    // weekly=50000, monthly=300000 → weeklyRate=7142, monthlyRate=10000 → delta=-28%
    const r = run([
      pkg("bigdecliner", "npm", 50_000, 300_000),
      pkg("stable", "npm", 5_000, 20_000),
    ]);
    const signals = momentumSignals(r);
    const decliner = signals.find((s) => s.id === "momentum-decliners");
    expect(decliner).toBeDefined();
    expect(decliner!.severity).toBe("high");
    expect(decliner!.confidence).toBe(0.75);
  });

  it("returns no signal when all packages are stable", () => {
    // For stable: monthly ≈ weekly * 30/7 = weekly * 4.286
    // weekly=10000, monthly=43000 → weeklyRate=1428, monthlyRate=1433 → delta ≈ -0.3%
    const r = run([
      pkg("a", "npm", 10_000, 43_000),
      pkg("b", "npm", 8_000, 34_400),
    ]);
    const signals = momentumSignals(r);
    expect(signals).toHaveLength(0);
  });

  it("returns no signal when lastMonth is missing", () => {
    const p: PkgResult = {
      registry: "nuget",
      name: "some-nuget",
      manifest: { file: "/test/test.csproj", line: 1 },
      stats: {
        registry: "nuget",
        package: "some-nuget",
        downloads: { total: 500_000 },
        fetchedAt: new Date().toISOString(),
      },
      freshnessHours: 0.1,
    };
    const signals = momentumSignals(run([p]));
    expect(signals).toHaveLength(0);
  });
});

// ── Exposure ────────────────────────────────────────────────────

describe("exposureSignals", () => {
  it("returns high when single registry > 80%", () => {
    const r = run([
      pkg("a", "npm", 900_000),
      pkg("b", "pypi", 100_000),
    ]);
    const signals = exposureSignals(r);
    expect(signals).toHaveLength(1);
    expect(signals[0].severity).toBe("high");
    expect(signals[0].message).toContain("npm");
    expect(signals[0].confidence).toBe(1.0);
  });

  it("returns moderate when top 2 > 90%", () => {
    const r = run([
      pkg("a", "npm", 500_000),
      pkg("b", "pypi", 450_000),
      pkg("c", "nuget", 50_000),
    ]);
    // npm + pypi = 950k / 1000k = 95%
    const signals = exposureSignals(r);
    expect(signals).toHaveLength(1);
    expect(signals[0].severity).toBe("moderate");
    expect(signals[0].message).toContain("npm");
    expect(signals[0].message).toContain("pypi");
  });

  it("returns no signal when balanced across registries", () => {
    const r = run([
      pkg("a", "npm", 400_000),
      pkg("b", "pypi", 350_000),
      pkg("c", "nuget", 250_000),
    ]);
    // npm=40%, pypi=35%, nuget=25% → top=40% < 80%, top2=75% < 90%
    const signals = exposureSignals(r);
    expect(signals).toHaveLength(0);
  });

  it("returns no signal with only one registry", () => {
    const r = run([
      pkg("a", "npm", 500_000),
      pkg("b", "npm", 300_000),
    ]);
    const signals = exposureSignals(r);
    expect(signals).toHaveLength(0);
  });
});

// ── Opportunity ─────────────────────────────────────────────────

describe("opportunitySignals", () => {
  it("detects mid-tier accelerator", () => {
    const r = run([
      pkg("big1", "npm", 500_000),
      pkg("big2", "npm", 300_000),
      pkg("big3", "npm", 100_000),
      // mid-tier: weekly=5000, monthly=12000 → rate delta = +78%
      pkg("rising", "npm", 5_000, 12_000),
    ]);
    const signals = opportunitySignals(r);
    expect(signals).toHaveLength(1);
    expect(signals[0].category).toBe("opportunity");
    expect(signals[0].message).toContain("rising");
    expect(signals[0].confidence).toBe(0.75);
  });

  it("returns no signal when all mid-tier packages are stable", () => {
    const r = run([
      pkg("big1", "npm", 500_000),
      pkg("big2", "npm", 300_000),
      pkg("big3", "npm", 100_000),
      pkg("mid", "npm", 5_000, 20_000), // stable (delta ≈ +7%)
    ]);
    const signals = opportunitySignals(r);
    expect(signals).toHaveLength(0);
  });

  it("returns no signal with fewer than 4 packages", () => {
    const r = run([
      pkg("a", "npm", 500_000),
      pkg("b", "npm", 5_000, 12_000),
    ]);
    const signals = opportunitySignals(r);
    expect(signals).toHaveLength(0);
  });
});

// ── Integration ─────────────────────────────────────────────────

describe("generateInsights", () => {
  it("returns empty array for empty run", () => {
    const signals = generateInsights(run([]));
    expect(signals).toHaveLength(0);
  });

  it("aggregates signals from multiple generators", () => {
    const r = run([
      pkg("dominant", "npm", 900_000),
      pkg("b", "npm", 50_000),
      pkg("c", "pypi", 30_000),
      pkg("d", "pypi", 20_000),
    ]);
    const signals = generateInsights(r);
    // Should have at least concentration (90% in top3) + exposure (npm dominant)
    const categories = new Set(signals.map((s) => s.category));
    expect(categories.has("concentration")).toBe(true);
    expect(categories.has("exposure")).toBe(true);
  });

  it("filters out signals below confidence threshold", () => {
    const signals = generateInsights(run([]));
    for (const s of signals) {
      expect(s.confidence).toBeGreaterThanOrEqual(0.7);
    }
  });
});
