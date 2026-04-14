"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RawSheet } from "@/lib/store";

interface Key3LineChartProps {
  rawSheets: { [key: string]: RawSheet };
}

export function Key3LineChart({ rawSheets }: Key3LineChartProps) {
  // "세대"를 포함하는 항목들을 동적으로 추출
  const getDynamicKeyItems = () => {
    const sortedKeys = Object.keys(rawSheets).sort().reverse();
    const latestKey = sortedKeys[0];
    if (!latestKey) return [];

    const latestSheet = rawSheets[latestKey];
    const filteredItems = latestSheet.items.filter(
      (item) => item.item.includes("세대") && item.item !== "합계"
    );

    // 색상 팔레트 (10개 항목까지 지원)
    const colorPalette = [
      "#E8A020", // 주황
      "#1a6b9a", // 파랑
      "#c0392b", // 빨강
      "#f39c12", // 주황
      "#16a085", // 초록
      "#8e44ad", // 보라
      "#e74c3c", // 빨강
      "#3498db", // 파랑
      "#2ecc71", // 초록
      "#e67e22", // 주황
    ];

    return filteredItems.map((item, index) => ({
      name: item.item,
      color: colorPalette[index % colorPalette.length],
    }));
  };

  const KEY_ITEMS = getDynamicKeyItems();

  // Prepare data: extract key items for each month
  const data = Object.entries(rawSheets)
    .map(([key, sheet]) => {
      const point: any = { name: key.replace("-", ".") };

      KEY_ITEMS.forEach(({ name }) => {
        const item = sheet.items.find((i) => i.item === name);
        point[name] = item?.amount || 0;
      });

      return point;
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
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
        />
        <Legend wrapperStyle={{ paddingTop: "20px" }} />
        {KEY_ITEMS.map(({ name, color }) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
