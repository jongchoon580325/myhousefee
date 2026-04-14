# 이미지 업로드 수동 입력 및 사이드바 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미지 업로드 시 OCR 자동 판독을 제거하고 사용자가 수동으로 년/월을 입력하도록 변경하며, 사이드바를 연도별 펼침/닫힘 구조로 개선합니다.

**Architecture:** 
- UploadView에 년도(4자리)/월(1-12) 입력 필드 추가, 자동 포커스 이동 및 필수 입력 검증
- API 요청 시 사용자 입력 year/month를 포함하여 OCR 의존성 제거
- Sidebar에 로컬 상태(expandedYears)로 펼침/닫힘 관리, selectedYear 변경 시 자동 펼침
- 저장 후 selectedYear 업데이트하여 Sidebar에서 해당 연도 자동 펼침

**Tech Stack:** React, TypeScript, Zustand (Store), Next.js API routes

---

## 파일 구조

```
haniltown/
├── components/
│   ├── views/
│   │   └── UploadView.tsx (수정)
│   └── layout/
│       └── Sidebar.tsx (수정)
├── app/
│   └── api/
│       └── analyze/
│           └── route.ts (수정)
└── lib/
    └── store.ts (기존 사용, 변경 없음)
```

---

## 구현 Task

### Task 1: UploadView - 년/월 입력 필드 UI 추가

**Files:**
- Modify: `haniltown/components/views/UploadView.tsx:1-45` (상태 선언 부분)

**Description:** 년도/월 입력 상태를 Store에서 분리하여 로컬 상태로 관리합니다. 입력 필드를 미리보기 아래에 추가합니다.

- [ ] **Step 1: UploadView에 년/월 로컬 상태 추가**

`UploadView.tsx`의 상태 선언 부분에 추가:

```typescript
const [inputYear, setInputYear] = useState<string>("");
const [inputMonth, setInputMonth] = useState<string>("");
```

- [ ] **Step 2: 년도 입력 필드 핸들러 추가**

```typescript
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
```

- [ ] **Step 3: Ref 추가 (월 입력 필드 포커스용)**

```typescript
const monthInputRef = useRef<HTMLInputElement>(null);
const yearInputRef = useRef<HTMLInputElement>(null);
```

- [ ] **Step 4: 년/월 입력 필드 렌더링 추가 (미리보기 아래)**

미리보기 이미지를 렌더링하는 부분(`<img src={preview}...`) 아래에 추가:

```typescript
{!analysisResult && (
  <div className="rounded-xl bg-gradient-to-br from-surface/50 to-surface/30 p-6 mb-6">
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
```

- [ ] **Step 5: 입력값 검증 함수 추가**

```typescript
const isFormValid = inputYear.length === 4 && inputMonth !== "" && parseInt(inputMonth, 10) >= 1 && parseInt(inputMonth, 10) <= 12;
```

- [ ] **Step 6: Commit**

```bash
cd haniltown
git add components/views/UploadView.tsx
git commit -m "feat: UploadView에 년/월 입력 필드 UI 추가 및 자동 포커스 로직"
```

---

### Task 2: UploadView - 분석 버튼 활성화/비활성화 로직

**Files:**
- Modify: `haniltown/components/views/UploadView.tsx:185-215` (분석 버튼 부분)

**Description:** 분석 버튼의 활성화 상태를 `isFormValid` 조건에 연동합니다.

- [ ] **Step 1: 분석 버튼 비활성화 조건 수정**

분석 버튼 부분을 다음과 같이 수정:

```typescript
<Button
  onClick={handleAnalyze}
  disabled={isAnalyzing || !isFormValid}  // isFormValid 조건 추가
  className="flex-1 h-12 rounded-xl text-base font-semibold bg-app-accent hover:bg-app-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
```

- [ ] **Step 2: Commit**

```bash
cd haniltown
git add components/views/UploadView.tsx
git commit -m "feat: 분석 버튼 활성화/비활성화 로직 추가 (년/월 필수 입력)"
```

---

### Task 3: UploadView - API 요청 수정 (year/month 포함)

**Files:**
- Modify: `haniltown/components/views/UploadView.tsx:42-84` (handleAnalyze 함수)

**Description:** API 요청 시 사용자가 입력한 year/month를 body에 포함합니다.

- [ ] **Step 1: handleAnalyze 함수 수정**

```typescript
const handleAnalyze = async () => {
  if (!selectedFile || !preview || !isFormValid) return;

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
        year: parseInt(inputYear, 10),  // 사용자 입력 year 추가
        month: parseInt(inputMonth, 10),  // 사용자 입력 month 추가
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
```

