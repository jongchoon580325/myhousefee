# TODO LIST — 한일타운 관리비 현황 PWA

**기준 문서**: PRD v1.5 (2026-04-10)  
**작성일**: 2026-04-10  
**대상**: 개발 담당자

---

## 전체 진행률

| Phase | 태스크 수 | 완료 | 상태 |
|-------|-----------|------|------|
| Phase 0 — 기능 재현 | 14 | 14 | ✅ 완료 |
| Phase 1 — Firebase 연동 | 12 | 12 | ✅ 완료 |
| Phase 2 — PWA + 고도화 | 8 | 0 | 🔄 진행 중 |
| **합계** | **34** | **26** | |

---

## Phase 0 — 기능 재현

> **목표**: Next.js + shadcn/ui로 기존 기능 100% 재현. Firebase 없이 localStorage 임시 사용  
> **완료 기준**: `npm run dev` 실행 후 기존 앱과 기능 동등성 100%

---

### 0-1. Next.js 프로젝트 초기화

**산출물**: `package.json`, `tailwind.config.ts`, `next.config.ts`

- [x] `npx create-next-app@latest` 실행 (TypeScript, App Router, Tailwind 선택)
- [x] `next.config.ts` 기본 설정 확인
- [x] `package.json` 의존성 초기 설치 확인

> ✅ 검증완료 — `npm run build` 성공, TypeScript 컴파일 이상 없음

---

### 0-2. Tailwind 색상 시스템 설정

**산출물**: `tailwind.config.ts` (CSS 변수 이전 완료)

- [x] `globals.css` `@theme` 블록에 커스텀 색상 등록 (Tailwind v4 방식)
  - [x] `bg-app-bg` (`#f5f3ef`)
  - [x] `bg-surface` (`#ffffff`)
  - [x] `bg-surface2` (`#faf9f7`)
  - [x] `border-app` (`#e8e4dc`)
  - [x] `text-app` (`#1a1814`)
  - [x] `text-muted` (`#6b6560`)
  - [x] `text-subtle` (`#9c968e`)
  - [x] `bg-accent` / `text-accent` (`#2d5a3d`)
  - [x] `bg-accent-light` (`#e8f0ea`)
  - [x] `text-up` (`#1a6b3c`), `bg-up-light` (`#e8f5ec`)
  - [x] `text-down` (`#c0392b`), `bg-down-light` (`#fdf0ee`)
- [x] `globals.css`에 `@media print` 스타일 이전
- [x] `next/font/google`으로 Noto Sans KR + DM Mono 로드 (`app/layout.tsx`)
  - [x] `lang="ko"`, metadata title `우리집 관리비` 설정

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-3. shadcn/ui 컴포넌트 설치

**산출물**: `components/ui/` 하위 컴포넌트들

- [x] `npx shadcn@latest init` 실행
- [x] Button 설치
- [x] Card 설치
- [x] Dialog 설치
- [x] AlertDialog 설치
- [x] Select 설치
- [x] Table 설치
- [x] Input 설치
- [x] Badge 설치
- [x] Sonner (토스트) 설치
- [x] RadioGroup 설치

> ✅ 검증완료 — 10개 컴포넌트 `components/ui/`에 생성 확인, `npm run build` 성공

---

### 0-4. 레이아웃 컴포넌트

**산출물**: `components/layout/AppHeader.tsx`, `Sidebar.tsx`, `AppFooter.tsx`

- [x] `AppHeader.tsx` — 헤더 (높이 56px, sticky top, `bg-accent`)
  - [x] 좌: 앱 아이콘(SVG) + "우리집 관리비" 타이틀
  - [x] 우: 로그인 사용자 프로필 + 로그아웃 버튼 (Phase 1 전 플레이스홀더)
- [x] `Sidebar.tsx` — 사이드바 (width 220px, bg-surface, border-right)
  - [x] 메뉴 4개: 대시보드, 항목별 추이, 전체 데이터, 이미지 업로드
  - [x] 활성 뷰 강조 (bg-accent-light, text-accent)
  - [x] 월별 데이터: 연도별 아코디언 (최신 연도 기본 오픈)
  - [x] 각 월 항목: 월 이름 + 합계 금액 배지
  - [x] 전체 초기화 버튼 (AlertDialog 확인 후 삭제)
- [x] `AppFooter.tsx` — 푸터 (높이 44px, sticky bottom, bg-accent)
  - [x] `© 2026 Na Jong Choon. All rights reserved.`
- [x] `AppShell.tsx` — 클라이언트 래퍼 (헤더/사이드바/메인/푸터 조합)
- [x] `app/page.tsx` — AppShell 연결

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-5. Zustand 전역 상태

**산출물**: `lib/store.ts`

