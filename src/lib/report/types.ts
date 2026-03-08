import type { CarePlan } from "@/lib/metamap/types";
import type { PatientProfile } from "@/lib/patient";
import type { AnalysisResult } from "@/lib/metamap/types";

export type ReportPayload = {
  patient: PatientProfile;
  analysisResult: AnalysisResult;
  carePlan: CarePlan;
  generatedAt?: string;
};
