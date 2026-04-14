"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { saveRawSheet } from "@/lib/firestore";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";
import type { ManagementRecord, RawSheet } from "@/lib/store";

interface AnalyzeResult {
  year: number;
  month: number;
  items: ManagementRecord[];
}

export function UploadView() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [inputYear, setInputYear] = useState<string>("");
  const [inputMonth, setInputMonth] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const { setRecords, setRawSheet, setActiveView, setSelectedYear } = useStore();
  const isOnline = useStore((state) => state.isOnline);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && ["image/jpeg", "image/png"].includes(file.type)) {
      setSelectedFile(file);
      setAnalysisResult(null);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // 숫자만 허용
    if (value.length <= 4) {
      setInputYear(value);
      // 4자리 입력 시 월 필드로 자동 포커스
      if (value.length === 4) {
        monthInputRef.current?.focus();
      }
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // 숫자만 허용
    const month = value ? parseInt(value, 10) : 0;
    if (month <= 12 || value === "") {
      setInputMonth(value);
    }
  };

  const isFormValid = inputYear.length === 4 && inputMonth !== "" && parseInt(inputMonth, 10) >= 1 && parseInt(inputMonth, 10) <= 12;

  const handleAnalyze = async () => {
    if (!selectedFile || !preview || !isFormValid) return;

    if (!isOnline) {
      setError("인터넷 연결이 필요합니다. 온라인 상태에서 다시 시도해주세요.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("사용자 인증이 필요합니다");

      const idToken = await user.getIdToken();

      // Convert base64 from data URI
      const b64 = preview.split(",")[1];
      const mediaType = (selectedFile.type === "image/png"
        ? "image/png"
        : "image/jpeg") as "image/jpeg" | "image/png";

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          b64,
          mediaType,
          idToken,
          year: parseInt(inputYear, 10),
          month: parseInt(inputMonth, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || "분석 실패";
        if (errorData.raw) {
          throw new Error(`${errorMsg}\n\n응답: ${errorData.raw.substring(0, 200)}`);
        }
        throw new Error(errorMsg);
      }

      const result: AnalyzeResult = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "분석 중 오류 발생";
      setError(message);
      console.error("Analyze error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysisResult) return;

    setIsSaving(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("사용자 인증이 필요합니다");

      const yearMonth = `${analysisResult.year}-${String(analysisResult.month).padStart(2, "0")}`;
      const rawSheetData: RawSheet = {
        items: analysisResult.items,
        updatedAt: Date.now(),
      };

      // Firestore에 저장
      await saveRawSheet(user.uid, yearMonth, rawSheetData);

      // Store 업데이트 (rawSheets와 records 모두)
      setRawSheet(yearMonth, rawSheetData);
      setRecords(analysisResult.items);

      // selectedYear 업데이트 - Sidebar에서 해당 연도 자동 펼침
      setSelectedYear(analysisResult.year);

      setActiveView("dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "저장 중 오류 발생";
      setError(message);
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-app-bg via-surface to-app-bg">
      <div className="w-full max-w-2xl">
        {/* 헤더 영역 */}
        {!analysisResult && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-app-accent/10 mb-6">
              <Upload className="w-8 h-8 text-app-accent" />
            </div>
            <h1 className="text-4xl font-bold text-app-text mb-3">
              영수증 스캔하기
            </h1>
            <p className="text-lg text-app-muted">
              관리비 납입영수증을 촬영하고 AI가 자동으로 분석해 드립니다
            </p>
          </div>
        )}

        {/* 파일 선택 또는 미리보기 */}
        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-app-border bg-gradient-to-br from-surface/50 to-surface/30 p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 hover:border-app-accent hover:bg-app-accent/5 hover:shadow-lg"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-app-accent/5 to-transparent"></div>
            </div>

            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-app-accent/10 mb-6 group-hover:bg-app-accent/20 transition-colors">
                <Upload className="w-10 h-10 text-app-accent" />
              </div>
              <p className="text-xl font-semibold text-app-text mb-2">파일을 여기에 드래그하세요</p>
              <p className="text-base text-app-muted mb-4">또는 클릭하여 파일 선택</p>
              <p className="text-sm text-app-muted/70">JPG, PNG 형식 지원 (최대 10MB)</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 이미지 미리보기 */}
            <div className="rounded-2xl overflow-hidden border border-app-border shadow-lg">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-96 object-contain bg-surface"
              />
            </div>

            {!analysisResult && (
              <div className="rounded-xl bg-gradient-to-br from-surface/50 to-surface/30 p-6">
                <label className="block text-sm font-semibold text-app-text mb-4">
                  년월 입력 (필수)
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-app-muted mb-2">연도 (4자리)</label>
                    <input
                      ref={yearInputRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="2026"
                      value={inputYear}
                      onChange={handleYearChange}
                      maxLength={4}
                      className="w-full px-4 py-2 rounded-lg border border-app-border bg-surface text-app-text placeholder-app-muted focus:outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-app-muted mb-2">월 (1-12)</label>
                    <input
                      ref={monthInputRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="3"
                      value={inputMonth}
                      onChange={handleMonthChange}
                      maxLength={2}
                      className="w-full px-4 py-2 rounded-lg border border-app-border bg-surface text-app-text placeholder-app-muted focus:outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && isFormValid) {
                          handleAnalyze();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {!analysisResult && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isAnalyzing}
                  className="flex-1 h-12 rounded-xl text-base font-semibold"
                >
                  다시 선택
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !isFormValid || !isOnline}
                  className="flex-1 h-12 rounded-xl text-base font-semibold bg-app-accent hover:bg-app-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!isOnline ? "인터넷 연결이 필요합니다" : ""}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      AI 분석 시작
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 분석 결과 테이블 */}
        {analysisResult && (
          <div className="space-y-6">
            {/* 분석 완료 헤더 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-app-text mb-1">분석 완료</h2>
              <p className="text-app-muted">데이터가 정상적으로 추출되었습니다</p>
            </div>

            {/* 결과 카드 */}
            <div className="rounded-2xl bg-gradient-to-br from-app-accent/5 to-app-accent/10 border border-app-accent/20 p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-app-accent/20">
                <div>
                  <p className="text-sm font-semibold text-app-muted mb-2">연도</p>
                  <p className="text-3xl font-bold text-app-accent">{analysisResult.year}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-app-muted mb-2">월</p>
                  <p className="text-3xl font-bold text-app-accent">{analysisResult.month}</p>
                </div>
              </div>

              {/* 항목 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-app-border">
                      <th className="text-left py-3 px-2 font-semibold text-app-text">항목</th>
                      <th className="text-right py-3 px-2 font-semibold text-app-text">당월</th>
                      <th className="text-right py-3 px-2 font-semibold text-app-text">전월</th>
                      <th className="text-right py-3 px-2 font-semibold text-app-text">증감</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-app-border/50 hover:bg-white/50 transition-colors">
                        <td className="py-3 px-2 text-app-text font-medium">{item.item}</td>
                        <td className="py-3 px-2 text-right text-app-text">
                          {item.amount !== null ? item.amount.toLocaleString() : "-"}
                        </td>
                        <td className="py-3 px-2 text-right text-app-text">
                          {item.prev !== null ? item.prev.toLocaleString() : "-"}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-app-accent">
                          {item.diff !== null ? (item.diff >= 0 ? "+" : "") + item.diff.toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 저장/다시 선택 버튼 */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl text-base font-semibold"
              >
                다시 선택
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    데이터 저장
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
