# 대시보드 동적 항목 필터링 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대시보드의 하드코딩된 3가지 항목("세대전기료", "세대수도료", "세대급탕비") 섹션을 "세대"라는 단어를 포함하는 모든 항목으로 동적으로 필터링하는 기능 구현

**Architecture:** DashboardView 컴포넌트 내에서 최신 월의 rawSheet 데이터를 분석하여 "세대" 문자를 포함하는 항목들을 자동 감지하고, 각 항목별 아이콘 색상을 동적으로 할당하여 렌더링하는 방식

**Tech Stack:** React 19, TypeScript, Zustand, Lucide-react icons

---

## 파일 구조

**수정 파일:**
- `components/views/DashboardView.tsx` - 하드코딩된 keyItems 배열을 동적 필터링 로직으로 변경

---

## Task 1: DashboardView 동적 필터링 로직 구현

**Files:**
- Modify: `components/views/DashboardView.tsx:41-147`

### Step 1: 동적 필터링 함수 추가

DashboardView 컴포넌트 내, `getItemData` 함수 아래에 다음 함수를 추가합니다:

```typescript
// "세대"를 포함하는 항목들을 필터링하고 동적 keyItems 생성
const getDynamicKeyItems = () => {
  if (!latestSheet) return [];

  // "세대"를 포함하는 항목들만 필터링 (합계 제외)
  const filteredItems = latestSheet.items.filter(
    (item) => item.item.includes("세대") && item.item !== "합계"
  );

  // 색상 팔레트 (항목 개수에 따라 동적으로 할당)
  const colorPalette = [
    { icon: Home, color: "#E8A020", bgColor: "#FFF3E0", label: "전기" },
    { icon: Droplet, color: "#1a6b9a", bgColor: "#E3F2FD", label: "수도" },
    { icon: Flame, color: "#c0392b", bgColor: "#FFEBEE", label: "난방" },
    { icon: Zap, color: "#f39c12", bgColor: "#FEF5E7", label: "기타" },
    { icon: Wind, color: "#16a085", bgColor: "#E8F8F5", label: "환기" },
  ];

  return filteredItems.map((item, index) => ({
    name: item.item,
    icon: colorPalette[index % colorPalette.length].icon,
    color: colorPalette[index % colorPalette.length].color,
    bgColor: colorPalette[index % colorPalette.length].bgColor,
  }));
};
```

### Step 2: 필요한 아이콘 import 추가

파일 상단의 import 문을 다음과 같이 수정합니다:

```typescript
import { TrendingUp, TrendingDown, Home, Droplet, Flame, Zap, Wind } from "lucide-react";
```

### Step 3: 하드코딩된 keyItems 배열 제거

51-55번 줄의 다음 코드를 삭제합니다:

```typescript
const keyItems = [
  { name: "세대전기료", icon: Home, color: "#E8A020", bgColor: "#FFF3E0" },
  { name: "세대수도료", icon: Droplet, color: "#1a6b9a", bgColor: "#E3F2FD" },
  { name: "세대급탕비", icon: Flame, color: "#c0392b", bgColor: "#FFEBEE" },
];
```

### Step 4: 동적 keyItems 변수로 변경

Step 3의 코드 위치에 다음 코드를 추가합니다:

```typescript
// 동적으로 생성된 keyItems (항상 최신 데이터 기반)
const keyItems = getDynamicKeyItems();
```

### Step 5: 콘텐츠가 없을 때 처리

동적 필터링 결과가 없는 경우를 처리하기 위해, 105번 줄의 주석 아래 조건부 렌더링을 추가합니다:

원래 코드:
```typescript
{/* 핵심 항목 카드 섹션 */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
```

변경 코드:
```typescript
{/* 핵심 항목 카드 섹션 */}
{keyItems.length > 0 ? (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
```

### Step 6: 닫는 div 태그 조건부 처리

147번 줄의 닫는 div를 다음과 같이 수정합니다:

```typescript
  </div>
) : null}
```

### Step 7: 빌드 검증

```bash
cd /Users/jongchoonna/Documents/Claude/haniltown-management/03-React-App/haniltown
npm run build 2>&1 | grep -E "(error|warning|Compiled|Failed)" | head -20
```

Expected: `✓ Compiled successfully`

### Step 8: 커밋

```bash
git add components/views/DashboardView.tsx
git commit -m "feat: implement dynamic key items filtering for '세대' items"
```

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ "세대"라는 단어를 포함하는 항목들만 필터링: `getDynamicKeyItems()` 함수에서 구현
- ✅ 아파트별 항목명 차이 대응: 하드코딩 제거, 동적 필터링으로 자동 감지
- ✅ 새로운 항목 자동 추가: "세대" 문자만 있으면 자동 포함
- ✅ 색상 및 아이콘 동적 할당: colorPalette 배열과 index 기반 할당
- ✅ 빈 데이터 처리: 조건부 렌더링으로 keyItems.length 체크

**Placeholder Scan:**
- ✅ 모든 코드 완전함
- ✅ 모든 파일 경로 정확함
- ✅ 모든 함수 시그니처 일관됨

**Type Consistency:**
- ✅ `getDynamicKeyItems()` 반환값이 기존 keyItems 구조와 동일
- ✅ 아이콘, 색상, bgColor 필드 일치
- ✅ 템플릿 리터럴 문자열 일관됨
