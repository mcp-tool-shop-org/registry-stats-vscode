import type { Run } from "../run-model.js";
import type { ExecutiveSignal } from "./types.js";

/**
 * Concentration signal: how much of total weekly downloads
 * are concentrated in the top 3 packages.
 *
 * ≥ 80% → high, 65–80% → moderate, < 65% → no signal.
 * Requires at least 4 packages with weekly data to be meaningful.
 */
export function concentrationSignals(run: Run): ExecutiveSignal[] {
  const withWeekly = run.packages
    .filter((p) => p.stats?.downloads.lastWeek != null)
    .map((p) => ({
      name: p.name,
      weekly: p.stats!.downloads.lastWeek!,
    }))
    .sort((a, b) => b.weekly - a.weekly);

  if (withWeekly.length < 4) return [];

  const totalWeekly = withWeekly.reduce((sum, p) => sum + p.weekly, 0);
  if (totalWeekly === 0) return [];

  const top3 = withWeekly.slice(0, 3);
  const top3Sum = top3.reduce((sum, p) => sum + p.weekly, 0);
  const top3Share = top3Sum / totalWeekly;

  if (top3Share < 0.65) return [];

  const severity = top3Share >= 0.80 ? "high" : "moderate";
  const pct = Math.round(top3Share * 100);

  return [
    {
      id: "concentration-top3",
      category: "concentration",
      severity,
      message: `${pct}% of weekly downloads concentrate in ${top3.length} packages: ${top3.map((p) => p.name).join(", ")}.`,
      confidence: 1.0,
      supportingData: {
        top3Names: top3.map((p) => p.name),
        top3Share: Math.round(top3Share * 1000) / 1000,
        totalWeekly,
        totalPackages: withWeekly.length,
      },
    },
  ];
}