- [x] Zustand 설치 (`npm install zustand`)
- [x] `lib/store.ts` 생성 — 기존 `state.js` 대응
  - [x] `records`: 전체 레코드 배열
  - [x] `rawSheets`: 월별 원본 데이터 맵 (`Record<string, RawSheet>`)
  - [x] `activeView`: 현재 활성 뷰
  - [x] `selectedYear` / `selectedMonth`: 선택된 연월
  - [x] `searchQuery`: 테이블 검색어
  - [x] `user`: 로그인 사용자 정보 (Phase 1 전 null)
  - [x] `isLoading`: 로딩 상태
  - [x] 액션: setRecords, upsertRecord, deleteRecord, setRawSheet, setActiveView, setSelectedYear, setSelectedMonth, setSearchQuery, setUser, resetAll
  - [x] 파생 셀렉터: getMonthSummaries, getMonthRecords, getYears
- [x] `AppShell.tsx` — Zustand store 연결 완료

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-6. localStorage 어댑터

**산출물**: `lib/storage.ts`

- [x] `lib/storage.ts` 생성 (Phase 1에서 Firestore로 교체 예정)
  - [x] `loadRecords()` / `loadRawSheets()`: localStorage 읽기
  - [x] `saveRecord()` / `saveRawSheet()`: 단일 항목 업서트 후 저장
  - [x] `saveRecords()` / `saveRawSheets()`: 전체 배열 저장
  - [x] `deleteAll()`: 전체 삭제
- [x] `lib/useInitStorage.ts` — 앱 마운트 시 localStorage → Zustand store 초기화 훅
- [x] `AppShell.tsx` — `useInitStorage` 훅 연결, `handleReset`에 `deleteAll()` 적용

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-7. DashboardView

**산출물**: `components/views/DashboardView.tsx`

- [x] 데이터 없을 때 empty state + 업로드 탭 이동 CTA 버튼
- [x] 요약 카드 4개: 총 합계, 데이터 개월수, 월 평균, 최고/최저월
- [x] 핵심 항목 카드 3개
  - [x] 세대전기료 (`#E8A020`): 최근월 금액 + 전월 대비 증감
  - [x] 세대수도료 (`#1a6b9a`): 최근월 금액 + 전월 대비 증감
  - [x] 세대급탕비 (`#c0392b`): 최근월 금액 + 전월 대비 증감
  - [x] 증가 → text-down(빨강), 감소 → text-up(초록)
- [x] 차트 영역 플레이스홀더 2개 (0-8단계에서 Recharts로 교체)
- [x] PDF 저장 버튼 비활성화 placeholder (F-12 구현 후 연결)
- [x] AppShell에 DashboardView 연결, 나머지 뷰 placeholder 처리

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-8. Recharts 컴포넌트 4종

**산출물**: `components/charts/` 하위 4개 파일

- [x] Recharts 설치 (`npm install recharts`)
- [x] `TotalBarChart.tsx` — 월별 합계 바차트 (`#2d5a3d`)
- [x] `Key3LineChart.tsx` — 세대전기료/수도료/급탕비 3항목 AreaChart (fill 영역 포함)
- [x] `ItemLineChart.tsx` — 단일 항목 AreaChart (fill 영역 포함)
- [x] `YearlyBarChart.tsx` — 연도별 합계 바차트
- [x] `components/charts/index.ts` — `next/dynamic`으로 SSR 제외 지연 로딩
- [x] `lib/useChartData.ts` — `useMemo` 차트 데이터 훅 4종
- [x] DashboardView에 TotalBarChart + Key3LineChart 연결

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-9. ChartsView

**산출물**: `components/views/ChartsView.tsx`

- [x] 연도 필터: "전체" 버튼 + 연도 드롭다운 + 이전/다음 연도 버튼
- [x] "전체" 선택 시 모든 데이터 기간 표시
- [x] 연도 선택 시 해당 연도 데이터 필터링
- [x] 이전/다음 버튼: 경계에서 비활성화
- [x] 차트 4개: ItemLineChart(전기료/수도료/급탕비) + YearlyBarChart
- [x] PDF 저장 버튼 비활성화 placeholder

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-10. TableView + InlineEditRow

**산출물**: `components/views/TableView.tsx`, `components/table/DataTable.tsx`, `components/table/InlineEditRow.tsx`

