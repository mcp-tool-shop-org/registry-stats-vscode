import * as vscode from "vscode";
import { parse as parseJsonc } from "jsonc-parser";
import { stats } from "@mcptoolshop/registry-stats";
import type { RegistryName } from "@mcptoolshop/registry-stats";
import { getConfig } from "./config.js";
import { log } from "./util.js";
import type { PkgRef } from "./scanner.js";
import * as https from "https";

// ── Types ───────────────────────────────────────────────────────

export interface PortfolioFile {
  version: 1;
  packages?: Array<{ registry: string; name: string }>;
  identities?: {
    npm?: string[];
    vscode?: string[];
    docker?: string[];
  };
}

export interface PortfolioResult {
  refs: PkgRef[];
  source: "file" | "settings" | "merged";
  identityPackages: number;
  errors: Array<{ identity: string; registry: string; message: string }>;
}

const VALID_REGISTRIES = new Set<string>(["npm", "pypi", "nuget", "vscode", "docker"]);
const PORTFOLIO_URI = vscode.Uri.parse("portfolio://my-packages");

// ── Public API ──────────────────────────────────────────────────

export async function loadPortfolio(): Promise<PortfolioResult> {
  const fileResult = await loadPortfolioFile();
  const settingsResult = loadPortfolioSettings();

  const hasFile = fileResult.packages.length > 0 || fileResult.identities.length > 0;
  const hasSettings = settingsResult.packages.length > 0 || settingsResult.identities.length > 0;

  const source: PortfolioResult["source"] = hasFile && hasSettings
    ? "merged"
    : hasFile ? "file" : "settings";

  // Merge explicit packages (file wins on collision)
  const seen = new Map<string, PkgRef>();
  for (const ref of fileResult.packages) {
    seen.set(`${ref.registry}:${ref.name}`, ref);
  }
  for (const ref of settingsResult.packages) {
    const key = `${ref.registry}:${ref.name}`;
    if (!seen.has(key)) seen.set(key, ref);
  }

  // Merge identities (union, dedup)
  const allIdentities = mergeIdentities(fileResult.identities, settingsResult.identities);

  // Resolve identities
  const { refs: identityRefs, errors } = await resolveIdentities(allIdentities);
  const identityPackages = identityRefs.length;

  // Merge identity-resolved into explicit (explicit wins)
  for (const ref of identityRefs) {
    const key = `${ref.registry}:${ref.name}`;
    if (!seen.has(key)) seen.set(key, ref);
  }

  return {
    refs: [...seen.values()],
    source,
    identityPackages,
    errors: [...fileResult.errors, ...errors],
  };
}

// ── File Loader ─────────────────────────────────────────────────

interface LoadResult {
  packages: PkgRef[];
  identities: IdentityEntry[];
  errors: PortfolioResult["errors"];
}

async function loadPortfolioFile(): Promise<LoadResult> {
  const empty: LoadResult = { packages: [], identities: [], errors: [] };
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return empty;

  const fileUri = vscode.Uri.joinPath(folders[0].uri, "registry-stats.portfolio.json");
  let raw: string;
  try {
    const bytes = await vscode.workspace.fs.readFile(fileUri);
    raw = Buffer.from(bytes).toString("utf-8");
  } catch {
    return empty; // File doesn't exist — not an error
  }

  const parseErrors: { error: number; offset: number; length: number }[] = [];
  const parsed = parseJsonc(raw, parseErrors, { allowTrailingComma: true });

  if (parseErrors.length > 0) {
    log(`Portfolio file has ${parseErrors.length} parse warning(s)`);
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      ...empty,
      errors: [{ identity: "file", registry: "", message: "Portfolio file is not a valid JSON object" }],
    };
  }

  const file = parsed as PortfolioFile;

  if (file.version !== 1) {
    return {
      ...empty,
      errors: [{ identity: "file", registry: "", message: `Unsupported portfolio version: ${file.version}` }],
    };
  }

  return {
    packages: validatePackages(file.packages ?? []),
    identities: extractIdentities(file.identities),
    errors: [],
  };
}

// ── Settings Loader ─────────────────────────────────────────────

function loadPortfolioSettings(): LoadResult {
  const config = getConfig().myPackages;
  return {
    packages: validatePackages(config.manual),
    identities: extractIdentities({
      npm: config.identities.npm,
      vscode: config.identities.vscode,
      docker: config.identities.docker,
    }),
    errors: [],
  };
}

// ── Validation ──────────────────────────────────────────────────

