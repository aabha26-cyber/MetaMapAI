"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  FeatureMetricsChart,
  OrganFocusChart,
} from "@/components/analysis-charts";
import { PageShell } from "@/components/page-shell";
import { RiskBadge } from "@/components/risk-badge";
import type { AnalysisResult, CarePlan } from "@/lib/metamap/types";
import {
  ANALYSIS_STORAGE_KEY,
  PATIENT_STORAGE_KEY,
  type PatientProfile,
} from "@/lib/patient";
import type { ReportPayload } from "@/lib/report/types";

type ManualInputs = {
  meanRadius: number;
  meanTexture: number;
  meanPerimeter: number;
  meanArea: number;
  meanConcavity: number;
  meanSymmetry: number;
};

const manualDefaults: ManualInputs = {
  meanRadius: 5.4,
  meanTexture: 4.9,
  meanPerimeter: 5.5,
  meanArea: 5.2,
  meanConcavity: 4.4,
  meanSymmetry: 4.8,
};

const organColors = ["#d4af37", "#10b981", "#3b82f6", "#f97316", "#8b5cf6"];

function buildPayload(
  patient: PatientProfile,
  analysisResult: AnalysisResult,
  carePlan: CarePlan,
): ReportPayload {
  return {
    patient,
    analysisResult,
    carePlan,
    generatedAt: new Date().toISOString(),
  };
}

function fileRoute(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return "/api/metamap/predict-pdf";
  }

  if (type.includes("csv") || name.endsWith(".csv")) {
    return "/api/metamap/predict-batch";
  }

  return "/api/metamap/predict-image";
}