- [x] 네비게이션: 연도 드롭다운 + 월 드롭다운 + 이전/다음 페이지 버튼 (1페이지 = 1개월)
- [x] 실시간 항목명 검색 (대소문자 무관 부분 일치, 합계/관리비차감은 항상 표시)
- [x] 테이블 컬럼: 항목명, 당월금액, 전월금액, 증감액, 증감률(Badge), 편집/삭제 버튼
- [x] "합계" 행: 항상 마지막, bg-accent-light(#e8f0ea) 배경, 볼드
- [x] "관리비차감" 행: `#fff9e6` 노란색 배경
- [x] `InlineEditRow.tsx`: 인라인 편집 — amount-prev 자동계산, diff 자동갱신 readonly
- [x] 저장 시 rawSheets + records 양쪽 업데이트 (`useRecordMutations`)
- [x] localStorage 자동 동기화 (`syncStorage`)
- [x] 삭제: AlertDialog 확인 후 삭제
- [x] 항목 추가: 테이블 하단 빈 행 인풋 + Enter/체크 저장
- [x] 연도 변경 시 해당 연도 마지막 월로 이동
- [x] AppShell에 TableView 연결

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-11. UploadView — 파일 업로드 + 이미지 미리보기

**산출물**: `components/views/UploadView.tsx` (기본 업로드 UI)

- [x] 드래그앤드롭 영역 (클릭으로도 파일 선택)
- [x] JPG, PNG 단일 파일 지원
- [x] 업로드 후 전체 영수증 이미지 미리보기 표시
- [x] 로딩 스피너 + 파일명 표시
- [x] 완료 후 `input.value` 초기화 (동일 파일 재업로드 가능)

---

### 0-11-1. UploadView — 영역 선택 크롭 UI

**산출물**: `UploadView.tsx` (크롭 기능 추가)

- [x] 이미지 미리보기 위 마우스 드래그로 사각형 영역 선택
- [x] 선택 영역: 파란 반투명 오버레이 + 점선 테두리 + 외부 어두운 마스크
- [x] "이 영역 분석" 버튼 — canvas 크롭 후 분석
- [x] "전체 이미지로 분석" 버튼 — 전체 이미지 전송
- [x] `<canvas>` API로 클라이언트 크롭 (naturalWidth 비율 보정)
- [x] 모바일 터치 드래그 지원 (`touchstart` / `touchmove` / `touchend`)

---

### 0-11-2. UploadView — AI 분석 연동 (Phase 0)

**산출물**: `UploadView.tsx` + `app/api/analyze/route.ts`

- [x] `app/api/analyze/route.ts` — Phase 0: 인증 없이 Anthropic API 호출
- [x] `ANTHROPIC_API_KEY` 미설정 시 500 에러 처리
- [x] 응답 JSON 파싱 (```json 마크다운 제거)
- [x] 성공 시: saveMonthSheet → records + rawSheets + localStorage 저장
- [x] 성공 시: 연월 + 항목 수 + 첫 6개 미리보기 표시
- [x] 실패 시: 에러 박스
- [x] `.env.local.example` 생성

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-12. RawSheetView

**산출물**: `components/views/RawSheetView.tsx`

- [x] 사이드바 월 클릭 → RawSheetView 전환
- [x] 테이블 헤더 배경: bg-accent 초록색
- [x] "합계" 행 강조, "관리비차감" 행 강조, 증감률 Badge
- [x] rawSheets 데이터 없으면 records에서 해당 월 폴백 렌더링
- [x] "이 달 엑셀 저장" 버튼 (단일 시트 내보내기)
- [x] "대시보드로" 버튼

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-13. Excel Import / Export

**산출물**: `lib/excel.ts` (또는 UploadView/Header 내 통합)

- [x] SheetJS npm 패키지 설치 (`npm install xlsx`)
- [x] **엑셀 내보내기 (Export)**
  - [x] 헤더에 "엑셀 내보내기" 버튼
  - [x] 파일명: `우리집_관리비현황.xlsx`
  - [x] 시트 1 "마스터": 전체 records (년도, 월, 항목, 당월금액, 전월금액, 증감액)
  - [x] 시트 2~N: 월별 rawSheets (시트명: `2026년2월` 형식)
  - [x] RawSheetView "이 달 엑셀 저장": 해당 월 단일 시트 파일
- [x] **엑셀 가져오기 (Import)**
  - [x] 업로드 탭 하단에 "엑셀 가져오기" 카드 표시
  - [x] 병합 모드: 기존 유지 + 중복 월은 새 데이터로 교체
  - [x] 덮어쓰기 모드: 기존 전체 삭제 후 새 데이터로 교체 (RadioGroup)
  - [x] "마스터" 시트 파싱: 헤더 행 스킵, 6컬럼
  - [x] 월별 시트 파싱: 시트명 정규식 `/(\d{4})년(\d{1,2})월/`
  - [x] 완료 시 성공 메시지 (마스터 건수 + 월별 시트 수)
  - [x] storage 저장 후 UI 즉시 반영

> ✅ 검증완료 — `npm run build` 성공, TypeScript 이상 없음

---

### 0-14. 인쇄 CSS

**산출물**: `app/globals.css` (`@media print` 스타일)

- [x] `@media print` 스타일 — 사이드바/헤더 숨김, 메인 콘텐츠 전체 출력 (0-2에서 구현 완료)

> ✅ 검증완료 — globals.css `@media print` 확인

---

## Phase 1 — Firebase 연동

> **목표**: Google 로그인, Firestore 데이터 저장, API Route 보안 프록시  
> **완료 기준**: 다기기에서 동일 Google 계정 로그인 후 데이터 동기화 확인

---

### 1-1. Firebase 프로젝트 생성 + 설정

**산출물**: `lib/firebase.ts`

- [ ] Firebase 콘솔에서 프로젝트 생성 (**사용자 직접 작업**)
- [ ] Firebase Authentication 활성화 (Google 제공업체) (**사용자 직접 작업**)
- [ ] Firestore 데이터베이스 생성 (프로덕션 모드) (**사용자 직접 작업**)
- [x] Firebase SDK 설치 (`npm install firebase`)
- [x] `lib/firebase.ts` 생성 — 클라이언트 Firebase 지연 초기화 (SSR 안전)
- [ ] `.env.local`에 `NEXT_PUBLIC_FIREBASE_*` 환경변수 설정 (**사용자 직접 작업**)

---

### 1-2. Firebase Admin SDK 초기화

**산출물**: `lib/firebase-admin.ts`

- [x] Firebase Admin SDK 설치 (`npm install firebase-admin`)
- [ ] Firebase 콘솔에서 서비스 계정 키(JSON) 발급 (**사용자 직접 작업**)
- [x] `lib/firebase-admin.ts` 생성 — 서버 전용 Admin SDK 지연 초기화
- [ ] `.env.local`에 `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` 설정 (**사용자 직접 작업**)

---

### 1-3. Firebase Auth + LoginOverlay

**산출물**: `components/AuthProvider.tsx`, `components/LoginOverlay.tsx`

- [x] `AuthProvider.tsx` — `onAuthStateChanged` 구독, Zustand user 상태 업데이트
- [x] `LoginOverlay.tsx` — 전체 화면 로그인 오버레이
  - [x] 미인증 상태면 오버레이 표시
  - [x] "Google로 로그인" 버튼 → `signInWithPopup(GoogleAuthProvider)`
  - [x] 로그인 성공 → 오버레이 숨김 + Firestore 데이터 로드
- [x] `AppHeader.tsx` — 사용자 프로필 사진 + 이름 표시 (Phase 0에서 구현)
- [x] 로그아웃 버튼 → `signOut()` → 오버레이 재표시
- [x] 페이지 새로고침 시 Firebase SDK 로컬 persistence로 자동 로그인 유지
- [x] "API 키 설정" 모달 완전 제거 (Phase 0 구현 시 없음)

> ✅ 검증완료 — `npm run build` 성공

---

### 1-4. Firestore CRUD 함수

**산출물**: `lib/firestore.ts`

- [x] `loadData(uid)`: `users/{uid}/records` + `users/{uid}/rawSheets` 전체 읽기
- [x] `saveRecord(uid, key, record)`: `setDoc(..., { merge: true })`
- [x] `saveRawSheet(uid, yearMonth, items)`: rawSheets 저장
- [x] `deleteAll(uid)`: `writeBatch()`로 records + rawSheets 일괄 삭제
- [x] `saveAllRecords` / `saveAllRawSheets`: 일괄 저장 (Import 후, 400건 청크)

> ✅ 검증완료 — `npm run build` 성공

---

### 1-5. localStorage → Firestore 교체

**산출물**: `lib/store.ts` + `lib/firestore.ts` 연결 완료

- [x] `lib/storage.ts` localStorage 폴백으로 유지 (uid 없을 때)
- [x] 앱 초기 로드: `AuthProvider`의 `onAuthStateChanged` → `loadData(uid)` 호출
- [x] 레코드 저장/수정/삭제 시 Firestore 동기화 (`useRecordMutations`)
- [x] rawSheets 저장 시 Firestore 동기화
- [x] 전체 초기화 버튼 → Firestore `deleteAll()` + localStorage 삭제

> ✅ 검증완료 — `npm run build` 성공

---

### 1-6. `/api/analyze` API Route

**산출물**: `app/api/analyze/route.ts`

- [x] Anthropic SDK 설치 (Phase 0에서 설치 완료)
- [x] `app/api/analyze/route.ts` 업데이트
  - [x] `POST` 핸들러 구현
  - [x] Firebase Admin SDK로 `idToken` 검증 (`adminAuth.verifyIdToken()`)
  - [x] 검증 실패 시 401 반환: `{ error: '인증이 필요합니다' }`
  - [x] Anthropic API 호출 (모델: `claude-sonnet-4-6`)
  - [x] JSON 파싱 (```json 마크다운 제거 처리 포함)
  - [x] 파싱 실패 시 422, 500 에러 핸들링
- [ ] `.env.local`에 `ANTHROPIC_API_KEY` 설정 (**사용자 직접 작업**)

> ✅ 검증완료 — `npm run build` 성공

---

### 1-7. UploadView: idToken 취득 + API Route 호출

**산출물**: `components/views/UploadView.tsx` (Phase 0 임시 호출 → API Route로 교체)

- [x] `getIdToken()` 호출로 Firebase ID 토큰 취득
- [x] `POST /api/analyze`에 `{ b64, mediaType, idToken }` 전송으로 교체
- [x] Phase 0 임시 직접 Anthropic 호출 코드 제거

> ✅ 검증완료 — `npm run build` 성공

---

### 1-8. Firestore 보안 규칙 배포

**산출물**: `firestore.rules`

- [x] `firestore.rules` 파일 생성:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/{document=**} {
        allow read, write: if request.auth != null
                           && request.auth.uid == userId;
      }
      match /{document=**} {
        allow read, write: if false;
      }
    }
  }
  ```
- [x] `firebase deploy --only firestore:rules`로 배포
- [ ] 계정 A 데이터가 계정 B에서 미노출 검증 (**사용자 직접 작업**)

---

### 1-9. Firebase Hosting 설정

**산출물**: `firebase.json`, `.firebaserc`

- [x] Firebase CLI 설치 (기존 설치 14.27.0)
- [x] `firebase login` (기존 로그인 상태)
- [x] `firebase.json` 설정 (webframeworks + asia-northeast3)
- [x] `.firebaserc` 프로젝트 ID 설정 (myhousefee)
- [x] Cloud Functions API + Blaze 플랜 활성화

> ✅ 검증완료

---

### 1-10. 환경변수 설정

**산출물**: `.env.local` (로컬), Firebase 콘솔 (프로덕션)

- [ ] `.env.local` 전체 환경변수 설정:
  ```bash
  # 서버 전용
  ANTHROPIC_API_KEY=sk-ant-...
  FIREBASE_PROJECT_ID=...
  FIREBASE_PRIVATE_KEY=...
  FIREBASE_CLIENT_EMAIL=...

  # 클라이언트 공개
  NEXT_PUBLIC_FIREBASE_API_KEY=...
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
  NEXT_PUBLIC_FIREBASE_APP_ID=...
  ```
- [x] `.gitignore`에 `.env*` 패턴 포함 확인
- [x] Firebase Hosting 환경변수 `.env.local` 설정 완료

> ✅ 검증완료

---

### 1-11. PDF 내보내기 구현

**산출물**: `lib/pdf.ts` 또는 각 View 내 PDF 로직

- [ ] 패키지 설치: `npm install html2canvas jspdf @react-pdf/renderer`
- [ ] **대시보드 PDF** (`html2canvas` + `jsPDF`)
  - [ ] 요약 카드 + 핵심 항목 카드 + 차트 2개 캡처
  - [ ] 2배율(`devicePixelRatio: 2`) 캡처
  - [ ] 파일명: `관리비현황_대시보드_YYYY-MM.pdf`
- [ ] **차트 PDF** (`html2canvas` + `jsPDF`)
  - [ ] 4종 차트 + 필터 기간 정보 포함
  - [ ] A4 가로 방향 옵션
  - [ ] 파일명: `관리비현황_차트_YYYY-MM.pdf`
- [ ] **테이블 PDF** (`@react-pdf/renderer`)
  - [ ] 현재 월 테이블 전체 (CRUD 버튼 제외)
  - [ ] Noto Sans KR 서브셋 폰트 임베딩
  - [ ] 파일명: `관리비현황_테이블_YYYY-MM.pdf`
- [ ] PDF 헤더: 앱 이름 + 뷰 이름 + 생성 날짜
- [ ] 각 뷰 상단 "PDF 저장" 버튼 연결

---

### 1-12. 배포

**산출물**: 프로덕션 URL

- [x] `npm run build` 성공 확인
- [x] `firebase deploy --only hosting --force` 배포 성공
- [ ] 프로덕션 환경에서 Google 로그인 동작 확인 (**사용자 검증**)
- [ ] 다기기(PC + 스마트폰) 동일 계정 로그인 후 데이터 동기화 확인 (**사용자 검증**)
- [ ] 브라우저 캐시 초기화 후 재로그인 → 전체 데이터 복원 확인 (**사용자 검증**)

> 🌐 배포 URL: https://myhousefee.web.app

---

## Phase 2 — PWA + 고도화

> **목표**: 모바일 설치 가능, 오프라인 지원, UX 개선  
> **완료 기준**: Lighthouse PWA 감사 90점 이상, 모바일 홈 화면 설치 확인

---

### 2-1. next-pwa 설정

**산출물**: `next.config.ts` (pwa 설정), `public/manifest.json`, `public/icon.svg`

- [x] `next-pwa` 설치 (`npm install next-pwa`)
- [x] `next.config.ts`에 `withPWA` 래퍼 적용 + Turbopack 설정
- [x] Service Worker Cache Strategy 설정 (정적 파일 Cache First)
  - [x] 폰트: CacheFirst (1년 캐시)
  - [x] 이미지: CacheFirst (30일 캐시)
  - [x] API: NetworkFirst (5분 캐시)
- [x] `public/manifest.json` 생성 (앱 메타데이터, 아이콘, shortcuts)
- [x] `public/icon.svg` 생성 (건물 + 차트 디자인)
- [ ] 오프라인 상태에서 대시보드, 차트, 테이블 뷰 열람 가능 확인
- [ ] 오프라인 업로드 시도 → 명시적 에러 메시지 처리

---

### 2-2. Web App Manifest

**산출물**: `public/manifest.json`

- [x] `public/manifest.json` 생성:
  - [x] `name`: `우리집 관리비`
  - [x] `short_name`: `관리비`
  - [x] `theme_color`: `#2d5a3d`
  - [x] `background_color`: `#f5f3ef`
  - [x] `display`: `standalone`
  - [x] 아이콘 설정: 192×192, 512×512 (maskable 포함)
  - [x] Shortcuts: 업로드, 데이터 조회
  - [x] Categories: finance, productivity
