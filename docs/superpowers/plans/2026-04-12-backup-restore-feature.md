# Backup/Restore Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete backup/restore functionality in SettingsView with full backup, period-based backup, restore-only capability, and move full-reset to a danger zone section.

**Architecture:** Create a dedicated utility module (`lib/backup.ts`) for Excel generation/parsing using the xlsx library, then integrate backup/restore/reset sections into SettingsView component with Firestore persistence and store updates.

**Tech Stack:** React 19, TypeScript, Zustand, Firebase/Firestore, xlsx (0.18.5), Next.js 16

---

## File Structure

**Files to create:**
- `lib/backup.ts` — Backup/restore utility functions for Excel file generation, parsing, and validation

**Files to modify:**
- `components/layout/Sidebar.tsx` — Remove '전체 초기화' button
- `components/views/SettingsView.tsx` — Add three sections: backup, restore, danger zone

---

## Task 1: Create Backup Utility Module

**Files:**
- Create: `lib/backup.ts`

### Step 1: Create backup.ts with type definitions

```typescript
import { RawSheet, ManagementRecord } from "./store";

export interface ParsedData {
  rawSheets: { [key: string]: RawSheet };
}

export interface BackupMetadata {
  createdAt: string;
  type: "full" | "period"; // "full" for complete backup, "period" for date-range backup
  startMonth?: string; // YYYY-MM for period backups
  endMonth?: string; // YYYY-MM for period backups
}
```

### Step 2: Implement validateBackupFileName

```typescript
export function validateBackupFileName(fileName: string): boolean {
  // Full backup: YYYY-MM-DD-전체관리비내역.xlsx
  // Period backup: YYYY-MM-DD-YYYY-MM-DD-기간관리비내역.xlsx
  
  const fullBackupRegex = /^\d{4}-\d{2}-\d{2}-전체관리비내역\.xlsx$/;
  const periodBackupRegex = /^\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-기간관리비내역\.xlsx$/;
  
  return fullBackupRegex.test(fileName) || periodBackupRegex.test(fileName);
}
```

### Step 3: Implement generateFullBackupFile

```typescript
export function generateFullBackupFile(rawSheets: { [key: string]: RawSheet }): Blob {
  const XLSX = require("xlsx");
  
  // Sort months in ascending order
  const sortedMonths = Object.keys(rawSheets).sort();
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add each month as a sheet
  sortedMonths.forEach((yearMonth) => {
    const sheet = rawSheets[yearMonth];
    const sheetName = yearMonth; // e.g., "2026-01"
    
    // Prepare data: [연도-월, 항목, 금월, 전월, 증감]
    const data = [
      ["연도-월", "항목", "금월", "전월", "증감"],
      ...sheet.items.map((item) => [
        yearMonth,
        item.item,
        item.amount !== null ? item.amount : "",
        item.prev !== null ? item.prev : "",
        item.diff !== null ? item.diff : "",
      ]),
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  
  // Generate blob
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
```

### Step 4: Implement generatePeriodBackupFile

```typescript
export function generatePeriodBackupFile(
  rawSheets: { [key: string]: RawSheet },
  startMonth: string, // YYYY-MM
  endMonth: string    // YYYY-MM
): Blob {
  const XLSX = require("xlsx");
  
  // Filter months within range
  const sortedMonths = Object.keys(rawSheets)
    .filter((month) => month >= startMonth && month <= endMonth)
    .sort();
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add each month as a sheet
  sortedMonths.forEach((yearMonth) => {
    const sheet = rawSheets[yearMonth];
    const sheetName = yearMonth;
    
    const data = [
      ["연도-월", "항목", "금월", "전월", "증감"],
      ...sheet.items.map((item) => [
        yearMonth,
        item.item,
        item.amount !== null ? item.amount : "",
        item.prev !== null ? item.prev : "",
        item.diff !== null ? item.diff : "",
      ]),
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  
  // Generate blob
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
```

### Step 5: Implement parseBackupFile

