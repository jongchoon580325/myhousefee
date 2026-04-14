"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { X } from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const {
    activeView,
    setActiveView,
    selectedYear,
    rawSheets,
    setSelectedRawSheetMonth,
  } = useStore();

  // selectedYear가 변경되면 해당 연도를 자동 펼침
  useEffect(() => {
    setExpandedYears(new Set([selectedYear]));
  }, [selectedYear]);

  // 연도 토글 함수
  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  // 연도 목록 추출 함수
  const getYears = (): number[] => {
    const years = new Set<number>();
    Object.keys(rawSheets).forEach((key) => {
      const year = parseInt(key.split("-")[0], 10);
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // 내림차순 (최신부터)
  };

  const years = getYears();

  const menuItems = [
    { id: "dashboard", label: "대시보드", icon: "📊" },
    { id: "charts", label: "항목별 추이", icon: "📈" },
    { id: "table", label: "전체 데이터", icon: "📋" },
    { id: "upload", label: "이미지 업로드", icon: "📸" },
    { id: "settings", label: "설정", icon: "⚙️" },
  ] as const;

  const handleMenuItemClick = (id: string) => {
    setActiveView(id as any);
    onClose?.();
  };

  const SidebarContent = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === item.id
                  ? "bg-app-accent-light text-app-accent"
                  : "text-app-text hover:bg-surface2"
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {years.length > 0 && (
          <div className="mt-6 pt-4 border-t border-app-border">
            <p className="text-xs font-semibold text-app-muted mb-3 px-3">
              연도 및 월별 보기
            </p>
            <div className="space-y-1">
              {years.map((year) => {
                const isExpanded = expandedYears.has(year);
                const monthsForYear = Object.keys(rawSheets)
                  .filter((key) => parseInt(key.split("-")[0], 10) === year)
                  .map((key) => ({
                    key,
                    month: parseInt(key.split("-")[1], 10),
                  }))
                  .sort((a, b) => a.month - b.month); // 오름차순

                return (
                  <div key={year}>
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full text-left px-3 py-2 rounded text-sm font-medium text-app-text hover:bg-surface2 transition-colors flex items-center gap-2"
                    >
                      <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
                      {year}
                    </button>
                    {isExpanded && (
                      <div className="space-y-1 pl-6">
                        {monthsForYear.map(({ key, month }) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedRawSheetMonth(key);
                              handleMenuItemClick("rawSheet");
                            }}
                            className="w-full text-left px-3 py-1 text-xs rounded hover:bg-surface2 text-app-muted transition-colors"
                          >
                            • {String(month).padStart(2, "0")}월
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className="hidden sm:flex flex-col w-56 border-r border-app-border bg-surface">
        <SidebarContent />
      </aside>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* 모바일 드로어 */}
      <aside
        className={`fixed inset-y-0 left-0 top-14 z-50 flex flex-col w-56 border-r border-app-border bg-surface transition-transform duration-300 ease-in-out sm:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 모바일 메뉴 헤더 (닫기 버튼) */}
        <div className="border-b border-app-border p-4 flex items-center justify-between sm:hidden">
          <h2 className="font-semibold text-app-text">메뉴</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface2 rounded transition-colors"
            aria-label="메뉴 닫기"
          >
            <X className="h-5 w-5 text-app-text" />
          </button>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
}
