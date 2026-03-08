import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const workflowSteps = [
  {
    title: "1. Register a demo patient",
    description:
      "Capture the minimal profile needed for a personalized report: name, DOB, and email.",
  },
  {
    title: "2. Run one analysis",
    description:
      "Use manual factors or upload an image, CSV dataset, or PDF report to generate a risk estimate.",
  },
  {
    title: "3. Generate and email the report",
    description:
      "Create a PDF summary with risk, organ focus, recommendations, and a patient-ready email action.",
  },
];

const featureCards = [
  "Manual demo scoring for quick what-if review",
  "Image, CSV, and PDF analysis in one workflow",
  "Unified report payload across all source types",
  "PDF download plus patient email delivery",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-grid">
      <SiteHeader />

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-[var(--border-accent)] bg-[var(--accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Demo clinical workflow
            </span>
            <div className="space-y-4">
              <h1 className="font-display text-5xl leading-tight text-[var(--text-primary)] sm:text-6xl">
                Multi-format cancer risk review with a patient-ready report.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
                MetaMap AI now supports a full demo flow: register a patient,
                analyze manual factors or uploaded source files, build a PDF
                report, and email the result back to the patient.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className="btn-primary inline-flex items-center justify-center">
                Start patient registration
              </Link>
              <Link href="/metamap" className="btn-secondary inline-flex items-center justify-center">
                Open analysis workspace
              </Link>
            </div>
          </div>

          <div className="card-premium p-6">
            <div className="section-title">What the application does</div>
            <div className="space-y-4 text-sm leading-7 text-[var(--text-secondary)]">
              <p>
                This app is a polished demo workflow for oncology risk review.
                It collects sample patient registration details, analyzes one
                uploaded or manually entered input, generates a risk summary,
                produces a PDF report, and can email that report to the patient.
              </p>
              <p>
                The prediction layer is designed for workflow validation rather
                than diagnosis, so every result is paired with follow-up
                guidance and a fixed clinical disclaimer.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((step) => (
            <article key={step.title} className="card-premium p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                {step.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="card-premium p-6">
            <div className="section-title">Experience principles</div>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li>One workflow, not disconnected tools.</li>
              <li>Visible patient context before every analysis action.</li>
              <li>Clear upload support for JPEG, BMP, PNG, WebP, CSV, and PDF.</li>
              <li>Actionable output with download and email from the same screen.</li>
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {featureCards.map((feature) => (
              <div key={feature} className="card-premium p-5">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {feature}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
