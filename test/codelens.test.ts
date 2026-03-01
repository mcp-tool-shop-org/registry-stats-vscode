import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock vscode
vi.mock("vscode", () => {
  class MockRange {
    constructor(
      public startLine: number,
      public startChar: number,
      public endLine: number,
      public endChar: number,
    ) {}
  }
  class MockCodeLens {
    constructor(public range: MockRange, public command?: unknown) {}
  }
  class MockUri {
    static file(path: string) { return { fsPath: path, toString: () => path }; }
    static joinPath(base: unknown, ...parts: string[]) { return MockUri.file(parts.join("/")); }
  }
  class MockEventEmitter {
    event = vi.fn();
    fire = vi.fn();
    dispose = vi.fn();
  }
  return {
    Range: MockRange,
    CodeLens: MockCodeLens,
    Uri: MockUri,
    EventEmitter: MockEventEmitter,
    window: {
      createOutputChannel: () => ({ appendLine: vi.fn() }),
      showQuickPick: vi.fn(),
      showInformationMessage: vi.fn(),
    },
    workspace: {
      getConfiguration: () => ({
        get: (key: string, def: unknown) => {
          const overrides: Record<string, unknown> = {
            "codeLens.enabled": true,
            "codeLens.maxPerFile": 50,
            "codeLens.showFreshness": true,
            "codeLens.showTrend": true,
            "codeLens.refreshOnSave": false,
          };
          return overrides[key] ?? def;
        },
      }),
      onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
    },
    env: {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    },
    languages: {
      registerCodeLensProvider: vi.fn(),
    },
  };
});

// Import after mock
import { StatsCodeLensProvider } from "../src/codelens.js";
import type { PackageStats } from "@mcptoolshop/registry-stats";

// Minimal mock StatsService
function mockService(results: Record<string, PackageStats | null> = {}) {
  return {
    getStats: vi.fn(async (ref: { name: string }) => results[ref.name] ?? null),
    getBulk: vi.fn(),
    clearCache: vi.fn(),
  } as any;
}

function makeStat(name: string, weekly: number): PackageStats {
  return {
    registry: "npm",
    package: name,
    downloads: { lastWeek: weekly, lastMonth: weekly * 4, lastDay: Math.floor(weekly / 7) },
    fetchedAt: new Date().toISOString(),
  };
}

function mockDocument(content: string) {
  return {
    getText: () => content,
    fileName: "/test/project/package.json",
    uri: { fsPath: "/test/project/package.json", toString: () => "/test/project/package.json" },
  } as any;
}

describe("StatsCodeLensProvider", () => {
  let provider: StatsCodeLensProvider;

  describe("provideCodeLenses", () => {
    it("returns lenses for each dependency", async () => {
      const service = mockService({
        express: makeStat("express", 67_000_000),
        lodash: makeStat("lodash", 45_000_000),
      });
      provider = new StatsCodeLensProvider(service);

      const doc = mockDocument(JSON.stringify({
        name: "test-project",
        dependencies: {
          express: "^4.18.0",
          lodash: "^4.17.21",
        },
      }, null, 2));

      const lenses = await provider.provideCodeLenses(doc);
      expect(lenses.length).toBe(2);

      // First lens should have express stats
      const firstTitle = (lenses[0] as any).command?.title ?? "";
      expect(firstTitle).toContain("67.0M/wk");
      expect(firstTitle).toContain("npm");
    });

    it("returns empty for non-package.json files", async () => {
      const service = mockService();
      provider = new StatsCodeLensProvider(service);

      const doc = {
        getText: () => "{}",
        fileName: "/test/tsconfig.json",
        uri: { fsPath: "/test/tsconfig.json", toString: () => "/test/tsconfig.json" },
      } as any;

      const lenses = await provider.provideCodeLenses(doc);
      expect(lenses.length).toBe(0);
    });

    it("shows cap warning when deps exceed maxPerFile", async () => {
      const service = mockService();
      provider = new StatsCodeLensProvider(service);

      // Create a package.json with 60 deps (exceeds default 50)
      const deps: Record<string, string> = {};
      for (let i = 0; i < 60; i++) deps[`pkg-${i}`] = "^1.0.0";

      const doc = mockDocument(JSON.stringify({
        dependencies: deps,
      }, null, 2));

      const lenses = await provider.provideCodeLenses(doc);
      expect(lenses.length).toBe(1);
      expect((lenses[0] as any).command?.title).toContain("60 deps exceed CodeLens cap");
    });

    it("returns empty when no dependencies", async () => {
      const service = mockService();
      provider = new StatsCodeLensProvider(service);

      const doc = mockDocument(JSON.stringify({ name: "empty", version: "1.0.0" }, null, 2));

      const lenses = await provider.provideCodeLenses(doc);
      expect(lenses.length).toBe(0);
    });

    it("deduplicates across dependency sections", async () => {
      const service = mockService({
        express: makeStat("express", 67_000_000),
      });
      provider = new StatsCodeLensProvider(service);

      const doc = mockDocument(JSON.stringify({
        dependencies: { express: "^4.18.0" },
        devDependencies: { express: "^4.18.0" },
      }, null, 2));

      const lenses = await provider.provideCodeLenses(doc);
      expect(lenses.length).toBe(1);
    });

    it("shows Unavailable for failed fetches", async () => {
      const service = mockService({ express: null });
      provider = new StatsCodeLensProvider(service);

      const doc = mockDocument(JSON.stringify({
        dependencies: { express: "^4.18.0" },
      }, null, 2));

      const lenses = await provider.provideCodeLenses(doc);
      expect(lenses.length).toBe(1);
      expect((lenses[0] as any).command?.title).toContain("Unavailable");
    });

    it("includes freshness when showFreshness is on", async () => {
      const service = mockService({
        express: makeStat("express", 67_000_000),
      });
      provider = new StatsCodeLensProvider(service);

      const doc = mockDocument(JSON.stringify({
        dependencies: { express: "^4.18.0" },
      }, null, 2));

      const lenses = await provider.provideCodeLenses(doc);
      const title = (lenses[0] as any).command?.title ?? "";
      expect(title).toContain("just now");
    });
  });

  describe("refresh", () => {
    it("clears session cache and fires event", () => {
      const service = mockService();
      provider = new StatsCodeLensProvider(service);
      provider.refresh();
      // The EventEmitter.fire should have been called
      expect((provider as any)._onDidChangeCodeLenses.fire).toHaveBeenCalled();
    });
  });
});