- [ ] **Step 2: Commit**

```bash
cd haniltown
git add components/views/UploadView.tsx
git commit -m "feat: handleAnalyze에서 사용자 입력 year/month를 API 요청에 포함"
```

---

### Task 4: UploadView - 저장 시 selectedYear 업데이트

**Files:**
- Modify: `haniltown/components/views/UploadView.tsx:86-117` (handleSave 함수)

**Description:** 데이터 저장 후 선택된 년도를 `selectedYear`로 업데이트합니다.

- [ ] **Step 1: handleSave 함수 수정**

```typescript
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
```

- [ ] **Step 2: Store에서 setSelectedYear 추가 확인**

`useStore` 호출 부분에 `setSelectedYear` 추가되어 있는지 확인:

```typescript
const { setRecords, setRawSheet, setActiveView, setSelectedYear } = useStore();
```

- [ ] **Step 3: Commit**

```bash
cd haniltown
git add components/views/UploadView.tsx
git commit -m "feat: 데이터 저장 시 selectedYear 업데이트하여 Sidebar 연도 자동 펼침"
```

---

### Task 5: API Route - year/month 매개변수 추가 및 처리

**Files:**
- Modify: `haniltown/app/api/analyze/route.ts:7-78` (AnalyzeRequest, POST 함수)

**Description:** API 요청에서 전달된 year/month를 받아 응답에 포함시킵니다. Claude 프롬프트에서 year/month 추출을 제거합니다.

- [ ] **Step 1: AnalyzeRequest 인터페이스 수정**

```typescript
interface AnalyzeRequest {
  b64: string;
  mediaType: "image/jpeg" | "image/png";
  idToken: string;
  year: number;      // 사용자 입력 년도
  month: number;     // 사용자 입력 월
}
```

- [ ] **Step 2: POST 함수에서 year/month 추출**

```typescript
export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const { b64, mediaType, idToken, year, month } = body;

    // 입력 검증
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "유효한 년도와 월(1-12)을 입력하세요" },
        { status: 400 }
      );
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      const auth = getAuth(adminApp);
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // ... (이후 내용은 그대로)
  }
}
```

- [ ] **Step 3: Claude 프롬프트에서 year/month 추출 로직 제거**

프롬프트를 다음과 같이 수정 (year/month는 클라이언트에서 제공):

```typescript
{
  type: "text",
  text: `이 이미지는 아파트 관리비 납입영수증입니다.
아래 JSON 형식으로 데이터를 추출하세요. JSON 외 다른 텍스트는 절대 출력하지 마세요.

{
  "items": [
    {"item": "항목명", "amount": 당월금액또는null, "prev": 전월금액또는null, "diff": 증감액또는null}
  ]
}

규칙:
- 금액은 쉼표 없는 순수 숫자 (음수 가능, null 허용)
- "합 계" 행은 item을 "합계"로
- 관리비차감 포함
- 빈 행 제외
- JSON만 반환`
}
```

- [ ] **Step 4: 응답에 year/month 포함**

Claude API 호출 후 응답 처리:

```typescript
// Extract JSON from response
const content = response.content[0];
if (content.type !== "text") {
  throw new Error("Unexpected response type from Claude");
}

let parsedData: AnalyzeResponse;
try {
  const cleanedText = content.text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const items = JSON.parse(cleanedText).items;
  
  // 사용자 입력 year/month와 추출된 items를 결합
  parsedData = {
    year,
    month,
    items,
  };
} catch (error) {
  return NextResponse.json(
    {
      error: "JSON 파싱 실패",
      raw: content.text,
    },
    { status: 422 }
  );
}

return NextResponse.json(parsedData);
```

- [ ] **Step 5: Commit**

```bash
cd haniltown
git add app/api/analyze/route.ts
git commit -m "feat: API route에서 사용자 입력 year/month 받아 응답에 포함, Claude 프롬프트 단순화"
```

---

### Task 6: Sidebar - 펼침/닫힘 상태 관리 (로컬 상태)

**Files:**
- Modify: `haniltown/components/layout/Sidebar.tsx:1-45` (상태 선언 부분)

**Description:** 연도별 펼침/닫힘 상태를 관리하기 위한 로컬 상태와 useEffect를 추가합니다.

- [ ] **Step 1: 로컬 상태 추가**

Sidebar 컴포넌트 시작 부분에 추가:

```typescript
const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
```