export default function MetaMapPage() {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [manualInputs, setManualInputs] = useState<ManualInputs>(manualDefaults);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  useEffect(() => {
    const storedPatient = localStorage.getItem(PATIENT_STORAGE_KEY);
    const storedResult = localStorage.getItem(ANALYSIS_STORAGE_KEY);

    if (storedPatient) {
      setPatient(JSON.parse(storedPatient));
    }

    if (storedResult) {
      setAnalysisResult(JSON.parse(storedResult));
    }
  }, []);

  useEffect(() => {
    async function hydrateCarePlan() {
      if (!analysisResult) {
        setCarePlan(null);
        return;
      }

      try {
        const response = await fetch("/api/metamap/care-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisResult }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to create care plan.");
        }

        setCarePlan(data.carePlan);
      } catch (requestError) {
        console.error(requestError);
        setCarePlan(null);
      }
    }

    hydrateCarePlan();
  }, [analysisResult]);

  const organChartData = useMemo(() => {
    if (!analysisResult) {
      return [];
    }

    return analysisResult.predictedOrgans.map((organ, index) => ({
      name: organ,
      value: Math.max(40 - index * 9, 12),
      color: organColors[index % organColors.length],
    }));
  }, [analysisResult]);

  async function persistResult(result: AnalysisResult) {
    setAnalysisResult(result);
    localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(result));
  }

  async function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("Running manual risk estimate...");
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/metamap/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualInputs),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Manual prediction failed.");
      }
      await persistResult(data.result);
      setStatus("Manual analysis completed.");
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Manual analysis failed.",
      );
      setStatus(null);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleFileAnalysis() {
    if (!selectedFile) {
      setError("Choose an image, CSV, or PDF before running analysis.");
      return;
    }

    setError(null);
    setStatus(`Analyzing ${selectedFile.name}...`);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(fileRoute(selectedFile), {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "File analysis failed.");
      }

      await persistResult(data.result);
      setStatus(`${selectedFile.name} analyzed successfully.`);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "File analysis failed.",
      );
      setStatus(null);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function downloadReport() {
    if (!patient || !analysisResult || !carePlan) {
      setError("Complete registration and one analysis before generating a report.");
      return;
    }

    setError(null);
    setIsGeneratingReport(true);
    setStatus("Generating PDF report...");

    try {
      const response = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(patient, analysisResult, carePlan)),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate report.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${patient.patientId}-risk-report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Report downloaded.");
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Report generation failed.",
      );
      setStatus(null);
    } finally {
      setIsGeneratingReport(false);
    }
  }

  async function emailReport() {
    if (!patient || !analysisResult || !carePlan) {
      setError("Complete registration and one analysis before sending email.");
      return;
    }

    setError(null);
    setIsEmailing(true);
    setStatus(`Emailing report to ${patient.email}...`);

    try {
      const response = await fetch("/api/report/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(patient, analysisResult, carePlan)),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to email report.");
      }

      setStatus(data.message || `Report sent to ${patient.email}.`);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Email send failed.",
      );
      setStatus(null);
    } finally {
      setIsEmailing(false);
    }
  }

  return (
    <PageShell maxWidthClassName="max-w-6xl">
      <div className="grid gap-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card-premium p-6">
            <div className="section-title">Step 2 of 3</div>
            <h1 className="font-display text-4xl text-[var(--text-primary)]">
              Analysis and report workspace
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
              Run a demo risk analysis from manual inputs or a supported file
              type, review the result, and then generate a PDF report and email
              it directly to the registered patient.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <span className="rounded-full border border-[var(--border-subtle)] px-3 py-2">
                Manual
              </span>
              <span className="rounded-full border border-[var(--border-subtle)] px-3 py-2">
                JPEG / PNG / BMP / WebP
              </span>
              <span className="rounded-full border border-[var(--border-subtle)] px-3 py-2">
                CSV dataset
              </span>
              <span className="rounded-full border border-[var(--border-subtle)] px-3 py-2">
                PDF document
              </span>
            </div>
          </div>

          <div className="card-premium p-6">
            <div className="section-title">Patient context</div>
            {patient ? (
              <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-[var(--text-primary)]">
                      {patient.fullName}
                    </div>
                    <div>{patient.email}</div>
                  </div>
                  <Link href="/register" className="btn-secondary text-xs">
                    Edit
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  <div className="rounded-2xl border border-[var(--border-subtle)] p-3">
                    <div>Patient ID</div>
                    <div className="mt-2 text-sm normal-case tracking-normal text-[var(--text-primary)]">
                      {patient.patientId}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-subtle)] p-3">
                    <div>Age</div>
                    <div className="mt-2 text-sm normal-case tracking-normal text-[var(--text-primary)]">
                      {patient.age ?? "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-[var(--text-secondary)]">
                <p>
                  No patient is registered in this browser yet. Complete the
                  registration step before emailing a report.
                </p>
                <Link href="/register" className="btn-primary inline-flex items-center justify-center">
                  Register patient
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleManualSubmit} className="card-premium p-6">
            <div className="section-title">Manual parameter prediction</div>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(manualInputs).map(([key, value]) => (
                <label key={key} className="space-y-2">
                  <span className="text-sm font-medium capitalize text-[var(--text-primary)]">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={value}
                    onChange={(event) =>
                      setManualInputs((current) => ({
                        ...current,
                        [key]: Number(event.target.value),
                      }))
                    }
                    className="input-shell"
                  />
                </label>
              ))}
            </div>
            <button type="submit" className="btn-primary mt-6" disabled={isAnalyzing}>
              {isAnalyzing ? "Analyzing..." : "Run manual analysis"}
            </button>
          </form>

          <section className="card-premium p-6">
            <div className="section-title">Upload analysis</div>
            <div className="space-y-4">
              <label className="upload-zone flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="text-lg font-semibold text-[var(--text-primary)]">
                  Drop a source file here or browse
                </span>
                <span className="max-w-md text-sm text-[var(--text-secondary)]">
                  Supported: JPEG, JPG, PNG, BMP, WebP, CSV, and PDF. The app
                  automatically routes the file to the matching analysis
                  pipeline.
                </span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.bmp,.webp,.csv,.pdf,image/jpeg,image/png,image/bmp,image/webp,text/csv,application/pdf"
                  className="hidden"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
              </label>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-[var(--text-secondary)]">
                {selectedFile ? (
                  <>
                    Selected file:{" "}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {selectedFile.name}
                    </span>
                  </>
                ) : (
                  "No file selected yet."
                )}
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={handleFileAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Run file analysis"}
              </button>
            </div>
          </section>
        </section>

        {status ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {status}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {analysisResult ? (
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="card-premium p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="section-title">Latest result</div>
                    <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                      {analysisResult.sourceType.toUpperCase()} analysis
                    </h2>
                  </div>
                  <RiskBadge label={analysisResult.riskLabel} />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="metric-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Probability
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                      {analysisResult.probability}%
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Confidence
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                      {analysisResult.confidence}%
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-7 text-[var(--text-secondary)]">
                  {analysisResult.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {analysisResult.predictedOrgans.map((organ, index) => (
                    <span
                      key={`${organ}-${index}`}
                      className="rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]"
                    >
                      {organ}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="section-title">Findings</div>
                <ul className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                  {analysisResult.findings.map((finding, index) => (
                    <li key={`${finding}-${index}`}>{finding}</li>
                  ))}
                </ul>
              </div>

              {carePlan ? (
                <div className="card-premium p-6">
                  <div className="section-title">Care plan</div>
                  <div className="space-y-5 text-sm text-[var(--text-secondary)]">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        Follow-up window
                      </div>
                      <div className="mt-2">{carePlan.followUpWindow}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        Patient actions
                      </div>
                      <ul className="mt-2 space-y-2">
                        {carePlan.patientActions.map((action, index) => (
                          <li key={`${action}-${index}`}>{action}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        Clinician actions
                      </div>
                      <ul className="mt-2 space-y-2">
                        {carePlan.clinicianActions.map((action, index) => (
                          <li key={`${action}-${index}`}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="card-premium chart-card p-6">
                <div className="section-title">Feature metrics</div>
                <FeatureMetricsChart metrics={analysisResult.metrics} />
              </div>

              <div className="card-premium chart-card p-6">
                <div className="section-title">Predicted organ focus</div>
                <OrganFocusChart data={organChartData} />
                <div className="mt-4 flex flex-wrap gap-3">
                  {organChartData.map((entry, index) => (
                    <div
                      key={`${entry.name}-${index}`}
                      className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="section-title">Report actions</div>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">
                  Generate a PDF report that includes patient details, risk
                  summary, predicted organs, care recommendations, and the fixed
                  AI disclaimer. Email uses the registered patient address.
                </p>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={downloadReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? "Generating..." : "Download PDF report"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={emailReport}
                    disabled={isEmailing || !patient}
                  >
                    {isEmailing
                      ? "Sending..."
                      : `Email report${patient ? ` to ${patient.email}` : ""}`}
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="card-premium p-6 text-sm leading-7 text-[var(--text-secondary)]">
            <div className="section-title">Waiting for first analysis</div>
            Run either the manual or upload flow above to generate a result.
            Once a result exists, this screen will show the risk summary,
            predicted organs, care plan, PDF report action, and email flow.
          </section>
        )}
      </div>
    </PageShell>
  );
}
