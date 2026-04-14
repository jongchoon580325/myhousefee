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

interface TotalBarChartProps {
  rawSheets: { [key: string]: RawSheet };
}

export function TotalBarChart({ rawSheets }: TotalBarChartProps) {
  // Prepare data: aggregate by month
  const data = Object.entries(rawSheets)
    .map(([key, sheet]) => {
      const total = sheet.items.reduce((sum, item) => {
        return sum + (item.amount || 0);
      }, 0);
      return {
        name: key.replace("-", "."),
        total,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
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
          labelFormatter={(label) => `${label}월`}
        />
        <Bar dataKey="total" fill="#2d5a3d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
