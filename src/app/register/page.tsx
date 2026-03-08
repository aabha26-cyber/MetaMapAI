"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/page-shell";
import {
  ANALYSIS_STORAGE_KEY,
  buildPatientProfile,
  calculateAge,
  PATIENT_STORAGE_KEY,
  type PatientRegistrationInput,
} from "@/lib/patient";

const initialState: PatientRegistrationInput = {
  fullName: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  gender: "",
  address: "",
  notes: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<PatientRegistrationInput>(initialState);
  const [error, setError] = useState<string | null>(null);

  const agePreview = useMemo(
    () => calculateAge(form.dateOfBirth),
    [form.dateOfBirth],
  );

  function updateField<K extends keyof PatientRegistrationInput>(
    key: K,
    value: PatientRegistrationInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.fullName.trim() || !form.dateOfBirth || !form.email.trim()) {
      setError("Name, date of birth, and email are required.");
      return;
    }

    const patient = buildPatientProfile({
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim(),
      gender: form.gender?.trim(),
      address: form.address?.trim(),
      notes: form.notes?.trim(),
    });

    localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(patient));
    localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    router.push("/metamap");
  }

  return (
    <PageShell maxWidthClassName="max-w-5xl">
      <div className="grid gap-8">
        <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="card-premium p-6">
            <div className="section-title">Step 1 of 3</div>
            <h1 className="font-display text-4xl text-[var(--text-primary)]">
              Register a demo patient
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              This creates the patient context used throughout the analysis and
              report flow. There is no database in this demo; details are kept
              in local browser storage so you can move directly into the
              analysis workspace.
            </p>
            <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-[var(--text-secondary)]">
              Required: full name, date of birth, email.
              <br />
              Optional: phone, gender, address, family history or lifestyle
              notes for narrative context in the generated report.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="card-premium p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Full name
                </span>
                <input
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  className="input-shell"
                  placeholder="Jane Doe"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Date of birth
                </span>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) =>
                    updateField("dateOfBirth", event.target.value)
                  }
                  className="input-shell"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Email
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="input-shell"
                  placeholder="patient@example.com"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Phone
                </span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className="input-shell"
                  placeholder="Optional"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Gender
                </span>
                <select
                  value={form.gender}
                  onChange={(event) => updateField("gender", event.target.value)}
                  className="input-shell"
                >
                  <option value="">Optional</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Address
                </span>
                <input
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  className="input-shell"
                  placeholder="Optional"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Family history / lifestyle notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  className="input-shell min-h-32 resize-y"
                  placeholder="Optional free text used only in the report context."
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                Age preview:{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {agePreview ?? "N/A"}
                </span>
              </div>
              <div>Patient ID is created automatically after registration.</div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <button type="submit" className="btn-primary">
                Continue to prediction
              </button>
              <Link href="/" className="btn-secondary inline-flex items-center justify-center">
                Back to overview
              </Link>
            </div>
          </form>
        </section>
      </div>
    </PageShell>
  );
}
