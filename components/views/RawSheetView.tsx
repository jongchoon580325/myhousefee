"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";

export function RawSheetView() {
  const { rawSheets, selectedRawSheetMonth, setActiveView } = useStore();

  // Get the sheet data for the selected month
  const sheetData = useMemo(() => {
    if (!selectedRawSheetMonth || !rawSheets[selectedRawSheetMonth]) {
      return null;
    }
    return rawSheets[selectedRawSheetMonth];
  }, [selectedRawSheetMonth, rawSheets]);

  // Empty state
  if (!sheetData) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[calc(100vh-14rem)]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-app-text mb-2">데이터가 없습니다</h1>
          <p className="text-app-muted">월별 리스트에서 월을 선택해주세요</p>
        </div>
      </div>
    );
  }

  const items = sheetData.items || [];
  const [year, month] = selectedRawSheetMonth!.split("-");
  const monthLabel = `${year}년 ${+month}월`;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-app-text mb-8">원본 데이터</h1>

      {/* 월 정보 */}
      <div className="mb-6 text-sm text-app-muted">{monthLabel}</div>

      {/* 테이블 */}
      <div className="bg-surface rounded-lg border border-app-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-app-accent text-white">
                <th className="px-4 py-3 text-left font-semibold">항목</th>
                <th className="px-4 py-3 text-right font-semibold">비중금액</th>
                <th className="px-4 py-3 text-right font-semibold">전중금액</th>
                <th className="px-4 py-3 text-right font-semibold">증감액</th>
                <th className="px-4 py-3 text-right font-semibold">증감율</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-app-muted">
                    데이터가 없습니다
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const isTotal = item.item === "합계";
                  const pct =
                    item.diff && item.prev
                      ? ((item.diff / Math.abs(item.prev)) * 100).toFixed(1)
                      : null;

                  return (
                    <tr
                      key={idx}
                      className={`border-b border-app-border hover:bg-app-bg transition ${
                        isTotal ? "bg-app-accent/10 font-semibold" : idx % 2 === 0 ? "bg-white" : "bg-app-bg"
                      }`}
                    >
                      <td className="px-4 py-3">{item.item}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {item.amount !== null ? item.amount.toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-app-muted">
                        {item.prev !== null ? item.prev.toLocaleString() : "-"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono ${
                          item.diff !== null && item.diff > 0
                            ? "text-red-600"
                            : item.diff !== null && item.diff < 0
                            ? "text-green-600"
                            : ""
                        }`}
                      >
                        {item.diff !== null
                          ? (item.diff > 0 ? "+" : "") + item.diff.toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pct !== null ? (
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              item.diff !== null && item.diff > 0
                                ? "bg-red-100 text-red-700"
                                : item.diff !== null && item.diff < 0
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.diff !== null && item.diff > 0 ? "+" : ""}
                            {pct}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 정보 */}
      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-app-bg rounded-lg p-4 border border-app-border">
            <p className="text-xs text-app-muted mb-1">총 항목 수</p>
            <p className="text-2xl font-bold text-app-text">{items.length}</p>
          </div>
          <div className="bg-app-bg rounded-lg p-4 border border-app-border">
            <p className="text-xs text-app-muted mb-1">전체 합계</p>
            <p className="text-2xl font-bold text-app-accent">
              {items
                .filter((i) => i.item === "합계")
                .reduce((sum, i) => sum + (i.amount || 0), 0)
                .toLocaleString()}
              원
            </p>
          </div>
          <div className="bg-app-bg rounded-lg p-4 border border-app-border">
            <p className="text-xs text-app-muted mb-1">최대 항목</p>
            <p className="text-sm text-app-text truncate">
              {items
                .filter((i) => i.item !== "합계")
                .sort((a, b) => (b.amount || 0) - (a.amount || 0))[0]?.item || "-"}
            </p>
          </div>
          <div className="bg-app-bg rounded-lg p-4 border border-app-border">
            <p className="text-xs text-app-muted mb-1">증감 현황</p>
            <p
              className={`text-sm font-semibold ${
                items.reduce((sum, i) => sum + (i.diff || 0), 0) > 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {items.reduce((sum, i) => sum + (i.diff || 0), 0) > 0 ? "↑" : "↓"}{" "}
              {Math.abs(items.reduce((sum, i) => sum + (i.diff || 0), 0)).toLocaleString()}원
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
