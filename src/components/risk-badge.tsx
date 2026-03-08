import type { RiskLabel } from "@/lib/metamap/types";

const styles: Record<RiskLabel, string> = {
  Low: "border-emerald-400/30 bg-emerald-400/12 text-emerald-300",
  Moderate: "border-amber-400/30 bg-amber-400/12 text-amber-300",
  High: "border-orange-400/30 bg-orange-400/12 text-orange-300",
  Critical: "border-rose-400/30 bg-rose-400/12 text-rose-300",
};

export function RiskBadge({ label }: { label: RiskLabel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${styles[label]}`}
    >
      {label}
    </span>
  );
}