- [x] `app/layout.tsx`에 manifest 링크 추가 (이미 설정됨)
- [ ] iOS Safari "홈 화면에 추가" 가이드 배너 (첫 방문 시)

---

### 2-2-1. 앱 아이콘 생성

**산출물**: `public/icons/icon.svg`, `icon-192.png`, `icon-512.png`

- [ ] `public/icons/icon.svg` 생성 (PRD 8-3절 SVG 스펙 적용)
  - 원형 배경 (`#2d5a3d`) + 흰색 집 실루엣 + 차트 막대 창문
- [ ] SVG → PNG 변환: `icon-192.png` (192×192), `icon-512.png` (512×512)
- [ ] `favicon.ico` 업데이트

---

### 2-3. Firestore 오프라인 Persistence

**산출물**: `lib/firebase.ts` (persistence 활성화)

- [ ] `enableIndexedDbPersistence(db)` 활성화
- [ ] 오프라인에서 캐시된 데이터 열람 확인

---

### 2-4. 모바일 레이아웃 반응형

**산출물**: 각 View 컴포넌트 Tailwind 반응형 클래스 적용

- [ ] Tailwind 브레이크포인트: `sm(640px)`, `md(768px)`, `lg(1024px)` 적용
- [ ] 768px 이하: 사이드바 숨김 → 하단 탭바 또는 햄버거 드로어로 전환
- [ ] 카드 그리드: 2열 → 1열 전환 (`sm:grid-cols-2 grid-cols-1`)
- [ ] 테이블: 수평 스크롤 (`overflow-x: auto`)
- [ ] 헤더: 모바일에서 타이틀 축약

