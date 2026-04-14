"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RawSheet } from "@/lib/store";

interface ItemLineChartProps {
  itemName: string;
  color: string;
  rawSheets: { [key: string]: RawSheet };
}

export function ItemLineChart({ itemName, color, rawSheets }: ItemLineChartProps) {
  // Prepare data: extract specific item for each month
  const data = Object.entries(rawSheets)
    .map(([key, sheet]) => {
      const item = sheet.items.find((i) => i.item === itemName);
      return {
        name: key.replace("-", "."),
        value: item?.amount || 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
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
          labelFormatter={(label) => `${label}`}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name={itemName}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
