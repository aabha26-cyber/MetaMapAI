export type AnalysisSource = "manual" | "image" | "csv" | "pdf";

export type RiskLabel = "Low" | "Moderate" | "High" | "Critical";

export type AnalysisMetric = {
  label: string;
  value: number;
};

export type AnalysisResult = {
  analysisId: string;
  sourceType: AnalysisSource;
  fileName?: string;
  riskLevel: 1 | 2 | 3 | 4;
  riskLabel: RiskLabel;
  probability: number;
  confidence: number;
  predictedOrgans: string[];
  summary: string;
  findings: string[];
  metrics: AnalysisMetric[];
  extractedText?: string;
  createdAt: string;
};

export type CarePlan = {
  urgency: "routine" | "expedited" | "urgent";
  patientActions: string[];
  clinicianActions: string[];
  followUpWindow: string;
  disclaimer: string;
};
