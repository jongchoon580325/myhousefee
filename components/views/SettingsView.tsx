"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { saveUserProfile, saveAllRawSheets, deleteAll } from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import {
  generateFullBackupFile,
  generatePeriodBackupFile,
  parseBackupFile,
  downloadFile,
  validateBackupData,
  generateFullPDF,
  generatePeriodPDF,
} from "@/lib/backup";

export function SettingsView() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  const [apartmentName, setApartmentName] = useState(user?.apartmentName || "");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Backup/Restore/PDF state
  const [backupType, setBackupType] = useState<"full" | "period">("full");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPrintingPDF, setIsPrintingPDF] = useState(false);
  const [pdfType, setPdfType] = useState<"full" | "period">("full");
  const [pdfPeriodStart, setPdfPeriodStart] = useState("");
  const [pdfPeriodEnd, setPdfPeriodEnd] = useState("");

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = async () => {
    if (!user?.uid || !apartmentName.trim()) {
      setMessage({ type: "error", text: "아파트 이름은 필수입니다." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("사용자 인증이 필요합니다");

      await saveUserProfile(user.uid, { apartmentName: apartmentName.trim(), address });

      // Update store
      setUser({
        ...user,
        apartmentName: apartmentName.trim(),
      });

      setMessage({ type: "success", text: "설정이 저장되었습니다." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장 중 오류 발생";
      setMessage({ type: "error", text: message });
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      setMessage(null);

      const rawSheets = useStore.getState().rawSheets;
      if (Object.keys(rawSheets).length === 0) {
        setMessage({ type: "error", text: "백업할 데이터가 없습니다." });
        return;
      }

      let blob: Blob;
      let fileName: string;

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      if (backupType === "full") {
        blob = generateFullBackupFile(rawSheets);
        fileName = `${dateStr}-전체관리비내역.xlsx`;
      } else {
        if (!periodStart || !periodEnd) {
          setMessage({ type: "error", text: "시작 월과 종료 월을 선택해주세요." });
          return;
        }
        if (periodStart > periodEnd) {
          setMessage({ type: "error", text: "시작 월이 종료 월보다 클 수 없습니다." });
          return;
        }
        blob = generatePeriodBackupFile(rawSheets, periodStart, periodEnd);
        fileName = `${dateStr}-${periodEnd}-기간관리비내역.xlsx`;
      }

      downloadFile(blob, fileName);
      setMessage({ type: "success", text: "백업 파일이 다운로드되었습니다." });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "백업 중 오류 발생";
      setMessage({ type: "error", text: errorMsg });
      console.error("Backup error:", error);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsRestoring(true);
      setMessage(null);

      const file = event.target.files?.[0];
      if (!file) return;

      // Parse file
      const parsedData = await parseBackupFile(file);

      // Validate data
      if (!validateBackupData(parsedData)) {
        setMessage({ type: "error", text: "백업 파일의 데이터 형식이 올바르지 않습니다." });
        return;
      }

      // Show confirmation
      const confirmed = window.confirm(
        `${Object.keys(parsedData.rawSheets).length}개월의 데이터로 완전히 대체하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
      );

      if (!confirmed) {
        return;
      }

      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("사용자 인증이 필요합니다");

      // Save to Firestore
      await saveAllRawSheets(currentUser.uid, parsedData.rawSheets);

      // Update store: delete old sheets and add new ones
      const currentState = useStore.getState();
      const oldMonths = Object.keys(currentState.rawSheets);
      oldMonths.forEach((month) => {
        currentState.deleteRawSheet(month);
      });

      Object.entries(parsedData.rawSheets).forEach(([yearMonth, sheet]) => {
        currentState.setRawSheet(yearMonth, sheet);
      });

      setMessage({ type: "success", text: "데이터가 성공적으로 복구되었습니다." });

      // Reset file input
      event.target.value = "";

      // Reload page to ensure UI updates with fresh data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "복구 중 오류 발생";
      setMessage({ type: "error", text: errorMsg });
      console.error("Restore error:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePrintPDF = async () => {
    try {
      setIsPrintingPDF(true);
      setMessage(null);

      const rawSheets = useStore.getState().rawSheets;
      if (Object.keys(rawSheets).length === 0) {
        setMessage({ type: "error", text: "출력할 데이터가 없습니다." });
        return;
      }

      let blob: Blob;
      let fileName: string;

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      if (pdfType === "full") {
        blob = await generateFullPDF(rawSheets);
        fileName = `${dateStr}-전체관리비내역.pdf`;
      } else {
        if (!pdfPeriodStart || !pdfPeriodEnd) {
          setMessage({ type: "error", text: "시작 월과 종료 월을 선택해주세요." });
          return;
        }
        if (pdfPeriodStart > pdfPeriodEnd) {
          setMessage({ type: "error", text: "시작 월이 종료 월보다 클 수 없습니다." });
          return;
        }
        blob = await generatePeriodPDF(rawSheets, pdfPeriodStart, pdfPeriodEnd);
        fileName = `${dateStr}-${pdfPeriodEnd}-기간관리비내역.pdf`;
      }

      downloadFile(blob, fileName);
      setMessage({ type: "success", text: "PDF 파일이 다운로드되었습니다." });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "PDF 출력 중 오류 발생";
      setMessage({ type: "error", text: errorMsg });
      console.error("PDF print error:", error);
    } finally {
      setIsPrintingPDF(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      setMessage(null);

      if (resetConfirm !== "초기화") {
        setMessage({ type: "error", text: "확인 텍스트를 정확히 입력해주세요." });
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("사용자 인증이 필요합니다");

      // Delete all data from Firestore
      await deleteAll(currentUser.uid);

      // Reset store
      useStore.getState().resetAll();

      setMessage({ type: "success", text: "모든 데이터가 삭제되었습니다." });
      setResetConfirm("");
      setShowResetModal(false);

      // Reload page to ensure UI updates
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "초기화 중 오류 발생";
      setMessage({ type: "error", text: errorMsg });
      console.error("Reset error:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const getAvailableMonths = () => {
    const rawSheets = useStore.getState().rawSheets;
    return Object.keys(rawSheets).sort();
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-app-text mb-8">설정</h1>

      {/* 사용자 정보 섹션 */}
      <div className="bg-surface rounded-lg border border-app-border p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-app-text mb-4">사용자 정보</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="h-16 w-16 rounded-full"
              />
            )}
            <div className="flex-1">
              <p className="text-sm text-app-muted mb-1">이름</p>
              <p className="font-semibold text-app-text">{user?.displayName || "이름 없음"}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-app-muted mb-1">이메일</p>
            <p className="font-semibold text-app-text">{user?.email || "이메일 없음"}</p>
          </div>
        </div>
      </div>

      {/* 아파트 정보 섹션 */}
      <div className="bg-surface rounded-lg border border-app-border p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-app-text mb-4">아파트 정보</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-app-text mb-2">
              아파트 이름 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={apartmentName}
              onChange={(e) => setApartmentName(e.target.value)}
              placeholder="예: 한일타운 101동"
              className="w-full px-4 py-2 border border-app-border rounded-lg bg-white text-app-text placeholder-app-subtle focus:outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
            />
            <p className="text-xs text-app-muted mt-1">
              앱 헤더의 로고명으로 표시됩니다
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text mb-2">
              아파트 주소 <span className="text-app-muted">(선택)</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="예: 서울시 강남구 테헤란로"
              className="w-full px-4 py-2 border border-app-border rounded-lg bg-white text-app-text placeholder-app-subtle focus:outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
            />
          </div>

          {/* 메시지 */}
          {message && (
            <div
              className={`rounded-lg p-3 flex items-start gap-3 ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm ${
                  message.type === "success" ? "text-green-700" : "text-red-700"
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto bg-app-accent hover:bg-app-accent/90 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 백업/복구 & 출력 섹션 */}
      <div className="bg-surface rounded-lg border border-app-border p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-app-text mb-4">백업 및 복구 & 출력</h2>

        <div className="space-y-6">
          {/* 백업 옵션 */}
          <div>
            <label className="block text-sm font-medium text-app-text mb-3">백업 유형</label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="full"
                  checked={backupType === "full"}
                  onChange={(e) => setBackupType(e.target.value as "full" | "period")}
                  className="w-4 h-4"
                />
                <span className="text-sm text-app-text">전체 백업</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="period"
                  checked={backupType === "period"}
                  onChange={(e) => setBackupType(e.target.value as "full" | "period")}
                  className="w-4 h-4"
                />
                <span className="text-sm text-app-text">기간 백업</span>
              </label>
            </div>

            {backupType === "period" && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-app-text mb-1">시작 월</label>
                  <select
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border border-app-border rounded-lg bg-white text-app-text text-sm focus:outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                  >
                    <option value="">선택...</option>
                    {getAvailableMonths().map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-app-text mb-1">종료 월</label>
                  <select
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-app-border rounded-lg bg-white text-app-text text-sm focus:outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                  >
                    <option value="">선택...</option>
                    {getAvailableMonths().map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <Button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full sm:w-auto bg-app-accent hover:bg-app-accent/90 text-white"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  백업 중...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  백업 다운로드
                </>
              )}
            </Button>
          </div>

          {/* 복구 옵션 */}
          <div className="border-t border-app-border pt-4">
            <label className="block text-sm font-medium text-app-text mb-3">복구</label>
            <p className="text-xs text-app-muted mb-3">
              전체 백업 파일만 업로드 가능하며, 기존 데이터가 완전히 대체됩니다.
            </p>
            <label className="block">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleRestore}
                disabled={isRestoring}
                className="block w-full text-sm text-app-text
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-app-accent file:text-white
                  hover:file:bg-app-accent/90
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
          </div>

          {/* 출력 옵션 */}
          <div className="border-t border-app-border pt-4">
            <label className="block text-sm font-medium text-app-text mb-3">출력</label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="full"
                  checked={pdfType === "full"}
                  onChange={(e) => setPdfType(e.target.value as "full" | "period")}
                  className="w-4 h-4"
                />
                <span className="text-sm text-app-text">전체 PDF</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="period"
                  checked={pdfType === "period"}
                  onChange={(e) => setPdfType(e.target.value as "full" | "period")}
                  className="w-4 h-4"
                />
                <span className="text-sm text-app-text">기간 PDF</span>
              </label>
            </div>

            {pdfType === "period" && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-app-text mb-1">시작 월</label>
                  <select
                    value={pdfPeriodStart}
                    onChange={(e) => setPdfPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border border-app-border rounded-lg bg-white text-app-text text-sm focus:outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                  >
                    <option value="">선택...</option>
                    {getAvailableMonths().map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-app-text mb-1">종료 월</label>
                  <select
                    value={pdfPeriodEnd}
                    onChange={(e) => setPdfPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-app-border rounded-lg bg-white text-app-text text-sm focus:outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                  >
                    <option value="">선택...</option>
                    {getAvailableMonths().map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <Button
              onClick={handlePrintPDF}
              disabled={isPrintingPDF}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPrintingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  출력 중...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  PDF 출력
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 위험 영역 섹션 */}
      <div className="bg-surface rounded-lg border border-red-200 p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-red-600 mb-4">위험 영역</h2>

        <div className="space-y-4">
          <p className="text-sm text-app-muted">
            아래 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
          </p>

          <Button
            onClick={() => setShowResetModal(true)}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            전체 초기화
          </Button>
        </div>
      </div>

      {/* 전체 초기화 모달 */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg border border-app-border max-w-sm w-full shadow-xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between border-b border-app-border p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-red-600">전체 데이터 삭제</h3>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirm("");
                }}
                className="text-app-muted hover:text-app-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-app-text">
                모든 데이터가 영구적으로 삭제됩니다. 이 작업은 취소할 수 없습니다.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-medium text-red-700 mb-1">확인 필수</p>
                <p className="text-xs text-red-600">
                  아래에 "초기화"를 입력하여 작업을 확인해주세요.
                </p>
              </div>

              <input
                type="text"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder="초기화"
                className="w-full px-4 py-2 border border-app-border rounded-lg bg-white text-app-text placeholder-app-subtle focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {/* 모달 푸터 */}
            <div className="flex gap-3 border-t border-app-border p-4 sm:p-6 justify-end">
              <Button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirm("");
                }}
                className="px-4 py-2 border border-app-border bg-surface hover:bg-surface2 text-app-text rounded-lg"
              >
                취소
              </Button>
              <Button
                onClick={handleReset}
                disabled={isResetting || resetConfirm !== "초기화"}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