- [ ] **Step 2: selectedYear 변경 감지 효과 추가**

```typescript
useEffect(() => {
  // selectedYear가 변경되면 해당 연도를 자동 펼침
  setExpandedYears(new Set([selectedYear]));
}, [selectedYear]);
```

- [ ] **Step 3: 연도 토글 함수 추가**

```typescript
const toggleYear = (year: number) => {
  const newExpanded = new Set(expandedYears);
  if (newExpanded.has(year)) {
    newExpanded.delete(year);
  } else {
    newExpanded.add(year);
  }
  setExpandedYears(newExpanded);
};
```

- [ ] **Step 4: 연도 목록 추출 함수 추가**

```typescript
const getYears = (): number[] => {
  const years = new Set<number>();
  Object.keys(rawSheets).forEach((key) => {
    const year = parseInt(key.split("-")[0], 10);
    years.add(year);
  });
  return Array.from(years).sort((a, b) => b - a); // 내림차순 (최신부터)
};

const years = getYears();
```

- [ ] **Step 5: Commit**

```bash
cd haniltown
git add components/layout/Sidebar.tsx
git commit -m "feat: Sidebar에 펼침/닫힘 상태 관리 및 selectedYear 자동 펼침 로직 추가"
```

---

### Task 7: Sidebar - 연도별 펼침/닫힘 렌더링 및 토글

**Files:**
- Modify: `haniltown/components/layout/Sidebar.tsx:62-86` (년월별 보기 섹션)

**Description:** 기존 월별 목록을 연도별 폴더 구조로 변경합니다.

- [ ] **Step 1: 년월별 보기 섹션 전체 교체**

기존 코드:
```typescript
{Object.keys(rawSheets).length > 0 && (
  <div className="mt-6 pt-4 border-t border-app-border">
    <p className="text-xs font-semibold text-app-muted mb-2 px-3">
      {selectedYear}년 월별
    </p>
    <div className="space-y-1 max-h-40 overflow-y-auto">
      {Object.keys(rawSheets)
        .sort()
        .reverse()
        .slice(0, 6)
        .map((key) => (
          <button
            key={key}
            onClick={() => {
              setSelectedRawSheetMonth(key);
              handleMenuItemClick("rawSheet");
            }}
            className="w-full text-left px-3 py-1 text-xs rounded hover:bg-surface2 text-app-muted"
          >
            {key.replace("-", "년 ")}월
          </button>
        ))}
    </div>
  </div>
)}
```

을 다음과 같이 교체:

```typescript
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
```

- [ ] **Step 2: Import useEffect 추가**

파일 상단에 useEffect import 추가:

```typescript
import { useEffect, useState } from "react";
```

- [ ] **Step 3: Commit**

```bash
cd haniltown
git add components/layout/Sidebar.tsx
git commit -m "feat: Sidebar를 연도별 폴더 구조로 변경 (펼침/닫힘 토글)"
```

---

### Task 8: 통합 테스트

**Description:** 전체 흐름을 수동으로 테스트하여 작동 확인합니다.

- [ ] **Step 1: 개발 서버 실행**

```bash
cd haniltown
npm run dev
```

- [ ] **Step 2: UploadView - 기본 UI 확인**

- [ ] 이미지 업로드 시 미리보기 아래 년/월 입력 필드 표시 확인
- [ ] 초기 상태: 분석 버튼 비활성화 확인

- [ ] **Step 3: UploadView - 년도 입력 검증**

- [ ] 년도 필드에 "202" 입력 → 월 필드로 포커스 이동 안 함 확인
- [ ] 년도 필드에 "2026" 입력 → 자동으로 월 필드로 포커스 이동 확인
- [ ] 년도 필드에 "abcd" 입력 → 숫자만 필터링되어 입력 안 됨 확인

- [ ] **Step 4: UploadView - 월 입력 검증**

- [ ] 월 필드에 "0" 입력 → 비활성화 (1-12만 허용)
- [ ] 월 필드에 "3" 입력 → 분석 버튼 활성화 확인
- [ ] 월 필드에 "13" 입력 → 비활성화 (1-12만 허용)

- [ ] **Step 5: UploadView - 엔터 키 동작**

- [ ] 월 필드에 "3" 입력 후 엔터 → 분석 버튼 클릭과 동일한 효과 확인
- [ ] (선택) 또는 분석이 자동 실행되는 경우, 로더 표시 확인

- [ ] **Step 6: UploadView - 분석 결과 표시**

