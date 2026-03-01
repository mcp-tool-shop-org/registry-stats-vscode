import { describe, it, expect, vi, beforeEach } from "vitest";

// Must use vi.hoisted for variables referenced inside vi.mock factories
const { mockReadFile, mockGetConfig } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockGetConfig: vi.fn(),
}));

vi.mock("vscode", () => ({
  Uri: {
    parse: (s: string) => ({ fsPath: s, toString: () => s }),
    joinPath: (_base: unknown, name: string) => ({
      fsPath: `/test/${name}`,
      toString: () => `file:///test/${name}`,
    }),
  },
  workspace: {
    fs: { readFile: (...args: unknown[]) => mockReadFile(...args) },
    workspaceFolders: [
      { uri: { fsPath: "/test", toString: () => "file:///test" } },
    ],
    getConfiguration: () => ({
      get: (key: string, def: unknown) => {
        const overrides = mockGetConfig();
        return overrides[key] ?? def;
      },
    }),
  },
  window: {
    createOutputChannel: () => ({ appendLine: vi.fn() }),
  },
}));

vi.mock("@mcptoolshop/registry-stats", () => ({
  stats: {
    mine: vi.fn(async () => []),
    bulk: vi.fn(async () => []),
  },
  createCache: () => ({ get: vi.fn(), set: vi.fn() }),
}));

vi.mock("https", () => ({
  get: vi.fn(),
  request: vi.fn(),
}));

import { loadPortfolio } from "../src/portfolio.js";

describe("loadPortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no settings configured
    mockGetConfig.mockReturnValue({
      "myPackages.manual": [],
      "myPackages.identities.npm": [],
      "myPackages.identities.vscode": [],
      "myPackages.identities.docker": [],
    });
  });

  it("returns empty when no file and no settings", async () => {
    mockReadFile.mockRejectedValue(new Error("File not found"));
    const result = await loadPortfolio();
    expect(result.refs).toHaveLength(0);
    expect(result.source).toBe("settings");
    expect(result.errors).toHaveLength(0);
  });

  it("parses JSONC file with comments", async () => {
    const jsonc = `{
      // This is a comment
      "version": 1,
      "packages": [
        { "registry": "npm", "name": "express" },
        { "registry": "pypi", "name": "flask" },
      ]
    }`;
    mockReadFile.mockResolvedValue(Buffer.from(jsonc));

    const result = await loadPortfolio();
    expect(result.refs).toHaveLength(2);
    expect(result.source).toBe("file");
    expect(result.refs[0].name).toBe("express");
    expect(result.refs[0].registry).toBe("npm");
    expect(result.refs[1].name).toBe("flask");
    expect(result.refs[1].registry).toBe("pypi");
  });

  it("handles completely broken JSON gracefully", async () => {
    mockReadFile.mockResolvedValue(Buffer.from("not json at all @#$%"));
    const result = await loadPortfolio();
    expect(result).toBeDefined();
    // Should not throw
  });

  it("rejects wrong version", async () => {
    const json = JSON.stringify({ version: 99, packages: [{ registry: "npm", name: "foo" }] });
    mockReadFile.mockResolvedValue(Buffer.from(json));

    const result = await loadPortfolio();
    expect(result.refs).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("version");
  });

  it("ignores unknown registries without crash", async () => {
    const json = JSON.stringify({
      version: 1,
      packages: [
        { registry: "npm", name: "valid" },
        { registry: "bogus", name: "invalid" },
      ],
    });
    mockReadFile.mockResolvedValue(Buffer.from(json));

    const result = await loadPortfolio();
    expect(result.refs).toHaveLength(1);
    expect(result.refs[0].name).toBe("valid");
  });

  it("deduplicates file and settings packages", async () => {
    const json = JSON.stringify({
      version: 1,
      packages: [{ registry: "npm", name: "express" }],
    });
    mockReadFile.mockResolvedValue(Buffer.from(json));

    mockGetConfig.mockReturnValue({
      "myPackages.manual": [
        { registry: "npm", name: "express" },
        { registry: "npm", name: "koa" },
      ],
      "myPackages.identities.npm": [],
      "myPackages.identities.vscode": [],
      "myPackages.identities.docker": [],
    });

    const result = await loadPortfolio();
    const names = result.refs.map((r) => r.name);
    expect(names.filter((n) => n === "express")).toHaveLength(1);
    expect(names).toContain("koa");
    expect(result.source).toBe("merged");
  });

  it("handles empty packages array", async () => {
    const json = JSON.stringify({ version: 1, packages: [] });
    mockReadFile.mockResolvedValue(Buffer.from(json));

    const result = await loadPortfolio();
    expect(result.refs).toHaveLength(0);
  });

  it("skips entries with empty name", async () => {
    const json = JSON.stringify({
      version: 1,
      packages: [
        { registry: "npm", name: "" },
        { registry: "npm", name: "valid" },
      ],
    });
    mockReadFile.mockResolvedValue(Buffer.from(json));

    const result = await loadPortfolio();
    expect(result.refs).toHaveLength(1);
    expect(result.refs[0].name).toBe("valid");
  });

  it("supports all five registries", async () => {
    const json = JSON.stringify({
      version: 1,
      packages: [
        { registry: "npm", name: "a" },
        { registry: "pypi", name: "b" },
        { registry: "nuget", name: "c" },
        { registry: "vscode", name: "d" },
        { registry: "docker", name: "e" },
      ],
    });
    mockReadFile.mockResolvedValue(Buffer.from(json));

    const result = await loadPortfolio();
    expect(result.refs).toHaveLength(5);
    const registries = result.refs.map((r) => r.registry);
    expect(registries).toContain("npm");
    expect(registries).toContain("pypi");
    expect(registries).toContain("nuget");
    expect(registries).toContain("vscode");
    expect(registries).toContain("docker");
  });

  it("returns settings source when only settings exist", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    mockGetConfig.mockReturnValue({
      "myPackages.manual": [{ registry: "npm", name: "from-settings" }],
      "myPackages.identities.npm": [],
      "myPackages.identities.vscode": [],
      "myPackages.identities.docker": [],
    });

    const result = await loadPortfolio();
    expect(result.source).toBe("settings");
    expect(result.refs).toHaveLength(1);
    expect(result.refs[0].name).toBe("from-settings");
  });

  it("returns file source when only file exists", async () => {
    const json = JSON.stringify({
      version: 1,
      packages: [{ registry: "npm", name: "from-file" }],
    });
    mockReadFile.mockResolvedValue(Buffer.from(json));

    const result = await loadPortfolio();
    expect(result.source).toBe("file");
  });
});
