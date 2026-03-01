import * as vscode from "vscode";
import { stats, createCache } from "@mcptoolshop/registry-stats";
import type { PackageStats, RegistryName, StatsCache } from "@mcptoolshop/registry-stats";
import { getConfig, getTtlMs } from "./config.js";
import { log } from "./util.js";
import type { PkgRef } from "./scanner.js";

interface CachedEntry {
  data: PackageStats;
  cachedAt: number;
}

export class StatsService {
  private memCache: StatsCache;
  private globalState: vscode.Memento;
  private inflight = new Map<string, Promise<PackageStats | null>>();

  constructor(globalState: vscode.Memento) {
    this.globalState = globalState;
    this.memCache = createCache();
  }

  async getStats(ref: PkgRef, opts?: { force?: boolean }): Promise<PackageStats | null> {
    const key = cacheKey(ref.registry, ref.name);

    // Check persistent cache (unless forced)
    if (!opts?.force) {
      const cached = this.globalState.get<CachedEntry>(key);
      if (cached) {
        const ttl = getTtlMs(ref.registry);
        const age = Date.now() - cached.cachedAt;
        if (age < ttl) {
          return cached.data;
        }
        // Stale — return stale data and refresh in background
        this.refreshInBackground(ref);
        return cached.data;
      }
    }

    return this.fetchAndCache(ref);
  }

  async getBulk(refs: PkgRef[]): Promise<Map<string, PackageStats | null>> {
    const results = new Map<string, PackageStats | null>();
    const config = getConfig();

    // Group by registry for bulk fetch
    const byRegistry = new Map<RegistryName, PkgRef[]>();
    for (const ref of refs) {
      if (!config.enabledRegistries.includes(ref.registry)) continue;
      const group = byRegistry.get(ref.registry) ?? [];
      group.push(ref);
      byRegistry.set(ref.registry, group);
    }

    const promises: Promise<void>[] = [];
    for (const [registry, group] of byRegistry) {
      promises.push(
        this.fetchBulkRegistry(registry, group, results),
      );
    }

    await Promise.allSettled(promises);
    return results;
  }

  clearCache(): void {
    this.memCache = createCache();
    // Clear globalState entries
    for (const key of this.globalState.keys()) {
      if (key.startsWith("stats:")) {
        this.globalState.update(key, undefined);
      }
    }
    log("Cache cleared.");
  }

  private async fetchBulkRegistry(
    registry: RegistryName,
    refs: PkgRef[],
    results: Map<string, PackageStats | null>,
  ): Promise<void> {
    const config = getConfig();
    const names = refs.map((r) => r.name);
    const opts = {
      cache: this.memCache,
      cacheTtlMs: getTtlMs(registry),
      concurrency: config.maxConcurrentRequests,
      ...(config.dockerToken ? { dockerToken: config.dockerToken } : {}),
    };

    try {
      const bulkResults = await stats.bulk(registry, names, opts);
      for (let i = 0; i < refs.length; i++) {
        const result = bulkResults[i];
        const key = cacheKey(registry, refs[i].name);
        results.set(key, result);
        if (result) {
          this.persistToGlobalState(key, result);
        }
      }
    } catch (err) {
      log(`Bulk fetch failed for ${registry}: ${err}`);
      // Fall back to individual fetches
      for (const ref of refs) {
        try {
          const result = await this.fetchAndCache(ref);
          results.set(cacheKey(registry, ref.name), result);
        } catch {
          results.set(cacheKey(registry, ref.name), null);
        }
      }
    }
  }

  private async fetchAndCache(ref: PkgRef): Promise<PackageStats | null> {
    const key = cacheKey(ref.registry, ref.name);

    // Deduplicate in-flight requests
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = this.doFetch(ref, key);
    this.inflight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.inflight.delete(key);
    }
  }

  private async doFetch(ref: PkgRef, key: string): Promise<PackageStats | null> {
    const config = getConfig();
    const opts = {
      cache: this.memCache,
      cacheTtlMs: getTtlMs(ref.registry),
      ...(config.dockerToken ? { dockerToken: config.dockerToken } : {}),
    };

    try {
      log(`Fetching ${ref.registry}/${ref.name}...`);
      const result = await stats(ref.registry, ref.name, opts);
      if (result) {
        this.persistToGlobalState(key, result);
      }
      return result;
    } catch (err) {
      log(`Fetch error ${ref.registry}/${ref.name}: ${err}`);
      return null;
    }
  }

  private refreshInBackground(ref: PkgRef): void {
    const key = cacheKey(ref.registry, ref.name);
    if (this.inflight.has(key)) return;
    this.fetchAndCache(ref).catch(() => {});
  }

  private persistToGlobalState(key: string, data: PackageStats): void {
    const entry: CachedEntry = { data, cachedAt: Date.now() };
    this.globalState.update(key, entry);
  }
}

function cacheKey(registry: string, name: string): string {
  return `stats:${registry}:${name}`;
}