- [ ] 분석 완료 후 결과 표에 "2026년 3월" 표시 확인
- [ ] 항목 테이블이 올바르게 렌더링되는지 확인

- [ ] **Step 7: UploadView - 데이터 저장**

- [ ] "데이터 저장" 버튼 클릭
- [ ] 저장 완료 후 대시보드로 이동 확인

- [ ] **Step 8: Sidebar - 연도 자동 펼침 확인**

- [ ] 저장된 년도(2026)가 Sidebar에 펼쳐진 상태로 표시 확인
- [ ] 월(03월) 항목이 표시되는지 확인

- [ ] **Step 9: Sidebar - 펼침/닫힘 토글**

- [ ] 다른 연도 폴더 클릭 → 펼침/닫힘 토글 확인
- [ ] "▶" / "▼" 아이콘 변화 확인
- [ ] 펼쳐진 상태에서 월 목록이 오름차순(1월 → 12월)인지 확인

- [ ] **Step 10: Sidebar - 월 클릭**

- [ ] 펼쳐진 연도의 월 항목 클릭
- [ ] rawSheet 뷰로 이동하고 해당 월의 데이터가 표시되는지 확인

- [ ] **Step 11: 모바일 반응형 확인**

- [ ] 모바일 화면(375px)에서 년/월 입력 필드 레이아웃 확인
- [ ] Sidebar 드로어 열기 시 연도/월 목록이 제대로 표시되는지 확인

---

### Task 9: 최종 커밋 및 정리

**Description:** 모든 변경사항을 확인하고 최종 커밋합니다.

- [ ] **Step 1: 모든 파일 변경사항 확인**

```bash
cd haniltown
git status
```

예상 변경 파일:
- `components/views/UploadView.tsx`
- `components/layout/Sidebar.tsx`
- `app/api/analyze/route.ts`

- [ ] **Step 2: 전체 diff 확인**

```bash
git diff
```

- [ ] 의도하지 않은 변경이 없는지 확인
- [ ] 코드 스타일 일관성 확인

- [ ] **Step 3: 테스트 실행 (있을 경우)**

```bash
npm test
```

또는 수동 테스트 확인

- [ ] **Step 4: 개발 서버 최종 확인**

```bash
npm run dev
```

- [ ] UploadView, Sidebar 모두 정상 작동 확인
- [ ] 콘솔 에러 없음 확인

- [ ] **Step 5: 최종 통합 커밋**

```bash
cd haniltown
git add components/views/UploadView.tsx components/layout/Sidebar.tsx app/api/analyze/route.ts
git commit -m "feat: 이미지 업로드 수동 입력 및 사이드바 개선 기능 완성

- UploadView: 년도/월 입력 필드 추가 (자동 포커스 이동)
- 년도 4자리 입력 시 월 필드로 자동 포커스 이동
- 엔터 또는 저장 버튼으로 확정
- 분석 버튼: 년/월 필수 입력 시에만 활성화
- API: 사용자 입력 year/month 포함, OCR 의존성 제거
- Sidebar: 연도별 펼침/닫힘 기능 (기본값: 닫힘)
- selectedYear 자동 업데이트로 해당 연도 자동 펼침
- 월: 오름차순 표시, 모든 저장된 월 표시

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Git log 확인**

```bash
git log --oneline -5
```

최근 커밋들이 올바르게 기록되었는지 확인

---

## 예상 구현 시간

| Task | 예상 시간 |
|------|----------|
| Task 1: UploadView - 입력 필드 UI | 25분 |
| Task 2: 분석 버튼 로직 | 10분 |
| Task 3: API 요청 수정 | 15분 |
| Task 4: selectedYear 업데이트 | 10분 |
| Task 5: API route 수정 | 20분 |
| Task 6: Sidebar 상태 관리 | 15분 |
| Task 7: Sidebar 렌더링 | 25분 |
| Task 8: 통합 테스트 | 30분 |
| Task 9: 최종 커밋 | 10분 |
| **총합** | **160분 (2.7시간)** |

---

## 체크포인트

- ✅ 모든 Task에 정확한 파일 경로와 코드 스니펫 포함
- ✅ 입력 검증 (년도: 4자리, 월: 1-12)
- ✅ 자동 포커스 이동 구현
- ✅ 필수 입력 검증 (분석 버튼 비활성화)
- ✅ API 요청/응답 수정
- ✅ Sidebar 연도별 구조 변경
- ✅ selectedYear 연동 로직
- ✅ 통합 테스트 시나리오
- ✅ 정기적인 커밋