```typescript
export async function parseBackupFile(file: File): Promise<ParsedData> {
  const XLSX = require("xlsx");
  
  // Validate filename
  if (!validateBackupFileName(file.name)) {
    throw new Error("유효하지 않은 백업 파일 형식입니다. 전체 백업 파일만 복구할 수 있습니다.");
  }
  
  // Check if it's a full backup file (not period backup)
  if (file.name.includes("기간")) {
    throw new Error("기간 백업 파일은 복구할 수 없습니다. 전체 백업 파일만 복구 가능합니다.");
  }
  
  // Read file
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
  
  const rawSheets: { [key: string]: RawSheet } = {};
  
  // Process each sheet (one sheet per month)
  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    
    if (data.length < 2) {
      throw new Error(`시트 "${sheetName}"에 유효한 데이터가 없습니다.`);
    }
    
    const headers = data[0] as string[];
    
    // Validate schema
    const expectedHeaders = ["연도-월", "항목", "금월", "전월", "증감"];
    if (headers.length < expectedHeaders.length) {
      throw new Error(`시트 "${sheetName}"의 열 구조가 올바르지 않습니다.`);
    }
    
    // Parse items
    const items: ManagementRecord[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (row.length === 0 || (row[0] === undefined && row[1] === undefined)) {
        continue; // Skip empty rows
      }
      
      items.push({
        item: String(row[1] || ""),
        amount: typeof row[2] === "number" ? row[2] : null,
        prev: typeof row[3] === "number" ? row[3] : null,
        diff: typeof row[4] === "number" ? row[4] : null,
      });
    }
    
    rawSheets[sheetName] = {
      items,
      updatedAt: new Date().getTime(),
    };
  });
  
  return { rawSheets };
}
```

### Step 6: Implement validateBackupData

```typescript
export function validateBackupData(data: ParsedData): boolean {
  if (!data || !data.rawSheets) {
    return false;
  }
  
  // Check if rawSheets is an object with at least one month
  if (Object.keys(data.rawSheets).length === 0) {
    return false;
  }
  
  // Validate each sheet
  for (const [yearMonth, sheet] of Object.entries(data.rawSheets)) {
    // Validate month format YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      return false;
    }
    
    // Check items array exists
    if (!Array.isArray(sheet.items)) {
      return false;
    }
    
    // Validate each item
    for (const item of sheet.items) {
      if (!item.item || typeof item.item !== "string") {
        return false;
      }
    }
  }
  
  return true;
}
```

### Step 7: Add download helper function

```typescript
export function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### Step 8: Commit backup utilities

```bash
git add lib/backup.ts
git commit -m "feat: add backup/restore utility functions with Excel support"
```

---

## Task 2: Remove Reset Button from Sidebar

**Files:**
- Modify: `components/layout/Sidebar.tsx`

### Step 1: Read current Sidebar to find reset button

Look for the '전체 초기화' button in Sidebar.tsx (check around line 100-150)

### Step 2: Remove the reset button section

Find the section with '전체 초기화' button and delete it entirely. Keep the rest of the Sidebar structure intact. The Sidebar should only show year-based folder structure with months, without any reset functionality.

### Step 3: Commit changes

```bash
git add components/layout/Sidebar.tsx
git commit -m "feat: remove full reset button from sidebar"
```

---

## Task 3: Update SettingsView with Backup/Restore Sections

**Files:**
- Modify: `components/views/SettingsView.tsx`

### Step 1: Add required imports and state

Update the imports and add new state variables:

```typescript
import { useState } from "react";
import { useStore } from "@/lib/store";
import { saveUserProfile, saveAllRawSheets, deleteAll } from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  generateFullBackupFile,
  generatePeriodBackupFile,
  parseBackupFile,
  downloadFile,
  validateBackupData,
} from "@/lib/backup";

// In the component, add after existing state:
const [backupType, setBackupType] = useState<"full" | "period">("full");
const [periodStart, setPeriodStart] = useState("");
const [periodEnd, setPeriodEnd] = useState("");
const [isBackingUp, setIsBackingUp] = useState(false);
const [isRestoring, setIsRestoring] = useState(false);
const [isResetting, setIsResetting] = useState(false);
const [resetConfirm, setResetConfirm] = useState("");
```

### Step 2: Add handleBackup function

```typescript
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
```

### Step 3: Add handleRestore function

```typescript
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

    // Update store
    useStore.getState().rawSheets = parsedData.rawSheets;

    setMessage({ type: "success", text: "데이터가 성공적으로 복구되었습니다." });

    // Reset file input
    event.target.value = "";
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "복구 중 오류 발생";
    setMessage({ type: "error", text: errorMsg });
    console.error("Restore error:", error);
  } finally {
    setIsRestoring(false);
  }
};
```

### Step 4: Add handleReset function

```typescript
const handleReset = async () => {
  try {
    setIsResetting(true);
    setMessage(null);

    if (resetConfirm !== "초기화") {
      setMessage({ type: "error", text: "확인 텍스트를 정확히 입력해주세요." });
      return;
    }

    const confirmed = window.confirm(
      "모든 데이터가 영구적으로 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다."
    );

    if (!confirmed) {
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
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "초기화 중 오류 발생";
    setMessage({ type: "error", text: errorMsg });
    console.error("Reset error:", error);
  } finally {
    setIsResetting(false);
  }
};
```

### Step 5: Add getAvailableMonths helper

```typescript
const getAvailableMonths = () => {
  const rawSheets = useStore.getState().rawSheets;
  return Object.keys(rawSheets).sort();
};
```

### Step 6: Add Backup/Restore section JSX (before closing div)

Add this section after the Apartment Info section, before the closing `</div>`:

```typescript
{/* 백업/복구 섹션 */}
<div className="bg-surface rounded-lg border border-app-border p-4 sm:p-6 mb-6">
  <h2 className="text-lg font-semibold text-app-text mb-4">백업 및 복구</h2>

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
  </div>
</div>

{/* 위험 영역 섹션 */}
<div className="bg-surface rounded-lg border border-red-200 p-4 sm:p-6 mb-6">
  <h2 className="text-lg font-semibold text-red-600 mb-4">위험 영역</h2>
  
  <div className="space-y-4">
    <p className="text-sm text-app-muted">
      아래 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
    </p>
    
    <div>
      <label className="block text-sm font-medium text-app-text mb-2">
        전체 초기화 확인
      </label>
      <p className="text-xs text-app-muted mb-3">
        모든 데이터를 삭제하려면 아래에 "초기화"를 입력하세요.
      </p>
      <input
        type="text"
        value={resetConfirm}
        onChange={(e) => setResetConfirm(e.target.value)}
        placeholder="초기화"
        className="w-full px-4 py-2 border border-app-border rounded-lg bg-white text-app-text placeholder-app-subtle focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      />
    </div>

    <Button
      onClick={handleReset}
      disabled={isResetting || resetConfirm !== "초기화"}
      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isResetting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          초기화 중...
        </>
      ) : (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          전체 초기화
        </>
      )}
    </Button>
  </div>
