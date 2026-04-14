"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ItemLineChart } from "@/components/charts/ItemLineChart";
import { YearlyBarChart } from "@/components/charts/YearlyBarChart";
import type { RawSheet } from "@/lib/store";

export function ChartsView() {
  const { rawSheets } = useStore();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Extract and sort unique years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    Object.keys(rawSheets).forEach((key) => {
      const year = parseInt(key.split("-")[0], 10);
      if (!isNaN(year)) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Descending order
  }, [rawSheets]);

  // Filter rawSheets based on selected year
  const filteredSheets = useMemo(() => {
    if (selectedYear === null) {
      return rawSheets;
    }
    const filtered: { [key: string]: RawSheet } = {};
    Object.entries(rawSheets).forEach(([key, sheet]) => {
      const year = parseInt(key.split("-")[0], 10);
      if (year === selectedYear) {
        filtered[key] = sheet;
      }
    });
    return filtered;
  }, [rawSheets, selectedYear]);

  // Navigate to previous year
  const handlePreviousYear = () => {
    if (selectedYear === null) {
      if (availableYears.length > 0) {
        setSelectedYear(availableYears[0]);
      }
    } else {
      const currentIndex = availableYears.indexOf(selectedYear);
      if (currentIndex < availableYears.length - 1) {
        setSelectedYear(availableYears[currentIndex + 1]);
      }
    }
  };

  // Navigate to next year
  const handleNextYear = () => {
    if (selectedYear === null) {
      return;
    }
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1]);
    } else {
      setSelectedYear(null);
    }
  };

  // Empty state
  if (Object.keys(rawSheets).length === 0) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[calc(100vh-14rem)]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-2xl font-bold text-app-text mb-2">데이터가 없습니다</h1>
          <p className="text-app-muted">이미지를 업로드해서 시작하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-app-text mb-8">항목별 추이</h1>

      {/* Year Filter Section */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousYear}
            disabled={selectedYear === null}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <select
            value={selectedYear?.toString() || "all"}
            onChange={(e) => {
              setSelectedYear(
                e.target.value === "all" ? null : parseInt(e.target.value, 10)
              );
            }}
            className="px-3 py-2 border border-app-border rounded-md bg-surface text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent"
          >
            <option value="all">전체</option>
            {availableYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}년
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextYear}
            disabled={selectedYear === null}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 세대전기료 Chart */}
        <div className="bg-surface rounded-lg border border-app-border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-app-text mb-4">세대전기료</h2>
          <ItemLineChart
            itemName="세대전기료"
            color="#E8A020"
            rawSheets={filteredSheets}
          />
        </div>

        {/* 세대수도료 Chart */}
        <div className="bg-surface rounded-lg border border-app-border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-app-text mb-4">세대수도료</h2>
          <ItemLineChart
            itemName="세대수도료"
            color="#1a6b9a"
            rawSheets={filteredSheets}
          />
        </div>

        {/* 세대급탕비 Chart */}
        <div className="bg-surface rounded-lg border border-app-border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-app-text mb-4">세대급탕비</h2>
          <ItemLineChart
            itemName="세대급탕비"
            color="#c0392b"
            rawSheets={filteredSheets}
          />
        </div>

        {/* Yearly Total Chart */}
        <div className="bg-surface rounded-lg border border-app-border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-app-text mb-4">연도별 합계</h2>
          <YearlyBarChart rawSheets={rawSheets} />
        </div>
      </div>
    </div>
  );
}
