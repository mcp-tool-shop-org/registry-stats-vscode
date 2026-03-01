import type { Run } from "../run-model.js";
import type { ExecutiveSignal } from "./types.js";

interface MomentumEntry {
  name: string;
  registry: string;
  weekly: number;
  delta: number;
}

/**
 * Momentum signal: detects acceleration or deceleration
 * by comparing the weekly download rate against the monthly rate.
 *
 * weeklyRate = lastWeek / 7, monthlyRate = lastMonth / 30
 * delta = (weeklyRate - monthlyRate) / monthlyRate
 *
 * Growers: delta ≥ +0.10 (10% acceleration)
 * Decliners: delta ≤ -0.10 (10% deceleration)
 *
 * Minimum lastWeek ≥ 1000 to filter noise.
 * Confidence: 0.75 (inferred from 2 aggregate windows, not discrete points).
 */
export function momentumSignals(run: Run): ExecutiveSignal[] {
  const candidates = run.packages
    .filter(
      (p) =>
        p.stats?.downloads.lastWeek != null &&
        p.stats?.downloads.lastMonth != null &&
        p.stats.downloads.lastWeek >= 1000 &&
        p.stats.downloads.lastMonth > 0,
    )
    .map((p) => {
      const weekly = p.stats!.downloads.lastWeek!;
      const monthly = p.stats!.downloads.lastMonth!;
      const weeklyRate = weekly / 7;
      const monthlyRate = monthly / 30;
      const delta = (weeklyRate - monthlyRate) / monthlyRate;
      return { name: p.name, registry: p.registry, weekly, delta };
    });

  if (candidates.length === 0) return [];

  const growers = candidates.filter((c) => c.delta >= 0.10);
  const decliners = candidates.filter((c) => c.delta <= -0.10);

  const signals: ExecutiveSignal[] = [];

  // Rank by weekly to determine if any top-5 package is declining
  const byWeekly = [...candidates].sort((a, b) => b.weekly - a.weekly);
  const top5Names = new Set(byWeekly.slice(0, 5).map((p) => p.name));

  if (growers.length > 0) {
    signals.push({
      id: "momentum-growers",
      category: "momentum",
      severity: "low",
      message: `${growers.length} package${growers.length > 1 ? "s" : ""} grew ${"\u2265"}10% over the recent window: ${growers.map((g) => g.name).join(", ")}.`,
      confidence: 0.75,
      supportingData: {
        growers: growers.map((g) => ({
          name: g.name,
          registry: g.registry,
          weeklyDownloads: g.weekly,
          delta: Math.round(g.delta * 1000) / 1000,
        })),
        method: "week-vs-month-proxy",
      },
    });
  }

  if (decliners.length > 0) {
    const hasTopDecliner = decliners.some((d) => top5Names.has(d.name));
    signals.push({
      id: "momentum-decliners",
      category: "momentum",
      severity: hasTopDecliner ? "high" : "moderate",
      message: `${decliners.length} ${hasTopDecliner ? "high-volume " : ""}package${decliners.length > 1 ? "s" : ""} ${decliners.length > 1 ? "are" : "is"} declining: ${decliners.map((d) => d.name).join(", ")}.`,
      confidence: 0.75,
      supportingData: {
        decliners: decliners.map((d) => ({
          name: d.name,
          registry: d.registry,
          weeklyDownloads: d.weekly,
          delta: Math.round(d.delta * 1000) / 1000,
        })),
        hasTopDecliner,
        method: "week-vs-month-proxy",
      },
    });
  }

  return signals;
}
