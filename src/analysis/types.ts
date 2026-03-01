export type SignalCategory = "concentration" | "momentum" | "exposure" | "opportunity";
export type Severity = "low" | "moderate" | "high";

export interface ExecutiveSignal {
  id: string;
  category: SignalCategory;
  severity: Severity;
  message: string;
  confidence: number;
  supportingData: Record<string, unknown>;
}
