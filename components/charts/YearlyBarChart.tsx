"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RawSheet } from "@/lib/store";

interface YearlyBarChartProps {
  rawSheets: { [key: string]: RawSheet };
}

export function YearlyBarChart({ rawSheets }: YearlyBarChartProps) {
  // Aggregate by year
  const yearTotals: { [key: number]: number } = {};

  Object.entries(rawSheets).forEach(([key, sheet]) => {
    const year = parseInt(key.split("-")[0], 10);
    if (!isNaN(year)) {
      if (!yearTotals[year]) {
        yearTotals[year] = 0;
      }
      sheet.items.forEach((item) => {
        yearTotals[year] += item.amount || 0;
      });
    }
  });

  const data = Object.entries(yearTotals)
    .map(([year, total]) => ({
      name: parseInt(year, 10),
      total,
    }))
    .sort((a, b) => a.name - b.name);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            if (value >= 10000) {
              return `${(value / 10000).toFixed(0)}만`;
            }
            return value.toString();
          }}
        />
        <Tooltip
          formatter={(value: any) => value?.toLocaleString?.() ?? value}
          labelFormatter={(label) => `${label}년`}
        />
        <Bar dataKey="total" fill="#2d5a3d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