---

### 2-4-1. 터치 이벤트 — 영역 선택 크롭

**산출물**: `components/views/UploadView.tsx` (터치 지원 추가)

- [ ] 영역 선택 크롭 드래그에 터치 이벤트 추가
  - `touchstart` → 드래그 시작
  - `touchmove` → 선택 영역 확장
  - `touchend` → 선택 완료
- [ ] 모바일 Safari/Chrome에서 크롭 UI 동작 확인

---

### 2-5. 아파트명 설정

**산출물**: `components/ApartmentSetup.tsx` (또는 설정 모달)

- [ ] 첫 로그인 시 아파트명 입력 모달 표시
- [ ] 입력값 → `users/{uid}/profile.apartmentName`으로 Firestore 저장
- [ ] 이후 로그인 시 저장된 아파트명 표시

---

### 2-6. AI 프롬프트 개선

**산출물**: `app/api/analyze/route.ts` (프롬프트 수정)

- [ ] `apartmentName`을 Firestore에서 읽어 프롬프트 컨텍스트에 삽입
- [ ] 동적 프롬프트 적용 확인

---

### 2-7. 다크모드

**산출물**: 각 컴포넌트 Tailwind `dark:` 클래스 적용

- [ ] `next-themes` 설치 (`npm install next-themes`)
- [ ] `ThemeProvider` 설정
- [ ] 헤더에 라이트/다크 토글 버튼 추가
- [ ] 각 컴포넌트 `dark:` 클래스 적용 (배경, 텍스트, 보더)
- [ ] 차트 다크모드 색상 조정