</div>
```

### Step 7: Commit SettingsView changes

```bash
git add components/views/SettingsView.tsx
git commit -m "feat: add backup/restore and danger zone sections to settings"
```

---

## Task 4: Integration Testing

**Files:**
- Test: Manual testing of backup/restore workflow

### Step 1: Test full backup generation

- In browser, navigate to Settings
- Click "전체 백업" radio button
- Click "백업 다운로드"
- Verify: Excel file downloads with name format `YYYY-MM-DD-전체관리비내역.xlsx`
- Open file in Excel and verify sheet structure: sheets named by month (2026-01, 2026-02, etc.), columns (연도-월, 항목, 금월, 전월, 증감)

### Step 2: Test period backup generation

- In Settings, click "기간 백업" radio button
- Select start month (e.g., 2026-01) and end month (e.g., 2026-03)
- Click "백업 다운로드"
- Verify: File downloads with name format `YYYY-MM-DD-YYYY-MM-DD-기간관리비내역.xlsx`
- Open file and verify only selected months are included

### Step 3: Test restore functionality

- In Settings, scroll to "복구" section
- Upload a previously downloaded full backup file
- Verify: Confirmation dialog appears
- Click confirm and verify: success message appears
- Verify: Data in tables/charts updates to match restored data

### Step 4: Test restore validation

- Try uploading a period backup file (기간관리비내역.xlsx)
- Verify: Error message "기간 백업 파일은 복구할 수 없습니다"
- Try uploading a non-xlsx file
- Verify: Error message about invalid file format

### Step 5: Test full reset functionality

- In "위험 영역" section, type "초기화" in the confirm input
- Click "전체 초기화"
- Verify: Confirmation dialog appears
- Click confirm
- Verify: Success message and all data cleared from dashboard/tables

### Step 6: Commit testing completion

```bash
git add -A
git commit -m "test: verify backup/restore/reset functionality"
```

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ Full backup: `generateFullBackupFile()` in Task 1, UI in Task 3
- ✅ Period backup: `generatePeriodBackupFile()` in Task 1, UI with date range selectors in Task 3
- ✅ Restore (full only): `parseBackupFile()` with validation in Task 1, restore button in Task 3
- ✅ File validation: `validateBackupFileName()` and `validateBackupData()` in Task 1
- ✅ Danger zone section: Task 3 with reset confirmation
- ✅ Remove from Sidebar: Task 2
- ✅ Firestore integration: Using `saveAllRawSheets()`, `deleteAll()` in Task 3
- ✅ Store integration: Using `useStore` and `resetAll()` in Task 3

**Placeholder Scan:**
- ✅ All code blocks are complete with real implementations
- ✅ All file paths are exact
- ✅ All function signatures match between tasks
- ✅ All error messages are localized to Korean
- ✅ No "TBD", "TODO", or placeholder text

**Type Consistency:**
- ✅ `backupType: "full" | "period"` consistent across Task 1 and Task 3
- ✅ `ParsedData` interface with `rawSheets: { [key: string]: RawSheet }` matches store
- ✅ Function signatures for `generateFullBackupFile()` and `generatePeriodBackupFile()` consistent
- ✅ `ManagementRecord` import from store matches usage in `parseBackupFile()`
