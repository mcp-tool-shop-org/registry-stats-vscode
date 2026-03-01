import type { Run } from "../run-model.js";
import type { ExecutiveSignal } from "./types.js";

/**
 * Opportunity signal: finds non-top-3 packages that are
 * accelerating (≥ 15% growth, weekly ≥ 500).
 *
 * Excludes top 3 by weekly downloads — those belong in concentration.
 * Uses the same week-vs-month proxy as momentum.
 */
export function opportunitySignals(run: Run): ExecutiveSignal[] {
  const withData = run.packages
    .filter(
      (p) =>
        p.stats?.downloads.lastWeek != null &&
        p.stats?.downloads.lastMonth != null &&
        p.stats.downloads.lastWeek >= 500 &&
        p.stats.downloads.lastMonth > 0,
    )
    .map((p) => {
      const weekly = p.stats!.downloads.lastWeek!;
      const monthly = p.stats!.downloads.lastMonth!;
      const weeklyRate = weekly / 7;
      const monthlyRate = monthly / 30;
      const delta = (weeklyRate - monthlyRate) / monthlyRate;
      return { name: p.name, registry: p.registry, weekly, delta };
    })
    .sort((a, b) => b.weekly - a.weekly);

  if (withData.length < 4) return [];

  // Exclude top 3
  const nonTop = withData.slice(3);
  const accelerating = nonTop.filter((p) => p.delta >= 0.15);

  if (accelerating.length === 0) return [];

  const signals: ExecutiveSignal[] = [];

  for (const pkg of accelerating) {
    const pct = Math.round(pkg.delta * 100);
    signals.push({
      id: `opportunity-${pkg.name}`,
      category: "opportunity",
      severity: "low",
      message: `${pkg.name} is a mid-tier package accelerating (+${pct}%).`,
      confidence: 0.75,
      supportingData: {
        packageName: pkg.name,
        registry: pkg.registry,
        weeklyDownloads: pkg.weekly,
        growthDelta: Math.round(pkg.delta * 1000) / 1000,
        method: "week-vs-month-proxy",
      },
    });
  }

  return signals;
}