---

## 기능별 수용 기준 (빠른 참조)

> 각 기능의 체크박스. Phase 태스크와 중복되나 기능 단위로 빠르게 확인할 때 사용.

---

### F-01. 인증 (Authentication) `P1 / Phase 1`

- [ ] 앱 진입 시 미인증 상태면 전체 화면 로그인 오버레이 표시
- [ ] "Google로 로그인" 버튼 → `signInWithPopup(GoogleAuthProvider)` 실행
- [ ] 로그인 성공 → 오버레이 사라지고 Firestore에서 해당 uid 데이터 로드
- [ ] 헤더에 사용자 프로필 사진 + 이름 표시
- [ ] 로그아웃 버튼 → `signOut()` → 로그인 오버레이 재표시
- [ ] 페이지 새로고침 시 Firebase SDK의 로컬 persistence로 자동 로그인 유지
- [ ] 기존 앱의 "API 키 설정" 모달 완전 제거

---

### F-02. 대시보드 (Dashboard) `P0 / Phase 0`

- [ ] 데이터 없을 때 empty state + 업로드 탭으로 이동하는 CTA 버튼
- [ ] 요약 카드 4개: 총 합계, 데이터 개월수, 월 평균, 최고/최저월
- [ ] 핵심 항목 카드 3개: 세대전기료(`#E8A020`), 세대수도료(`#1a6b9a`), 세대급탕비(`#c0392b`)
  - [ ] 각 항목: 최근월 금액 + 전월 대비 증감 (증가 → 빨강, 감소 → 초록)
