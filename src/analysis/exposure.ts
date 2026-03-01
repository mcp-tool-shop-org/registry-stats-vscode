import type { Run } from "../run-model.js";
import type { ExecutiveSignal } from "./types.js";

/**
 * Registry exposure signal: how concentrated weekly downloads
 * are across registries.
 *
 * Single registry > 80% → high
 * Top 2 registries > 90% → moderate
 * Otherwise → no signal
 *
 * Requires at least 2 registries to be meaningful.
 */
export function exposureSignals(run: Run): ExecutiveSignal[] {
  const perRegistry: Record<string, number> = {};

  for (const pkg of run.packages) {
    const weekly = pkg.stats?.downloads.lastWeek;
    if (weekly == null) continue;
    perRegistry[pkg.registry] = (perRegistry[pkg.registry] ?? 0) + weekly;
  }

  const registries = Object.entries(perRegistry).sort(([, a], [, b]) => b - a);
  if (registries.length < 2) return [];

  const total = registries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return [];

  const topShare = registries[0][1] / total;
  const top2Share = (registries[0][1] + registries[1][1]) / total;

  const shares: Record<string, number> = {};
  for (const [reg, val] of registries) {
    shares[reg] = Math.round((val / total) * 1000) / 1000;
  }

  if (topShare > 0.80) {
    const pct = Math.round(topShare * 100);
    return [
      {
        id: "exposure-single-registry",
        category: "exposure",
        severity: "high",
        message: `${pct}% of weekly downloads originate from ${registries[0][0]}.`,
        confidence: 1.0,
        supportingData: {
          dominantRegistry: registries[0][0],
          dominantShare: Math.round(topShare * 1000) / 1000,
          registryShares: shares,
        },
      },
    ];
  }

  if (top2Share > 0.90) {
    const pct = Math.round(top2Share * 100);
    return [
      {
        id: "exposure-dual-registry",
        category: "exposure",
        severity: "moderate",
        message: `${pct}% of weekly downloads come from ${registries[0][0]} and ${registries[1][0]}.`,
        confidence: 1.0,
        supportingData: {
          topRegistries: [registries[0][0], registries[1][0]],
          combinedShare: Math.round(top2Share * 1000) / 1000,
          registryShares: shares,
        },
      },
    ];
  }

  return [];
}
