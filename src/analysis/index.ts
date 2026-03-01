import type { Run } from "../run-model.js";
import type { ExecutiveSignal } from "./types.js";
import { concentrationSignals } from "./concentration.js";
import { momentumSignals } from "./momentum.js";
import { exposureSignals } from "./exposure.js";
import { opportunitySignals } from "./opportunity.js";

export type { ExecutiveSignal, SignalCategory, Severity } from "./types.js";

const MIN_CONFIDENCE = 0.7;

/**
 * Generate all executive insights from a completed Run.
 * Returns only signals with confidence ≥ 0.7.
 */
export function generateInsights(run: Run): ExecutiveSignal[] {
  const signals: ExecutiveSignal[] = [
    ...concentrationSignals(run),
    ...momentumSignals(run),
    ...exposureSignals(run),
    ...opportunitySignals(run),
  ];
  return signals.filter((s) => s.confidence >= MIN_CONFIDENCE);
}
