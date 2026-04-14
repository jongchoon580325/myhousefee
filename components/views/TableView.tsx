"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { saveRawSheet } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash2, Edit2, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ManagementRecord, RawSheet } from "@/lib/store";

export function TableView() {
  const { rawSheets, user, setRawSheet } = useStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    item: string;
    amount: number | null;
    prev: number | null;
    diff: number | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ idx: number; itemName: string } | null>(null);
  const [successModal, setSuccessModal] = useState<{
    type: "edit" | "delete";
    itemName: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 월별 데이터 정렬
  const monthList = useMemo(() => {
    return Object.keys(rawSheets).sort().reverse();
  }, [rawSheets]);

  // 선택된 월 초기화
  const currentMonth = selectedMonth || monthList[0];

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!currentMonth || !rawSheets[currentMonth]) return [];

    const items = rawSheets[currentMonth].items || [];
    if (!searchQuery) return items;

    return items.filter((item) =>
      item.item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentMonth, rawSheets, searchQuery]);

  const handlePrevMonth = () => {
    const currentIdx = monthList.indexOf(currentMonth);
    if (currentIdx < monthList.length - 1) {
      setSelectedMonth(monthList[currentIdx + 1]);
      setSearchQuery("");
    }
  };

  const handleNextMonth = () => {
    const currentIdx = monthList.indexOf(currentMonth);
    if (currentIdx > 0) {
      setSelectedMonth(monthList[currentIdx - 1]);
      setSearchQuery("");
    }
  };

  const handleEditClick = (idx: number, record: ManagementRecord) => {
    const id = `${currentMonth}-${idx}`;
    setEditingId(id);
    setEditValues({ ...record });
  };

  const handleSave = async () => {
    if (!editingId || !editValues || !user?.uid) return;

    const [yearMonth, idxStr] = editingId.split("-");
    const idx = parseInt(idxStr, 10);

    setIsSaving(true);
    try {
      const sheet = rawSheets[yearMonth];
      const updatedItems = [...sheet.items];
      updatedItems[idx] = editValues;
      const updatedSheet: RawSheet = { items: updatedItems, updatedAt: Date.now() };

      setRawSheet(yearMonth, updatedSheet);
      await saveRawSheet(user.uid, yearMonth, updatedSheet);

      setSuccessModal({ type: "edit", itemName: editValues.item });
      setEditingId(null);
      setEditValues(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleDeleteClick = (idx: number, itemName: string) => {
    setDeleteTarget({ idx, itemName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !user?.uid) return;

    setIsSaving(true);
    try {
      const sheet = rawSheets[currentMonth];
      const updatedItems = sheet.items.filter((_, i) => i !== deleteTarget.idx);
      const updatedSheet: RawSheet = { items: updatedItems, updatedAt: Date.now() };

      setRawSheet(currentMonth, updatedSheet);
      await saveRawSheet(user.uid, currentMonth, updatedSheet);

      setSuccessModal({ type: "delete", itemName: deleteTarget.itemName });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete error:", error);
      alert("삭제에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  // Empty state
  if (monthList.length === 0) {
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

  const [year, month] = currentMonth.split("-");
  const pageInfo = `${year}년 ${+month}월 • ${monthList.indexOf(currentMonth) + 1} / ${monthList.length}`;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-app-text mb-8">전체 데이터</h1>

      {/* 필터 및 네비게이션 섹션 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="text-sm text-app-muted">{pageInfo}</div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            disabled={monthList.indexOf(currentMonth) === monthList.length - 1}
            className="p-2 min-h-[36px] min-w-[36px]"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <select
            value={currentMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSearchQuery("");
            }}
            className="px-3 py-2 border border-app-border rounded-md bg-surface text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
          >
            {monthList.map((m) => {
              const [y, mo] = m.split("-");
              return (
                <option key={m} value={m}>
                  {y}년 {+mo}월
                </option>
              );
            })}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            disabled={monthList.indexOf(currentMonth) === 0}
            className="p-2 min-h-[36px] min-w-[36px]"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <input
            type="text"
            placeholder="항목 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-app-border rounded-md bg-surface text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-surface rounded-lg border border-app-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-app-accent text-white">
                <th className="px-4 py-3 text-left font-semibold">항목</th>
                <th className="px-4 py-3 text-right font-semibold">금월부과금</th>
                <th className="px-4 py-3 text-right font-semibold">전월부과금</th>
                <th className="px-4 py-3 text-right font-semibold">증감액</th>
                <th className="px-4 py-3 text-right font-semibold">증감율</th>
                <th className="px-4 py-3 text-center font-semibold">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-app-muted">
                    데이터가 없습니다
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const isTotal = item.item === "합계";
                  const pct =
                    item.diff && item.prev
                      ? ((item.diff / Math.abs(item.prev)) * 100).toFixed(1)
                      : null;

                  const isEditing = editingId === `${currentMonth}-${idx}`;

                  return (
                    <tr
                      key={`${currentMonth}-${idx}`}
                      className={`border-b border-app-border hover:bg-app-bg transition ${
                        isTotal ? "bg-app-accent/10 font-semibold" : idx % 2 === 0 ? "bg-white" : "bg-app-bg"
                      }`}
                    >
                      {/* 항목명 */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues?.item || ""}
                            onChange={(e) =>
                              setEditValues({ ...editValues!, item: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-app-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
                          />
                        ) : (
                          item.item
                        )}
                      </td>

                      {/* 금월부과금 */}
                      <td className="px-4 py-3 text-right font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues?.amount ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues!,
                                amount: e.target.value ? parseInt(e.target.value, 10) : null,
                              })
                            }
                            className="w-full px-2 py-1 border border-app-border rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-app-accent"
                          />
                        ) : (
                          item.amount !== null ? item.amount.toLocaleString() : "-"
                        )}
                      </td>

                      {/* 전월부과금 */}
                      <td className="px-4 py-3 text-right font-mono text-app-muted">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues?.prev ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues!,
                                prev: e.target.value ? parseInt(e.target.value, 10) : null,
                              })
                            }
                            className="w-full px-2 py-1 border border-app-border rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-app-accent"
                          />
                        ) : (
                          item.prev !== null ? item.prev.toLocaleString() : "-"
                        )}
                      </td>

                      {/* 증감액 */}
                      <td
                        className={`px-4 py-3 text-right font-mono ${
                          isEditing
                            ? ""
                            : item.diff !== null && item.diff > 0
                            ? "text-red-600"
                            : item.diff !== null && item.diff < 0
                            ? "text-green-600"
                            : ""
                        }`}
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues?.diff ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues!,
                                diff: e.target.value ? parseInt(e.target.value, 10) : null,
                              })
                            }
                            className="w-full px-2 py-1 border border-app-border rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-app-accent"
                          />
                        ) : item.diff !== null
                        ? (item.diff > 0 ? "+" : "") + item.diff.toLocaleString()
                        : (
                          "-"
                        )}
                      </td>

                      {/* 증감율 */}
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <span className="text-xs text-app-muted">-</span>
                        ) : pct !== null ? (
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

                      {/* 작업 */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-green-600 hover:text-green-700 transition rounded disabled:opacity-50"
                                title="저장"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-app-muted hover:text-red-600 transition rounded disabled:opacity-50"
                                title="취소"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(idx, item)}
                                className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-app-muted hover:text-app-accent transition rounded"
                                title="편집"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(idx, item.item)}
                                className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-app-muted hover:text-red-600 transition rounded"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogTitle>항목 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget.itemName}" 항목을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
            </AlertDialogDescription>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSaving ? "삭제 중..." : "삭제"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 완료 모달 */}
      {successModal && (
        <AlertDialog open={!!successModal} onOpenChange={() => setSuccessModal(null)}>
          <AlertDialogContent>
            <AlertDialogTitle>
              {successModal.type === "edit" ? "수정 완료" : "삭제 완료"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              "{successModal.itemName}" 항목이{" "}
              {successModal.type === "edit" ? "수정" : "삭제"}되었습니다.
            </AlertDialogDescription>
            <div className="flex gap-2 justify-end">
              <AlertDialogAction onClick={() => setSuccessModal(null)}>
                확인
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 통계 정보 */}
      {filteredData.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-app-bg rounded-lg p-4 border border-app-border">
            <p className="text-xs text-app-muted mb-1">총 항목 수</p>
            <p className="text-2xl font-bold text-app-text">{filteredData.length}</p>
          </div>
          <div className="bg-app-bg rounded-lg p-4 border border-app-border">
            <p className="text-xs text-app-muted mb-1">전체 합계</p>
            <p className="text-2xl font-bold text-app-accent">
              {filteredData
                .filter((i) => i.item === "합계")
                .reduce((sum, i) => sum + (i.amount || 0), 0)
                .toLocaleString()}
              원
            </p>
          </div>
          <div className="bg-app-bg rounded-lg p-4 border border-app-border">
            <p className="text-xs text-app-muted mb-1">최대 항목</p>
            <p className="text-sm text-app-text truncate">
              {filteredData
                .filter((i) => i.item !== "합계")
                .sort((a, b) => (b.amount || 0) - (a.amount || 0))[0]?.item || "-"}
            </p>
          </div>
          <div className="bg-app-bg rounded-lg p-4 border border-app-border">
            <p className="text-xs text-app-muted mb-1">증감 현황</p>
            <p
              className={`text-sm font-semibold ${
                filteredData.reduce((sum, i) => sum + (i.diff || 0), 0) > 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {filteredData.reduce((sum, i) => sum + (i.diff || 0), 0) > 0 ? "↑" : "↓"}{" "}
              {Math.abs(
                filteredData.reduce((sum, i) => sum + (i.diff || 0), 0)
              ).toLocaleString()}
              원
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