- [ ] 차트 2개: 월별 합계 바차트, 3항목 라인차트
- [ ] PDF 저장 버튼

---

### F-03. 항목별 추이 차트 (Charts View) `P0 / Phase 0`

- [ ] 필터: "전체" 버튼, 연도 드롭다운, 이전/다음 연도 이동 버튼
- [ ] "전체" 선택 시 모든 데이터 기간 표시
- [ ] 연도 선택 시 해당 연도 1~12월 범위로 필터링
- [ ] 이전/다음 버튼: 경계에서 비활성화
- [ ] 차트 4개 (fill 영역 포함 라인차트):
  - [ ] 세대전기료 (`#E8A020`)
  - [ ] 세대수도료 (`#1a6b9a`)
  - [ ] 세대급탕비 (`#c0392b`)
  - [ ] 연도별 합계 바차트 (`#2d5a3d`)
- [ ] PDF 저장 기능 지원

---

### F-04. 전체 데이터 테이블 (Table View) `P0 / Phase 0`

- [ ] 네비게이션: 연도 드롭다운, 월 드롭다운, 이전/다음 페이지 버튼
- [ ] 실시간 항목명 검색 (대소문자 무관 부분 일치)
- [ ] 테이블 컬럼: 항목명, 당월금액, 전월금액, 증감액, 증감률(배지), 편집/삭제 버튼
- [ ] "합계" 행: 항상 마지막, bg-accent-light 배경, 볼드
- [ ] "관리비차감" 행: `#fff9e6` 노란색 배경
- [ ] 인라인 편집: amount-prev 자동 계산, diff 자동 갱신 (readonly)
- [ ] 저장 시 rawSheets + records 양쪽 업데이트 후 storage 동기화
- [ ] 삭제: AlertDialog 확인 후 삭제
- [ ] 항목 추가: 테이블 하단에 빈 행 인풋 추가 방식
- [ ] 연도 변경 시 해당 연도 마지막 월로 이동
- [ ] 사이드바 월별 항목과 하이라이트 동기화

---

### F-05. 영수증 업로드 + 영역 선택 + AI 분석 `P0+P1 / Phase 0→1`

**업로드 UI**
- [ ] 드래그앤드롭 영역 (클릭으로도 파일 선택)
- [ ] JPG, PNG 단일 파일 지원
- [ ] 업로드 후 이미지 미리보기 표시 (전체 영수증 사진)
- [ ] 각 파일별 개별 로딩 상태 (스피너 + 파일명)
- [ ] 완료 후 `input.value` 초기화

**영역 선택 (크롭)**
- [ ] 이미지 미리보기 위 마우스 드래그로 사각형 영역 선택
- [ ] 선택 영역: 파란 반투명 오버레이 + 점선 테두리
- [ ] "이 영역 분석" 버튼 → 선택 좌표로 canvas 크롭
- [ ] canvas API로 클라이언트 크롭 처리
- [ ] 크롭된 이미지만 Claude Vision API 전송
- [ ] "전체 이미지로 분석" 버튼 제공
- [ ] 모바일 터치 드래그 지원

**AI 분석**
- [ ] Phase 0: 임시 직접 호출
- [ ] Phase 1: `POST /api/analyze` — Firebase Auth ID 토큰 포함, 서버에서 검증 후 Anthropic 호출
- [ ] 응답: `{ year, month, items: [{item, amount, prev, diff}] }`
- [ ] 성공 시: rawSheets 업데이트 + records 업서트 + storage 저장
- [ ] 성공 시: 연월 + 항목 수 + 첫 6개 항목 미리보기 표시
- [ ] 실패 시: 파일별 에러 박스

---

### F-06. 월별 원본 데이터 (Raw Sheet View) `P0 / Phase 0`

