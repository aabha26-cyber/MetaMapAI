import type { AnalysisResult, AnalysisSource, CarePlan, RiskLabel } from "./types";

const ORGAN_PRIORITY = [
  "bone",
  "liver",
  "lung",
  "brain",
  "lymph nodes",
  "soft tissue",
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 1) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

export function riskLevelToLabel(riskLevel: number): RiskLabel {
  if (riskLevel <= 1) return "Low";
  if (riskLevel === 2) return "Moderate";
  if (riskLevel === 3) return "High";
  return "Critical";
}

export function inferOrgans(seedText: string, riskLevel: number) {
  const text = seedText.toLowerCase();
  const matches = ORGAN_PRIORITY.filter((organ) => text.includes(organ));

  if (matches.length > 0) {
    return matches.slice(0, 3);
  }

  if (riskLevel >= 4) return ["bone", "liver", "lung"];
  if (riskLevel === 3) return ["lung", "liver"];
  if (riskLevel === 2) return ["lymph nodes"];
  return ["localized / low spread signal"];
}

export function createAnalysisResult(args: {
  sourceType: AnalysisSource;
  fileName?: string;
  score: number;
  summary: string;
  findings: string[];
  metrics: { label: string; value: number }[];
  extractedText?: string;
  organSeed?: string;
}) : AnalysisResult {
  const normalizedScore = clamp(args.score, 0, 1);
  const riskLevel = (normalizedScore >= 0.84
    ? 4
    : normalizedScore >= 0.62
      ? 3
      : normalizedScore >= 0.38
        ? 2
        : 1) as 1 | 2 | 3 | 4;

  const probability = round(normalizedScore * 100, 1);
  const confidence = round(clamp(0.62 + normalizedScore * 0.3, 0.62, 0.96) * 100, 1);

  return {
    analysisId: `ANA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    sourceType: args.sourceType,
    fileName: args.fileName,
    riskLevel,
    riskLabel: riskLevelToLabel(riskLevel),
    probability,
    confidence,
    predictedOrgans: inferOrgans(
      `${args.summary} ${args.organSeed ?? ""} ${args.extractedText ?? ""}`,
      riskLevel,
    ),
    summary: args.summary,
    findings: args.findings,
    metrics: args.metrics.map((metric) => ({
      label: metric.label,
      value: round(metric.value, 1),
    })),
    extractedText: args.extractedText,
    createdAt: new Date().toISOString(),
  };
}

export function deriveCarePlan(result: AnalysisResult): CarePlan {
  const urgency =
    result.riskLevel >= 4
      ? "urgent"
      : result.riskLevel === 3
        ? "expedited"
        : "routine";

  const patientActions =
    result.riskLevel >= 3
      ? [
          "Arrange an oncology follow-up within the next 7 days.",
          "Bring prior imaging, pathology, and medication history to the visit.",
          "Track any new pain, weight loss, neurologic symptoms, or breathing changes.",
        ]
      : [
          "Review the report with your care team before making treatment decisions.",
          "Maintain a symptom diary and note any meaningful changes.",
          "Continue routine screening and preventive care.",
        ];

  const clinicianActions =
    result.riskLevel >= 3
      ? [
          "Review the uploaded source and correlate with current imaging and pathology.",
          "Consider targeted imaging for predicted organ sites if clinically appropriate.",
          "Confirm risk with specialist review before escalating treatment.",
        ]
      : [
          "Validate the source material and compare with current clinical history.",
          "Use the result as decision support rather than diagnosis.",
          "Schedule standard interval follow-up if no higher-risk clinical signals are present.",
        ];

  return {
    urgency,
    patientActions,
    clinicianActions,
    followUpWindow:
      result.riskLevel >= 4
        ? "24-72 hours"
        : result.riskLevel === 3
          ? "Within 7 days"
          : result.riskLevel === 2
            ? "Within 2-4 weeks"
            : "Routine follow-up",
    disclaimer:
      "This AI system provides risk estimation only and does not replace medical diagnosis.",
  };
}

export function scoreManualInputs(input: Record<string, number>) {
  const values = Object.values(input).filter((value) => Number.isFinite(value));
  const average = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

  const normalized = clamp(average / 10, 0, 1);

  return createAnalysisResult({
    sourceType: "manual",
    score: normalized,
    summary:
      normalized >= 0.62
        ? "Manual parameters indicate a concentrated cluster of higher-risk morphology markers."
        : "Manual parameters suggest a lower-risk morphology profile, though clinical review is still recommended.",
    findings: [
      `Average normalized feature score: ${round(normalized * 100, 1)}%.`,
      normalized >= 0.62
        ? "Margin, concavity, and symmetry inputs are elevated compared with the demo baseline."
        : "No dominant feature exceeded the high-risk threshold in the demo model.",
    ],
    metrics: Object.entries(input).map(([label, value]) => ({ label, value })),
  });
}

export function scoreCsvContent(fileName: string, content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rowCount = Math.max(lines.length - 1, 0);
  const numericTokens = content.match(/-?\d+(\.\d+)?/g) ?? [];
  const numericAverage =
    numericTokens.length > 0
      ? numericTokens.reduce((sum, token) => sum + Number(token), 0) / numericTokens.length
      : 0;
  const malignantMentions = (content.match(/malignan|positive|high-risk/gi) ?? []).length;

  const score = clamp(
    rowCount > 0
      ? numericAverage / 100 + malignantMentions / Math.max(rowCount, 1)
      : 0.15,
    0.08,
    0.96,
  );

  return createAnalysisResult({
    sourceType: "csv",
    fileName,
    score,
    summary:
      rowCount > 1
        ? `Batch analysis processed ${rowCount} records and summarized the dataset-level risk pattern.`
        : "Dataset parsing succeeded, but the file appears too small for a confident batch summary.",
    findings: [
      `Rows processed: ${rowCount}.`,
      `Risk-coded terms identified: ${malignantMentions}.`,
      "CSV analysis uses a demo aggregation model intended for workflow validation.",
    ],
    metrics: [
      { label: "Rows", value: rowCount },
      { label: "Risk terms", value: malignantMentions },
      { label: "Avg feature", value: round(numericAverage, 1) },
    ],
    organSeed: content,
  });
}

export function scoreTextDocument(args: {
  sourceType: "pdf" | "image";
  fileName?: string;
  text: string;
}) {
  const text = args.text.trim();
  const textLower = text.toLowerCase();
  const riskTerms = [
    "metastasis",
    "lesion",
    "progression",
    "invasion",
    "malignant",
    "nodal",
    "osseous",
    "hepatic",
    "pulmonary",
    "brain",
  ];
  const reassuringTerms = [
    "benign",
    "stable",
    "no evidence",
    "negative",
    "unchanged",
    "mild",
  ];

  const riskHits = riskTerms.reduce(
    (count, term) => count + (textLower.includes(term) ? 1 : 0),
    0,
  );
  const reassuringHits = reassuringTerms.reduce(
    (count, term) => count + (textLower.includes(term) ? 1 : 0),
    0,
  );

  const density = clamp(text.length / 3000, 0.05, 0.45);
  const score = clamp(0.25 + riskHits * 0.09 - reassuringHits * 0.05 + density, 0.08, 0.98);

  return createAnalysisResult({
    sourceType: args.sourceType,
    fileName: args.fileName,
    score,
    summary:
      riskHits > reassuringHits
        ? "The uploaded document includes multiple high-risk oncology terms that warrant expedited clinician review."
        : "The uploaded document has a mixed signal profile with limited explicit high-risk language.",
    findings: [
      `High-risk language hits: ${riskHits}.`,
      `Reassuring language hits: ${reassuringHits}.`,
      text
        ? `Text excerpt: ${text.slice(0, 180).replace(/\s+/g, " ")}${text.length > 180 ? "..." : ""}`
        : "No text could be extracted from the document.",
    ],
    metrics: [
      { label: "Risk terms", value: riskHits },
      { label: "Reassuring terms", value: reassuringHits },
      { label: "Chars extracted", value: text.length },
    ],
    extractedText: text.slice(0, 1200),
    organSeed: text,
  });
}