function validatePackages(entries: Array<{ registry: string; name: string }>): PkgRef[] {
  const refs: PkgRef[] = [];
  for (const entry of entries) {
    if (!entry.name || typeof entry.name !== "string") continue;
    if (!VALID_REGISTRIES.has(entry.registry)) {
      log(`Ignoring unknown registry "${entry.registry}" for package "${entry.name}"`);
      continue;
    }
    refs.push({
      registry: entry.registry as RegistryName,
      name: entry.name,
      file: PORTFOLIO_URI,
    });
  }
  return refs;
}

// ── Identity Resolution ─────────────────────────────────────────

interface IdentityEntry {
  registry: "npm" | "vscode" | "docker";
  username: string;
}

function extractIdentities(
  ids?: { npm?: string[]; vscode?: string[]; docker?: string[] },
): IdentityEntry[] {
  if (!ids) return [];
  const entries: IdentityEntry[] = [];
  for (const u of ids.npm ?? []) entries.push({ registry: "npm", username: u });
  for (const u of ids.vscode ?? []) entries.push({ registry: "vscode", username: u });
  for (const u of ids.docker ?? []) entries.push({ registry: "docker", username: u });
  return entries;
}

function mergeIdentities(a: IdentityEntry[], b: IdentityEntry[]): IdentityEntry[] {
  const seen = new Set<string>();
  const merged: IdentityEntry[] = [];
  for (const entry of [...a, ...b]) {
    const key = `${entry.registry}:${entry.username}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(entry);
  }
  return merged;
}

async function resolveIdentities(
  identities: IdentityEntry[],
): Promise<{ refs: PkgRef[]; errors: PortfolioResult["errors"] }> {
  const refs: PkgRef[] = [];
  const errors: PortfolioResult["errors"] = [];

  const promises = identities.map(async (id) => {
    try {
      let resolved: PkgRef[];
      switch (id.registry) {
        case "npm":
          resolved = await resolveNpmIdentity(id.username);
          break;
        case "vscode":
          resolved = await resolveVscodeIdentity(id.username);
          break;
        case "docker":
          resolved = await resolveDockerIdentity(id.username);
          break;
        default:
          resolved = [];
      }
      log(`Resolved ${id.registry}/${id.username}: ${resolved.length} packages`);
      refs.push(...resolved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`Identity resolution failed: ${id.registry}/${id.username}: ${msg}`);
      errors.push({ identity: id.username, registry: id.registry, message: msg });
    }
  });

  await Promise.allSettled(promises);
  return { refs, errors };
}

// ── npm Identity ────────────────────────────────────────────────

async function resolveNpmIdentity(username: string): Promise<PkgRef[]> {
  const results = await stats.mine(username);
  return results.map((s) => ({
    registry: "npm" as RegistryName,
    name: s.package,
    file: PORTFOLIO_URI,
  }));
}

// ── VS Code Marketplace Identity ────────────────────────────────

async function resolveVscodeIdentity(publisher: string): Promise<PkgRef[]> {
  const body = JSON.stringify({
    filters: [{
      criteria: [{ filterType: 4, value: publisher }],
      pageSize: 100,
      pageNumber: 1,
    }],
    flags: 914,
  });

  const data = await httpsPost(
    "marketplace.visualstudio.com",
    "/_apis/public/gallery/extensionquery",
    body,
    { "Content-Type": "application/json", "Accept": "application/json;api-version=6.0-preview.1" },
  );

  const parsed = JSON.parse(data);
  const extensions = parsed?.results?.[0]?.extensions ?? [];
  return extensions.map((ext: { publisher: { publisherName: string }; extensionName: string }) => ({
    registry: "vscode" as RegistryName,
    name: `${ext.publisher.publisherName}.${ext.extensionName}`,
    file: PORTFOLIO_URI,
  }));
}

// ── Docker Hub Identity ─────────────────────────────────────────

async function resolveDockerIdentity(namespace: string): Promise<PkgRef[]> {
  const data = await httpsGet(
    `https://hub.docker.com/v2/repositories/${encodeURIComponent(namespace)}/?page_size=100`,
  );
  const parsed = JSON.parse(data);
  const repos = parsed?.results ?? [];
  return repos.map((r: { name: string }) => ({
    registry: "docker" as RegistryName,
    name: `${namespace}/${r.name}`,
    file: PORTFOLIO_URI,
  }));
}

// ── HTTP Helpers ────────────────────────────────────────────────

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15_000 }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
  });
}

function httpsPost(
  hostname: string,
  path: string,
  body: string,
  headers: Record<string, string>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: "POST", headers: { ...headers, "Content-Length": Buffer.byteLength(body) }, timeout: 15_000 },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    req.write(body);
    req.end();
  });
}