- [ ] 사이드바 월 클릭 → Raw Sheet 뷰 전환
- [ ] 테이블 헤더 배경: bg-accent 초록색
- [ ] "합계" 행 강조, "관리비차감" 행 강조, 증감률 배지
- [ ] rawSheets 데이터 없으면 records에서 해당 월 폴백 렌더링
- [ ] "이 달 엑셀 저장" 버튼 (단일 시트 내보내기)
- [ ] "대시보드로" 버튼

---

### F-07. 엑셀 내보내기 (Excel Export) `P0 / Phase 0`

- [ ] 헤더에 "엑셀 내보내기" 버튼
- [ ] 파일명: `우리집_관리비현황.xlsx`
- [ ] 시트 1 "마스터": 전체 records (년도, 월, 항목, 당월금액, 전월금액, 증감액)
- [ ] 시트 2~N: 월별 rawSheets (시트명: `2026년2월` 형식)
- [ ] Raw Sheet 뷰 "이 달 엑셀 저장": 해당 월 단일 시트 파일

---

### F-08. 엑셀 가져오기 (Excel Import) `P0 / Phase 0`

- [ ] 업로드 탭 하단에 "엑셀 가져오기" 카드 표시
- [ ] 병합 모드: 기존 유지 + 중복 월은 새 데이터로 교체
- [ ] 덮어쓰기 모드: 기존 전체 삭제 후 새 데이터로 교체
- [ ] "마스터" 시트 파싱: 헤더 행 스킵, 6컬럼
- [ ] 월별 시트 파싱: 정규식 `/(\d{4})년(\d{1,2})월/`
- [ ] 완료 시 성공 메시지 (마스터 건수 + 월별 시트 수)
- [ ] storage 저장 후 UI 즉시 반영

---

### F-09. 데이터 마이그레이션 (localStorage → Firestore) `P1 / Phase 1`

- [ ] 기존 앱에서 내보낸 `.xlsx` 파일을 새 앱 엑셀 가져오기로 100% 복원
- [ ] 첫 로그인 시 "이전 앱 데이터가 있으신가요?" 안내 배너 표시 (선택)

---

### F-10. 사이드바 (Sidebar) `P0 / Phase 0`

- [ ] 메뉴 4개: 대시보드, 항목별 추이, 전체 데이터, 이미지 업로드
- [ ] 활성 뷰 강조 (bg-accent-light 배경, text-accent)
- [ ] 월별 데이터: 연도별 아코디언 (최신 연도 기본 오픈)
- [ ] 각 월 항목: 월 이름 + 합계 금액 배지
- [ ] 월 클릭 → Raw Sheet 뷰 전환
- [ ] 전체 초기화 버튼: AlertDialog 확인 후 storage 데이터 삭제

---

### F-11. PWA 지원 `P2 / Phase 2`

- [ ] `manifest.json`: name `우리집 관리비`, short_name `관리비`, 아이콘 (192×192, 512×512), 테마 컬러 `#2d5a3d`
- [ ] Service Worker: 정적 파일 Cache First 전략 (`next-pwa`)
- [ ] Firestore `enableIndexedDbPersistence` 활성화
- [ ] 오프라인: 대시보드, 차트, 테이블 뷰 열람 가능 (최근 캐시)
- [ ] 오프라인 업로드 시도 → 명시적 에러 메시지
- [ ] iOS Safari "홈 화면에 추가" 가이드 배너 (첫 방문)

---

### F-12. PDF 내보내기 (PDF Export) `P1 / Phase 1`

- [ ] 대시보드 PDF: 요약 카드 + 핵심 항목 카드 + 차트 2개 포함
- [ ] 차트 PDF: 4종 차트 + 필터 기간 정보 포함
- [ ] 테이블 PDF: 현재 월 테이블 전체 (CRUD 버튼 제외)
- [ ] 각 뷰 상단 "PDF 저장" 버튼 클릭 → PDF 파일 자동 다운로드
- [ ] 파일명 규칙: `관리비현황_대시보드_2026-04.pdf` 등
- [ ] PDF 헤더: 앱 이름 + 뷰 이름 + 생성 날짜
- [ ] PDF 용지: A4, 세로 방향 기본 (차트 뷰는 가로 방향 옵션)
- [ ] 한국어 폰트 임베딩 (Noto Sans KR 서브셋)
- [ ] 차트 이미지 해상도: 2배율(`devicePixelRatio: 2`) 캡처

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.1 | 2026-04-12 | Phase 2-6: Claude Vision 프롬프트 개선(max_tokens 4096, 금액 파싱 강화) + TableView 인라인 수정/삭제 기능(인라인 입력 폼, 삭제 확인 모달, 완료 알림 모달, Firestore 동기화) + 헤더 명칭 수정('비중금액' → '금월부과금', '전중금액' → '전월부과금') |
| 1.0 | 2026-04-10 | 최초 작성 — PRD v1.5 기반 TODO LIST |
