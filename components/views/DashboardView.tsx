"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { TotalBarChart } from "@/components/charts/TotalBarChart";
import { Key3LineChart } from "@/components/charts/Key3LineChart";
import { TrendingUp, TrendingDown, Home, Droplet, Flame, Zap, Wind } from "lucide-react";

export function DashboardView() {
  const { rawSheets, setActiveView } = useStore();

  // Calculate summary metrics
  const totalMonth = Object.keys(rawSheets).length;
  let totalSum = 0;
  let maxMonth = 0;
  let minMonth = Infinity;

  Object.entries(rawSheets).forEach(([, sheet]) => {
    // "합계" 항목을 제외하고 실제 항목들의 합만 계산
    const monthTotal = sheet.items
      .filter((item) => item.item !== "합계")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    totalSum += monthTotal;
    if (monthTotal > maxMonth) {
      maxMonth = monthTotal;
    }
    if (monthTotal < minMonth) {
      minMonth = monthTotal;
    }
  });

  const monthAverage = totalMonth > 0 ? Math.round(totalSum / totalMonth) : 0;

  // Get the most recent month data for key items
  const sortedKeys = Object.keys(rawSheets).sort().reverse();
  const latestKey = sortedKeys[0];
  const previousKey = sortedKeys[1];
  const latestSheet = latestKey ? rawSheets[latestKey] : null;
  const previousSheet = previousKey ? rawSheets[previousKey] : null;

  const getItemData = (itemName: string) => {
    const latestItem = latestSheet?.items.find((i) => i.item === itemName);
    const previousItem = previousSheet?.items.find((i) => i.item === itemName);
    return {
      current: latestItem?.amount || 0,
      previous: previousItem?.amount || 0,
      diff: latestItem?.diff || 0,
    };
  };

  // "세대"를 포함하는 항목들을 필터링하고 동적 keyItems 생성
  const getDynamicKeyItems = () => {
    if (!latestSheet) return [];

    // "세대"를 포함하는 항목들만 필터링 (합계 제외)
    const filteredItems = latestSheet.items.filter(
      (item) => item.item.includes("세대") && item.item !== "합계"
    );

    // 확장된 색상 팔레트 (10개 항목까지 지원)
    const colorPalette = [
      { icon: Home, color: "#E8A020", bgColor: "#FFF3E0" },
      { icon: Droplet, color: "#1a6b9a", bgColor: "#E3F2FD" },
      { icon: Flame, color: "#c0392b", bgColor: "#FFEBEE" },
      { icon: Zap, color: "#f39c12", bgColor: "#FEF5E7" },
      { icon: Wind, color: "#16a085", bgColor: "#E8F8F5" },
      { icon: Home, color: "#8e44ad", bgColor: "#F4ECF7" },
      { icon: Droplet, color: "#e74c3c", bgColor: "#FADBD8" },
      { icon: Flame, color: "#3498db", bgColor: "#D6EAF8" },
      { icon: Zap, color: "#2ecc71", bgColor: "#D5F4E6" },
      { icon: Wind, color: "#e67e22", bgColor: "#FDEBD0" },
    ];

    return filteredItems.map((item, index) => ({
      name: item.item,
      icon: colorPalette[index % colorPalette.length].icon,
      color: colorPalette[index % colorPalette.length].color,
      bgColor: colorPalette[index % colorPalette.length].bgColor,
    }));
  };

  // 동적으로 생성된 keyItems (항상 최신 데이터 기반)
  const keyItems = getDynamicKeyItems();

  // 그리드 컬럼 수를 동적으로 결정
  const getGridColsClass = () => {
    const count = keyItems.length;
    if (count === 0) return "grid-cols-1";
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2";
    if (count === 3) return "grid-cols-1 sm:grid-cols-3";
    if (count === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
    if (count === 5) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5";
    if (count === 6) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    // 6개 이상: 2행으로 자동 배치
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  };

  // Empty state
  if (Object.keys(rawSheets).length === 0) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[calc(100vh-14rem)]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-2xl font-bold text-app-text mb-2">데이터가 없습니다</h1>
          <p className="text-app-muted mb-6">이미지를 업로드해서 시작하세요</p>
          <Button
            onClick={() => setActiveView("upload")}
            className="bg-app-accent hover:bg-app-accent/90 text-white"
          >
            이미지 업로드
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-app-text mb-8">대시보드</h1>

      {/* 요약 카드 섹션 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 sm:p-6">
          <p className="text-sm font-semibold text-blue-600 mb-2">총 합계</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-900 break-words">{totalSum.toLocaleString()}원</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 sm:p-6">
          <p className="text-sm font-semibold text-green-600 mb-2">데이터 개월수</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-900 break-words">{totalMonth}개월</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 sm:p-6">
          <p className="text-sm font-semibold text-purple-600 mb-2">월 평균</p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-900 break-words">{monthAverage.toLocaleString()}원</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 sm:p-6">
          <p className="text-sm font-semibold text-orange-600 mb-2">최고/최저월</p>
          <p className="text-2xl sm:text-3xl font-bold text-orange-900 break-words">
            {maxMonth.toLocaleString()} / {minMonth === Infinity ? 0 : minMonth.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 핵심 항목 카드 섹션 */}
      {keyItems.length > 0 ? (
        <div className={`grid ${getGridColsClass()} gap-4 mb-8`}>
          {keyItems.map(({ name, icon: Icon, color, bgColor }) => {
            const { current, diff } = getItemData(name);
            const isIncrease = diff > 0;

            return (
              <div key={name} className="rounded-lg border border-app-border p-4 sm:p-6 bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: bgColor }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <h3 className="font-semibold text-app-text">{name}</h3>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-app-muted mb-1">금액</p>
                  <p className="text-2xl font-bold text-app-text">
                    {current.toLocaleString()}원
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isIncrease ? (
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      isIncrease ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {isIncrease ? "+" : ""}{diff.toLocaleString()}원
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg border border-app-border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-app-text mb-4">월별 합계</h2>
          <TotalBarChart rawSheets={rawSheets} />
        </div>

        <div className="bg-surface rounded-lg border border-app-border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-app-text mb-4">항목별 추이</h2>
          <Key3LineChart rawSheets={rawSheets} />
        </div>
      </div>
    </div>
  );
}
