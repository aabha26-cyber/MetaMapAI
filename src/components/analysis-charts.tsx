"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalysisMetric } from "@/lib/metamap/types";

type OrganChartDatum = {
  name: string;
  value: number;
  color: string;
};

type FeatureMetricsChartProps = {
  metrics: AnalysisMetric[];
};

type OrganFocusChartProps = {
  data: OrganChartDatum[];
};

const AXIS_TICK = { fontSize: 12 };
const BAR_RADIUS: [number, number, number, number] = [6, 6, 0, 0];
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "rgba(12, 12, 18, 0.96)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "12px",
  color: "#f4f4f6",
};
const TOOLTIP_LABEL_STYLE = {
  color: "#f4f4f6",
  fontWeight: 600,
};
const TOOLTIP_ITEM_STYLE = {
  color: "#f4f4f6",
};

export const FeatureMetricsChart = memo(function FeatureMetricsChart({
  metrics,
}: FeatureMetricsChartProps) {
  return (
    <div className="chart-shell h-72">
      <ResponsiveContainer width="100%" height="100%" debounce={120}>
        <BarChart data={metrics}>
          <XAxis dataKey="label" stroke="#9ca3af" tick={AXIS_TICK} />
          <YAxis stroke="#9ca3af" tick={AXIS_TICK} />
          <Tooltip
            cursor={false}
            isAnimationActive={false}
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
          />
          <Bar
            dataKey="value"
            radius={BAR_RADIUS}
            fill="#d4af37"
            isAnimationActive={false}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const OrganFocusChart = memo(function OrganFocusChart({
  data,
}: OrganFocusChartProps) {
  return (
    <div className="chart-shell h-72">
      <ResponsiveContainer width="100%" height="100%" debounce={120}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={96}
            paddingAngle={3}
            isAnimationActive={false}
            stroke="transparent"
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            isAnimationActive={false}
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});
