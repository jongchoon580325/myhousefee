# 제품 요구사항 문서 (PRD)
## 한일타운 관리비 현황 — Next.js + Firebase PWA 전환

**문서 버전**: 1.0
**작성일**: 2026-04-10
**대상 독자**: 개발자 (구현 담당자)
**원본 앱**: `우리집_관리비현황_v3.html` / `public/` (Phase 0 리팩토링 완료본)

---

## 목차

1. [제품 개요](#1-제품-개요)
2. [목표 및 성공 지표](#2-목표-및-성공-지표)
3. [사용자 페르소나](#3-사용자-페르소나)
4. [기술 아키텍처](#4-기술-아키텍처)
5. [기능 요구사항](#5-기능-요구사항)
6. [Firestore 데이터 스키마](#6-firestore-데이터-스키마)
7. [API 설계](#7-api-설계)
8. [UI/UX 요구사항](#8-uiux-요구사항)
9. [비기능 요구사항](#9-비기능-요구사항)
10. [페이즈 로드맵](#10-페이즈-로드맵)
11. [범위 외 (Out of Scope)](#11-범위-외-out-of-scope)

---

## 1. 제품 개요

### 1-1. 제품 정의

한국 아파트 거주자가 관리비 영수증을 AI로 스캔하여 월별 관리비 데이터를 추적하고 시각화하는 개인 재무 관리 웹 애플리케이션이다. 현재 단일 HTML 파일 기반 로컬 앱을 **Next.js 14 + Firebase 기반 클라우드 멀티유저 PWA**로 전환한다.

### 1-2. 현재 앱의 한계 (재구축 이유)

| # | 한계 | 영향 |
|---|------|------|
| 1 | **데이터 손실 위험** | localStorage는 브라우저 초기화, 기기 변경 시 영구 삭제 |
| 2 | **기기 간 접근 불가** | PC에서 입력한 데이터를 스마트폰에서 볼 수 없음 |
| 3 | **API 키 보안 취약** | Claude API 키를 브라우저 평문 저장 — XSS 공격 시 탈취 가능 |
| 4 | **단일 사용자 전용** | 가족 구성원, 다세대 공동 사용 불가 |
| 5 | **설치형 앱 경험 부재** | 모바일 홈 화면 추가, 오프라인 접근 불가 |
| 6 | **모바일 미지원** | 반응형 CSS 없음, 터치 이벤트 없음, PC 전용 고정 레이아웃 (220px 사이드바) |

### 1-3. 재구축 목표 (3줄 요약)

1. 데이터를 **Firestore 클라우드**에 저장하여 어느 기기에서나 접근 가능하게 한다.
2. Claude Vision API 호출을 **서버(Next.js API Route)가 대행**하여 API 키를 브라우저에서 완전히 제거한다.
3. **PWA**로 모바일 홈 화면 설치 및 오프라인 열람을 지원한다.

---

## 2. 목표 및 성공 지표

### 2-1. 정량적 목표

| 목표 | 측정 방법 | 목표값 |
|------|-----------|--------|
| 기능 동등성 | 기존 5개 뷰 · 12개 핵심 기능 재현 | 100% |
| 클라우드 전환 | Firestore 저장 + 다기기 동기화 | 다기기 테스트 통과 |
| 보안 개선 | 브라우저의 Claude API 키 노출 수 | 0 |
| PWA 설치 | Lighthouse PWA 감사 점수 | 90점 이상 |
| 초기 로드 성능 | LCP (Largest Contentful Paint) | 2.5초 이내 |

### 2-2. Phase별 성공 기준

**Phase 0 — 기능 재현**
- 5개 뷰(Dashboard, Charts, Table, Upload, Raw Sheet) 정상 동작
- Recharts로 교체 후 4종 차트 동일 데이터 출력
- Excel import/export(마스터 + 월별 시트 구조) 100% 호환

**Phase 1 — 클라우드 + 보안**
- Google 로그인 후 Firebase Console에서 사용자 UID 확인
- 영수증 업로드 → Next.js API Route → Firestore 저장 확인
- 브라우저 캐시 초기화 후 재로그인 → 전체 데이터 복원
- 계정 A 데이터가 계정 B에서 미노출(Firestore 보안 규칙 검증)

**Phase 2 — PWA + 고도화**
- Lighthouse PWA 감사: 설치 가능성, 오프라인 지원 모두 통과
- 오프라인 상태에서 기존 데이터 열람 가능
- 모바일 Safari/Chrome에서 홈 화면 추가 후 앱처럼 실행

---

## 3. 사용자 페르소나

### 페르소나 A — 가정주부 이미진 (주 타겟)

| 항목 | 내용 |
|------|------|
| 연령 | 40대 중반 |
| 기기 | iPhone + 집 PC |
| 상황 | 매달 날아오는 관리비 영수증을 사진으로 찍어 보관하고, 전월 대비 얼마 올랐는지 즉시 확인하고 싶음 |
| 페인포인트 | PC에서 입력한 데이터를 스마트폰에서 볼 수 없어 불편. AI가 영수증 숫자를 자동으로 읽어주길 원함 |
| 기술 수준 | 낮음. 앱 설치, Google 로그인은 할 수 있음 |

### 페르소나 B — 직장인 나종찬 (현재 사용자)

| 항목 | 내용 |
|------|------|
| 연령 | 40대 |
| 기기 | MacBook + iPhone |
| 상황 | 현재 앱 개발자 겸 사용자. 연도별 추이, 세대전기료/수도료/급탕비 비교를 정기적으로 확인 |
| 페인포인트 | localStorage 데이터 손실 경험. API 키를 브라우저에 직접 입력하는 것이 불안 |
| 기술 수준 | 높음. PWA 설치, 개발자 도구 사용 가능 |

### 페르소나 C — 가족 구성원 (미래 사용자)

| 항목 | 내용 |
|------|------|
| 상황 | 배우자나 부모님이 같은 세대 관리비를 함께 조회하고 싶음 |
| 페인포인트 | 같은 데이터를 공유할 방법이 없음 |
| 기술 수준 | 낮음. 링크를 열고 Google 로그인만 할 수 있음 |

---

## 4. 기술 아키텍처

### 4-1. 스택 결정 근거

| 레이어 | 선택 | 현재 대응 | 이유 |
|--------|------|-----------|------|
| Frontend | React + Next.js 14 App Router | Vanilla JS ES Modules | 컴포넌트 재사용, SSR/SSG, API Route 내장 |
| UI | shadcn/ui + Tailwind CSS | 수동 CSS (style.css) | 일관된 컴포넌트, Tailwind로 기존 색상 변수 재현 |
| Auth | Firebase Auth (Google) | 없음 | Google 로그인 원클릭, UID 기반 데이터 격리 |
| Database | Firestore | localStorage | 실시간 동기화, 다기기 접근, 오프라인 캐싱 |
| AI Proxy | Next.js API Route | 브라우저 직접 호출 | API 키 서버 격리, CORS 문제 해소 |
| Charts | Recharts | Chart.js 4.4 | React 네이티브, shadcn 호환 |
| Excel | SheetJS (xlsx) npm | SheetJS CDN | 동일 라이브러리, npm 패키지로 전환 |
| Hosting | Firebase Hosting | 없음 | Firebase 통합 배포 |
| PWA | next-pwa + Service Worker | 없음 | 오프라인 지원, 홈 화면 설치 |

### 4-2. 컴포넌트 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 (App Router)                  │
│                                                             │
│  app/                                                       │
│  ├── layout.tsx          ← RootLayout (PWA meta, font)     │
│  ├── page.tsx            ← 메인 앱 (인증 게이트)            │
│  └── api/                                                   │
│      └── analyze/route.ts ← Claude Vision 프록시            │
│                                                             │
│  components/                                                │
│  ├── layout/                                                │
│  │   ├── AppHeader.tsx   ← 헤더 (로그인/로그아웃)           │
│  │   ├── Sidebar.tsx     ← 사이드바 + 월별 아코디언          │
│  │   └── AppFooter.tsx                                      │
│  ├── views/                                                 │
│  │   ├── DashboardView.tsx                                  │
│  │   ├── ChartsView.tsx                                     │
│  │   ├── TableView.tsx                                      │
│  │   ├── UploadView.tsx                                     │
│  │   └── RawSheetView.tsx                                   │
│  ├── charts/                                                │
│  │   ├── TotalBarChart.tsx    ← 월별 합계 바차트             │
│  │   ├── Key3LineChart.tsx    ← 3항목 라인차트               │
│  │   ├── ItemLineChart.tsx    ← 단일 항목 라인차트           │
│  │   └── YearlyBarChart.tsx   ← 연간 합계 바차트             │
│  ├── table/                                                 │
│  │   ├── DataTable.tsx        ← 테이블 렌더러                │
│  │   └── InlineEditRow.tsx    ← 인라인 CRUD 편집             │
│  └── ui/                  ← shadcn/ui 컴포넌트들             │
│      └── button, card, dialog, select, table, ...          │
│                                                             │
│  lib/                                                       │
│  ├── firebase.ts          ← Firebase 클라이언트 초기화       │
│  ├── firebase-admin.ts    ← Firebase Admin SDK (서버 전용)  │
│  ├── firestore.ts         ← Firestore CRUD 함수             │
│  └── store.ts             ← Zustand 전역 상태                │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌──────────────────────┐
│  Firebase Auth  │          │  Next.js API Route   │
│  Google Provider│          │  /api/analyze        │
└────────┬────────┘          │  (서버에서만 실행)    │
         │                   └──────────┬───────────┘
         ▼                              │
┌─────────────────┐                     ▼
│   Firestore     │          ┌──────────────────────┐
│  users/{uid}/   │          │  Anthropic Claude    │
│  ├── records/   │          │  Vision API          │
│  └── rawSheets/ │          │  (claude-sonnet-4-6) │
└─────────────────┘          └──────────────────────┘
```

### 4-3. 핵심 데이터 흐름

**영수증 업로드 흐름**:
```
사용자 이미지 선택
  → UploadView: File → base64 변환 (브라우저)
  → Firebase Auth: getIdToken() 취득
  → POST /api/analyze { b64, mediaType, idToken }
    → Firebase Admin SDK로 idToken 검증
    → Anthropic API 호출 (서버 환경변수 API 키 사용)
    → JSON 파싱 → 응답 반환
  → Firestore 저장 (records + rawSheets)
  → Zustand store 업데이트 → UI 재렌더링
```

**초기 로드 흐름**:
```
앱 시작
  → Firebase Auth onAuthStateChanged
  → 미인증: LoginOverlay 표시
  → 인증됨: Firestore에서 사용자 데이터 로드
    → users/{uid}/records 전체 읽기
    → users/{uid}/rawSheets 전체 읽기
  → Zustand store 초기화
  → Dashboard 렌더링
```

---

## 5. 기능 요구사항

> **우선순위 정의**
> - **P0 (Must Have)**: 기존 기능 100% 재현. 없으면 앱이 의미 없음
> - **P1 (Should Have)**: 클라우드/보안 전환의 핵심
> - **P2 (Nice to Have)**: PWA, UX 고도화

---

### F-01. 인증 (Authentication)

**우선순위**: P1 | **Phase**: 1

**사용자 스토리**: 사용자는 Google 계정으로 로그인하여 자신만의 데이터 공간에 접근할 수 있다.

**수용 기준**:
- [ ] 앱 진입 시 미인증 상태면 전체 화면 로그인 오버레이 표시
- [ ] "Google로 로그인" 버튼 → `signInWithPopup(GoogleAuthProvider)` 실행
- [ ] 로그인 성공 → 오버레이 사라지고 Firestore에서 해당 uid 데이터 로드
- [ ] 헤더에 사용자 프로필 사진 + 이름 표시
- [ ] 로그아웃 버튼 → `signOut()` → 로그인 오버레이 재표시
- [ ] 페이지 새로고침 시 Firebase SDK의 로컬 persistence로 자동 로그인 유지
- [ ] 기존 앱의 "API 키 설정" 모달 완전 제거 (Phase 1 완료 후)

---

### F-02. 대시보드 (Dashboard)

**우선순위**: P0 | **Phase**: 0

**사용자 스토리**: 사용자는 앱 실행 시 가장 먼저 관리비 현황 요약을 볼 수 있다.

**수용 기준**:
- [ ] 데이터 없을 때 empty state + 업로드 탭으로 이동하는 CTA 버튼
- [ ] 요약 카드 4개: 총 합계, 데이터 개월수, 월 평균, 최고/최저월
- [ ] 핵심 항목 카드 3개: 세대전기료(`#E8A020`), 세대수도료(`#1a6b9a`), 세대급탕비(`#c0392b`)
  - 각 항목: 최근월 금액 + 전월 대비 증감 (증가 → 빨강, 감소 → 초록)
- [ ] 차트 2개: 월별 합계 바차트, 3항목 라인차트
- [ ] PDF 저장 버튼: 대시보드 전체 → PDF 파일 다운로드 (F-12 참조)

---

### F-03. 항목별 추이 차트 (Charts View)

**우선순위**: P0 | **Phase**: 0

**사용자 스토리**: 사용자는 세대전기료, 수도료, 급탕비, 연간 합계의 월별 추이를 개별 차트로 확인할 수 있다.

**수용 기준**:
- [ ] 필터: "전체" 버튼, 연도 드롭다운, 이전/다음 연도 이동 버튼
- [ ] "전체" 선택 시 모든 데이터 기간 표시
- [ ] 연도 선택 시 해당 연도 1~12월 범위로 필터링
- [ ] 이전/다음 버튼: 경계에서 비활성화
- [ ] 차트 4개 (fill 영역 포함 라인차트):
  - 세대전기료 (`#E8A020`)
  - 세대수도료 (`#1a6b9a`)
  - 세대급탕비 (`#c0392b`)
  - 연도별 합계 바차트 (`#2d5a3d`)
- [ ] PDF 저장 기능 지원 (F-12 참조)

---

### F-04. 전체 데이터 테이블 (Table View)

**우선순위**: P0 | **Phase**: 0

**사용자 스토리**: 사용자는 월별 관리비 전체 항목을 테이블로 확인하고 수정/추가/삭제할 수 있다.

**수용 기준**:
- [ ] 네비게이션: 연도 드롭다운, 월 드롭다운, 이전/다음 페이지 버튼 (1페이지 = 1개월)
- [ ] 실시간 항목명 검색 (대소문자 무관 부분 일치)
- [ ] 테이블 컬럼: 항목명, 당월금액, 전월금액, 증감액, 증감률(배지), 편집/삭제 버튼
- [ ] "합계" 행: 항상 마지막, `--accent-light` 배경, 볼드
- [ ] "관리비차감" 행: `#fff9e6` 노란색 배경
- [ ] 인라인 편집: amount-prev 자동 계산 → diff 자동 갱신 (readonly)
- [ ] 저장 시 rawSheets + records 양쪽 업데이트 후 Firestore 동기화
- [ ] 삭제: shadcn `AlertDialog`로 확인 후 삭제
- [ ] 항목 추가: 테이블 하단에 빈 행 인풋 추가 방식
- [ ] 연도 변경 시 해당 연도 마지막 월로 이동
- [ ] 사이드바 월별 항목과 하이라이트 동기화

---

### F-05. 영수증 업로드 + 영역 선택 + AI 분석 (Upload View)

**우선순위**: P0 (UI) + P1 (서버 프록시) | **Phase**: 0→1

**사용자 스토리**: 사용자는 관리비 영수증 전체 사진을 업로드한 후, 앱 내에서 "관리비 납입영수증" 테이블 영역을 드래그로 선택하면 AI가 해당 영역만 분석하여 항목과 금액을 자동 추출·저장해준다.

**배경 및 UX 개선 맥락**:
현재 사용자는 원본 영수증 사진에서 외부 사진 앱으로 "관리비 납입영수증(입주자용)" 테이블 부분을 수동 크롭한 후 업로드하는 번거로운 2단계 워크플로를 사용하고 있다. 이 크롭 작업을 앱 내부로 흡수하여 "전체 사진 업로드 → 앱 내 영역 드래그 → AI 추출" 원스톱 처리로 개선한다.

**수용 기준 — 업로드 UI**:
- [ ] 드래그앤드롭 영역 (클릭으로도 파일 선택)
- [ ] JPG, PNG 단일 파일 지원 (영역 선택 플로우는 1회 1파일 처리)
- [ ] 업로드 후 이미지 미리보기 표시 (전체 영수증 사진)
- [ ] 각 파일별 개별 로딩 상태 (스피너 + 파일명 표시)
- [ ] 완료 후 `input.value` 초기화 (동일 파일 재업로드 가능)

**수용 기준 — 앱 내 영역 선택 (크롭)**:
- [ ] 이미지 미리보기 위에서 마우스 드래그로 사각형 영역 선택 가능
- [ ] 선택 영역은 파란 반투명 오버레이 + 점선 테두리로 시각 표시
- [ ] 선택 후 "이 영역 분석" 버튼 클릭 → 선택 좌표 기준으로 이미지 크롭
- [ ] 크롭은 브라우저 `<canvas>` API로 클라이언트에서 처리 (서버 전송 전 전처리)
- [ ] 크롭된 이미지만 Claude Vision API로 전송 (전체 이미지 미전송)
- [ ] "전체 이미지로 분석" 버튼도 제공 (크롭 없이 전체 전송 — 이미 크롭된 사진 사용 시)
- [ ] 모바일 터치 드래그 지원 (touchstart / touchmove / touchend 이벤트)

**기술 구현 방식 (영역 크롭)**:
```typescript
// 선택 좌표 → canvas 크롭 → base64 변환
const canvas = document.createElement('canvas');
canvas.width = cropWidth;
canvas.height = cropHeight;
canvas.getContext('2d').drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
const croppedB64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
// → /api/analyze 로 전송
```

**수용 기준 — AI 분석 (Phase 0: 임시 클라이언트 호출, Phase 1: 서버 프록시)**:
- [ ] Phase 0: `/api/analyze` mock 또는 임시 직접 호출
- [ ] Phase 1: `POST /api/analyze` — Firebase Auth ID 토큰 포함, 서버에서 토큰 검증 후 Anthropic 호출
- [ ] 응답 형식: `{ year, month, items: [{item, amount, prev, diff}] }`
- [ ] 성공 시: rawSheets 업데이트 + records 업서트 + Firestore 저장
- [ ] 성공 시: 연월 + 항목 수 + 첫 6개 항목 미리보기 표시
- [ ] 실패 시: 파일별 에러 박스 (에러 메시지 포함)

**AI 프롬프트** (기존 유지):
```
이 이미지는 아파트 관리비 납입영수증입니다.
아래 JSON 형식으로 데이터를 추출하세요. JSON 외 다른 텍스트는 절대 출력하지 마세요.
{ "year": 년도(숫자), "month": 월(숫자), "items": [{...}] }
규칙: 금액은 쉼표 없는 순수 숫자, "합 계" 행은 item을 "합계"로, 관리비차감 포함, 빈 행 제외
```

---

### F-06. 월별 원본 데이터 (Raw Sheet View)

**우선순위**: P0 | **Phase**: 0

**사용자 스토리**: 사용자는 사이드바에서 특정 월을 클릭하면 그 달의 원본 항목 전체를 확인할 수 있다.

**수용 기준**:
- [ ] 사이드바 월 클릭 → Raw Sheet 뷰 전환
- [ ] 테이블 헤더 배경: `var(--accent)` 초록색
- [ ] "합계" 행 강조, "관리비차감" 행 강조, 증감률 배지
- [ ] rawSheets 데이터 없으면 records에서 해당 월 폴백 렌더링
- [ ] "이 달 엑셀 저장" 버튼 (단일 시트 내보내기)
- [ ] "대시보드로" 버튼

---

### F-07. 엑셀 내보내기 (Excel Export)

**우선순위**: P0 | **Phase**: 0

**사용자 스토리**: 사용자는 전체 데이터를 엑셀 파일로 내보내 로컬에 백업할 수 있다.

**수용 기준**:
- [ ] 헤더에 "엑셀 내보내기" 버튼
- [ ] 파일명: `우리집_관리비현황.xlsx`
- [ ] 시트 1 "마스터": 전체 records (년도, 월, 항목, 당월금액, 전월금액, 증감액)
- [ ] 시트 2~N: 월별 rawSheets (시트명: `2026년2월` 형식)
- [ ] Raw Sheet 뷰 "이 달 엑셀 저장": 해당 월 단일 시트 파일

---

### F-08. 엑셀 가져오기 (Excel Import)

**우선순위**: P0 | **Phase**: 0

**사용자 스토리**: 사용자는 기존에 내보냈던 엑셀 파일을 다시 가져와 데이터를 복원할 수 있다.

**수용 기준**:
- [ ] 업로드 탭 하단에 "엑셀 가져오기" 카드 표시
- [ ] 병합 모드: 기존 유지 + 중복 월은 새 데이터로 교체
- [ ] 덮어쓰기 모드: 기존 전체 삭제 후 새 데이터로 교체
- [ ] "마스터" 시트 파싱: 헤더 행 스킵, 6컬럼
- [ ] 월별 시트 파싱: 시트명 정규식 `/(\d{4})년(\d{1,2})월/`
- [ ] 완료 시 성공 메시지 (마스터 건수 + 월별 시트 수)
- [ ] Firestore 저장 후 UI 즉시 반영

---

### F-09. 데이터 마이그레이션 (localStorage → Firestore)

**우선순위**: P1 | **Phase**: 1

**사용자 스토리**: 기존 앱의 localStorage 데이터를 잃지 않고 새 앱으로 이전할 수 있다.

**구현 방식**: 별도 마이그레이션 도구 없이 기존 엑셀 내보내기/가져오기 활용

**수용 기준**:
- [ ] 기존 앱에서 내보낸 `.xlsx` 파일을 새 앱 엑셀 가져오기로 100% 복원
- [ ] 첫 로그인 시 "이전 앱 데이터가 있으신가요?" 안내 배너 표시 (선택)

---

### F-10. 사이드바 (Sidebar)

**우선순위**: P0 | **Phase**: 0

**사용자 스토리**: 사용자는 왼쪽 사이드바에서 뷰를 전환하고 월별 데이터에 빠르게 접근할 수 있다.

**수용 기준**:
- [ ] 메뉴 4개: 대시보드, 항목별 추이, 전체 데이터, 이미지 업로드
- [ ] 활성 뷰 강조 (`--accent-light` 배경, `--accent` 텍스트)
- [ ] 월별 데이터: 연도별 아코디언 (최신 연도 기본 오픈)
- [ ] 각 월 항목: 월 이름 + 합계 금액 배지
- [ ] 월 클릭 → Raw Sheet 뷰 전환
- [ ] 전체 초기화 버튼: shadcn `AlertDialog` 확인 후 Firestore 데이터 삭제

---

### F-11. PWA 지원

**우선순위**: P2 | **Phase**: 2

**사용자 스토리**: 사용자는 앱을 모바일 홈 화면에 설치하여 오프라인에서도 기존 데이터를 볼 수 있다.

**수용 기준**:
- [ ] `manifest.json`: name `우리집 관리비`, short_name `관리비`, 아이콘 (192×192, 512×512), 테마 컬러 `#2d5a3d`
- [ ] Service Worker: 정적 파일 Cache First 전략 (`next-pwa` 패키지)
- [ ] Firestore `enableIndexedDbPersistence` 활성화
- [ ] 오프라인: 대시보드, 차트, 테이블 뷰 열람 가능 (최근 캐시)
- [ ] 오프라인 업로드 시도 → 명시적 에러 메시지
- [ ] iOS Safari "홈 화면에 추가" 가이드 배너 (첫 방문)

---

### F-12. PDF 내보내기 (PDF Export)

**우선순위**: P1 | **Phase**: 1

**사용자 스토리**: 사용자는 대시보드, 차트, 테이블을 PDF 문서로 내보내 저장하거나 공유할 수 있다.

**출력 형태**: 브라우저 인쇄(`window.print()`) 대신 **PDF 파일 직접 다운로드**

**기술 구현 방식**:
- **`@react-pdf/renderer`** (React 전용 PDF 생성 라이브러리) — 텍스트/표 기반 뷰에 적합
- **`html2canvas` + `jsPDF`** — 차트(SVG/Canvas) 포함 뷰 전체를 이미지로 캡처 후 PDF 삽입
- 차트가 포함된 뷰는 `html2canvas` → `jsPDF`, 테이블 뷰는 `@react-pdf/renderer` 권장

**수용 기준**:
- [ ] 대시보드 PDF: 요약 카드 + 핵심 항목 카드 + 차트 2개 포함
- [ ] 차트 PDF: 4종 차트 + 필터 기간 정보 포함
- [ ] 테이블 PDF: 현재 월 테이블 전체 (CRUD 버튼 제외)
- [ ] 각 뷰 상단 "PDF 저장" 버튼 클릭 → PDF 파일 자동 다운로드
- [ ] 파일명 규칙: `관리비현황_대시보드_2026-04.pdf`, `관리비현황_테이블_2026-04.pdf` 등
- [ ] PDF 헤더: 앱 이름 + 뷰 이름 + 생성 날짜
- [ ] PDF 용지: A4, 세로 방향 기본 (차트 뷰는 가로 방향 옵션)
- [ ] 한국어 폰트 임베딩 (Noto Sans KR 서브셋 — `@react-pdf/renderer` font 등록)
- [ ] 차트 이미지 해상도: 2배율(`devicePixelRatio: 2`) 캡처로 선명도 보장

---

## 6. Firestore 데이터 스키마

### 6-1. 컬렉션 구조

```
firestore/
  users/
    {uid}/
      profile (서브컬렉션 또는 문서 필드)
        displayName: string
        email: string
        photoURL: string
        createdAt: Timestamp
        apartmentName?: string      ← 미래 확장용

      records/                      ← 레코드 서브컬렉션
        {year}-{month}-{item}       ← 예: "2026-02-세대전기료"
          year: number
          month: number
          item: string
          amount: number | null
          prev: number | null
          diff: number | null
          updatedAt: Timestamp

      rawSheets/                    ← 월별 원본 서브컬렉션
        {YYYY-MM}                   ← 예: "2026-02"
          items: Array<{
            item: string
            amount: number | null
            prev: number | null
            diff: number | null
          }>
          updatedAt: Timestamp
```

### 6-2. 주요 쿼리 패턴

| 작업 | 쿼리 |
|------|------|
| 전체 레코드 로드 | `getDocs(collection(db, 'users', uid, 'records'))` |
| 특정 월 rawSheet | `getDoc(doc(db, 'users', uid, 'rawSheets', 'YYYY-MM'))` |
| 레코드 저장/업데이트 | `setDoc(doc(..., key), data, { merge: true })` |
| 전체 삭제 | `writeBatch()` 사용 일괄 delete |

### 6-3. 보안 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 본인만 자신의 데이터에 읽기/쓰기 가능
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
    // 그 외 모든 접근 거부
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 7. API 설계

### 7-1. POST /api/analyze

**목적**: Claude Vision API 호출을 서버에서 대행. 브라우저의 API 키 노출 제거

**요청**:
```typescript
// Request Body
{
  b64: string;        // base64 인코딩된 이미지 (data URI prefix 제거)
  mediaType: string;  // 'image/jpeg' | 'image/png'
  idToken: string;    // Firebase Auth ID 토큰
}
```

**응답**:
```typescript
// 200 OK
{
  year: number;
  month: number;
  items: Array<{
    item: string;
    amount: number | null;
    prev: number | null;
    diff: number | null;
  }>;
}

// 401 Unauthorized — idToken 검증 실패
{ error: '인증이 필요합니다' }

// 422 Unprocessable Entity — JSON 파싱 실패
{ error: 'JSON 파싱 실패', raw: string }

// 500 Internal Server Error
{ error: string }
```

**서버 구현 핵심 (Next.js App Router)**:
```typescript
// app/api/analyze/route.ts
import { adminAuth } from '@/lib/firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  const { b64, mediaType, idToken } = await request.json();

  // 1. Firebase Admin으로 토큰 검증
  await adminAuth.verifyIdToken(idToken);  // 실패 시 throw → 401

  // 2. Anthropic API 호출 (서버 환경변수 API 키)
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
      { type: 'text', text: PROMPT }
    ]}]
  });

  // 3. JSON 파싱 후 반환
  const text = response.content[0].text.trim()
    .replace(/```json\n?|```\n?/g, '').trim();
  return Response.json(JSON.parse(text));
}
```

### 7-2. 환경변수

```bash
# 서버 전용 (브라우저 미노출)
ANTHROPIC_API_KEY=sk-ant-...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# 클라이언트 공개 (NEXT_PUBLIC_ 접두사)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 8. UI/UX 요구사항

### 8-1. 색상 시스템 (CSS 변수 → Tailwind 커스텀)

`style.css`의 `:root` 변수를 `tailwind.config.ts`의 `extend.colors`로 이전한다.

| CSS 변수 | 값 | Tailwind 커스텀 클래스 |
|----------|----|------------------------|
| `--bg` | `#f5f3ef` | `bg-app-bg` |
| `--surface` | `#ffffff` | `bg-surface` |
| `--surface2` | `#faf9f7` | `bg-surface2` |
| `--border` | `#e8e4dc` | `border-app` |
| `--text` | `#1a1814` | `text-app` |
| `--text2` | `#6b6560` | `text-muted` |
| `--text3` | `#9c968e` | `text-subtle` |
| `--accent` | `#2d5a3d` | `bg-accent` / `text-accent` |
| `--accent-light` | `#e8f0ea` | `bg-accent-light` |
| `--up` | `#1a6b3c` | `text-up` |
| `--up-light` | `#e8f5ec` | `bg-up-light` |
| `--down` | `#c0392b` | `text-down` |
| `--down-light` | `#fdf0ee` | `bg-down-light` |

**폰트**: `next/font/google`으로 Noto Sans KR (한국어) + DM Mono (숫자) 로드

### 8-2. shadcn/ui 컴포넌트 매핑

| 현재 요소 | shadcn/ui 컴포넌트 |
|-----------|-------------------|
| API Key 모달, 초기화 확인 모달 | `Dialog` / `AlertDialog` |
| 토스트 알림 | `Sonner` |
| 연도/월 드롭다운 | `Select` |
| 버튼 전반 | `Button` (default / outline / ghost / destructive) |
| 데이터 테이블 | `Table` |
| 요약 카드 | `Card` |
| 인풋 (검색, 편집) | `Input` |
| 병합/덮어쓰기 선택 | `RadioGroup` |
| 증감률 표시 | `Badge` |

### 8-3. 브랜딩

| 항목 | 값 |
|------|-----|
| **앱 타이틀** | `우리집 관리비` |
| **`<title>` 태그** | `우리집 관리비` |
| **PWA `manifest.json` name** | `우리집 관리비` |
| **PWA `manifest.json` short_name** | `관리비` |
| **Footer 문구** | `© 2026 Na Jong Choon. All rights reserved.` |
| **앱 아이콘** | SVG — 집 실루엣 + 원형 배경 (아래 스펙 참조) |

**앱 아이콘 SVG 스펙**:
- 형태: 원형 배경(`#2d5a3d`) 위에 흰색 집 실루엣 + 내부에 작은 원화 기호(₩) 또는 차트 막대
- 용도: favicon, PWA 아이콘 (192×192, 512×512 PNG로 변환하여 `public/icons/` 저장)
- 파일 위치: `public/icons/icon.svg`, `public/icons/icon-192.png`, `public/icons/icon-512.png`

```svg
<!-- 앱 아이콘 SVG (icon.svg) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- 원형 배경 -->
  <circle cx="50" cy="50" r="50" fill="#2d5a3d"/>
  <!-- 집 지붕 -->
  <polygon points="50,18 20,45 80,45" fill="white"/>
  <!-- 집 벽 -->
  <rect x="27" y="45" width="46" height="30" fill="white"/>
  <!-- 문 -->
  <rect x="42" y="57" width="16" height="18" fill="#2d5a3d"/>
  <!-- 창문 (차트 막대 — 관리비 트래킹 상징) -->
  <rect x="30" y="50" width="5" height="12" fill="#e8f0ea"/>
  <rect x="37" y="54" width="5" height="8"  fill="#e8f0ea"/>
  <rect x="60" y="52" width="5" height="10" fill="#e8f0ea"/>
  <rect x="67" y="48" width="5" height="14" fill="#e8f0ea"/>
</svg>
```

### 8-4. 레이아웃 구조

```
height: 100vh
├── AppHeader (height: 56px, sticky top, bg: accent)
│   └── 좌: 앱 아이콘 + "우리집 관리비" 타이틀
│       우: 로그인 사용자 프로필 + 로그아웃 버튼
├── layout (flex, height: calc(100vh - 56px - 44px))
│   ├── Sidebar (width: 220px, bg: surface, border-right)
│   └── Main (flex: 1, overflow-y: auto, padding: 20px)
└── AppFooter (height: 44px, sticky bottom, bg: accent)
    └── "© 2026 Na Jong Choon. All rights reserved."
```

### 8-5. 반응형 전략

**현재 앱 모바일 지원 현황 (미구현)**:

| 항목 | 현재 상태 |
|------|-----------|
| `<meta name="viewport">` | ✅ 있음 (`width=device-width, initial-scale=1.0`) |
| 반응형 CSS `@media` 미디어 쿼리 | ❌ 없음 (`@media print` 1개만 존재) |
| 터치 이벤트 처리 | ❌ 없음 (`touch`, `ontouchstart` 코드 없음) |
| 모바일 레이아웃 | ❌ 없음 (220px 고정 사이드바, PC 전용) |
| PWA / Service Worker | ❌ 없음 |

**Phase별 반응형 구현 계획**:
- **Phase 0/1**: PC 레이아웃 우선 (220px 고정 사이드바 + 메인). 모바일 최소 동작 보장 수준
- **Phase 2**: 완전한 모바일 반응형 구현
  - 브레이크포인트: `sm(640px)`, `md(768px)`, `lg(1024px)` (Tailwind 기본값 사용)
  - 768px 이하: 사이드바 숨김 → 하단 탭바 또는 햄버거 드로어로 전환
  - 영역 선택 크롭 UI: 터치 드래그 (`touchstart` / `touchmove` / `touchend`) 지원
  - 테이블: 수평 스크롤 (`overflow-x: auto`)
  - 카드 그리드: 2열 → 1열 전환

---

## 9. 비기능 요구사항

### 9-1. 성능

| 항목 | 목표값 |
|------|--------|
| LCP | 2.5초 이내 |
| TBT | 200ms 이내 |
| Firestore 초기 로드 | 1초 이내 (레코드 500건 이하 기준) |
| 차트 렌더링 | 500ms 이내 |
| AI 분석 응답 | 10초 이내 |

**최적화 전략**:
- `next/dynamic`으로 차트 컴포넌트 지연 로딩 (SSR 제외)
- Firestore: 전체 컬렉션 1회 로드 후 클라이언트 필터링 (현재 패턴 유지)
- `useMemo`로 차트 데이터 계산 메모이제이션

### 9-2. 보안

| 항목 | 요구사항 |
|------|----------|
| API 키 | `ANTHROPIC_API_KEY` 서버 환경변수만. `.env.local`, 브라우저 미노출 |
| Firestore 규칙 | `request.auth.uid == userId` 일치 검증 필수 |
| API Route 인증 | 모든 `/api/analyze` 요청에서 Firebase Admin SDK로 ID 토큰 검증 |
| HTTPS | Firebase Hosting 기본 HTTPS 제공 |
| 이미지 데이터 | base64 이미지 API Route에서만 처리, Firestore 저장 없음 |
| XSS | React 기본 이스케이프 + shadcn/ui Radix 기반으로 위험 최소화 |

### 9-3. 접근성

- shadcn/ui (Radix UI 기반): WAI-ARIA 속성 내장, 키보드 네비게이션, 포커스 트랩
- `lang="ko"` 속성 유지
- 색상 대비: accent `#2d5a3d` WCAG AA 기준 충족

### 9-4. 오류 처리

| 오류 상황 | 처리 방식 |
|-----------|-----------|
| Firebase 초기화 실패 | 전체 화면 에러 메시지 |
| Firestore 읽기 실패 | 토스트 에러 + 빈 상태 표시 |
| AI API 응답 오류 | 파일별 에러 박스 (오류 메시지 포함) |
| JSON 파싱 실패 | 에러 박스에 raw 응답 일부 표시 |
| 네트워크 오프라인 | Firestore 캐시 사용, 업로드 시 명시적 안내 |
| 인증 토큰 만료 | Firebase SDK 자동 갱신 |

---

## 10. 페이즈 로드맵

### Phase 0 — 기능 재현 (예상: 2~3주)

**목표**: Next.js + shadcn/ui로 기존 기능 100% 재현. Firebase 없이 localStorage 임시 사용

| # | 태스크 | 산출물 |
|---|--------|--------|
| 0-1 | Next.js 프로젝트 초기화 | `package.json`, `tailwind.config.ts`, `next.config.ts` |
| 0-2 | Tailwind 색상 시스템 설정 | `tailwind.config.ts` (CSS 변수 이전) |
| 0-3 | shadcn/ui 컴포넌트 설치 | Button, Card, Dialog, AlertDialog, Select, Table, Input, Badge, Sonner, RadioGroup |
| 0-4 | 레이아웃 컴포넌트 | `AppHeader`, `Sidebar`, `AppFooter` |
| 0-5 | Zustand 전역 상태 | `lib/store.ts` (기존 state.js 대응, 13개 필드) |
| 0-6 | localStorage 어댑터 | `lib/storage.ts` (Phase 1에서 Firestore로 교체) |
| 0-7 | DashboardView | 요약 카드 + 핵심 항목 카드 + 2개 Recharts |
| 0-8 | Recharts 컴포넌트 4종 | TotalBarChart, Key3LineChart, ItemLineChart, YearlyBarChart |
| 0-9 | ChartsView | 연도 필터 + 4개 차트 |
| 0-10 | TableView + InlineEditRow | 테이블 + 전체 CRUD |
| 0-11 | UploadView — 파일 업로드 + 이미지 미리보기 | 드래그앤드롭 + 업로드 후 전체 이미지 미리보기 표시 |
| 0-11-1 | UploadView — 영역 선택 크롭 UI | 마우스 드래그 선택 오버레이, canvas 크롭, "이 영역 분석" / "전체 이미지로 분석" 버튼 |
| 0-11-2 | UploadView — AI 분석 연동 | 크롭 이미지 base64 → 임시 직접 호출 (Phase 1에서 API Route로 교체) |
| 0-12 | RawSheetView | 월별 원본 테이블 |
| 0-13 | Excel import/export | SheetJS npm 패키지 |
| 0-14 | 인쇄 CSS | `globals.css` @media print |

**완료 기준**: `npm run dev` 실행 후 기존 앱과 기능 동등성 100%

---

### Phase 1 — Firebase 연동 (예상: 2주)

**목표**: Google 로그인, Firestore 데이터 저장, API Route 보안 프록시

| # | 태스크 | 산출물 |
|---|--------|--------|
| 1-1 | Firebase 프로젝트 생성 + 설정 | `lib/firebase.ts` |
| 1-2 | Firebase Admin SDK 초기화 | `lib/firebase-admin.ts` |
| 1-3 | Firebase Auth + LoginOverlay | `AuthProvider`, `LoginOverlay.tsx` |
| 1-4 | Firestore CRUD 함수 | `lib/firestore.ts` (loadData, saveRecord, saveRawSheet, deleteAll) |
| 1-5 | localStorage → Firestore 교체 | `lib/store.ts` + `lib/firestore.ts` 연결 |
| 1-6 | `/api/analyze` API Route | `app/api/analyze/route.ts` |
| 1-7 | UploadView: idToken 취득 + API Route 호출 | `UploadView.tsx` 수정 |
| 1-8 | Firestore 보안 규칙 배포 | `firestore.rules` |
| 1-9 | Firebase Hosting 설정 | `firebase.json`, `.firebaserc` |
| 1-10 | 환경변수 설정 | `.env.local` + Firebase 콘솔 환경변수 |
| 1-11 | PDF 내보내기 구현 | `html2canvas` + `jsPDF` (차트 뷰), `@react-pdf/renderer` (테이블 뷰), Noto Sans KR 폰트 임베딩 |
| 1-12 | 배포 | `firebase deploy` 또는 Vercel |

**완료 기준**: 다기기에서 동일 Google 계정 로그인 후 데이터 동기화 확인

---

### Phase 2 — PWA + 고도화 (예상: 1~2주)

**목표**: 모바일 설치 가능, 오프라인 지원, UX 개선

| # | 태스크 | 내용 |
|---|--------|------|
| 2-1 | next-pwa 설정 | Service Worker, Cache Strategy |
| 2-2 | Web App Manifest | `manifest.json` — name: `우리집 관리비`, short_name: `관리비`, 테마 컬러: `#2d5a3d`, 아이콘 192/512px |
| 2-2-1 | 앱 아이콘 생성 | `public/icons/icon.svg` → PNG 변환 (192×192, 512×512) |
| 2-3 | Firestore 오프라인 persistence | `enableIndexedDbPersistence` 활성화 |
| 2-4 | 모바일 레이아웃 | Tailwind 반응형 (`sm`/`md`/`lg`) — 768px 이하: 사이드바 → 하단 탭바/드로어, 카드 1열, 테이블 수평 스크롤 |
| 2-4-1 | 터치 이벤트 | 영역 선택 크롭 드래그에 `touchstart`/`touchmove`/`touchend` 지원 추가 |
| 2-5 | 아파트명 설정 | 첫 로그인 시 입력 → `profile.apartmentName` 저장 |
| 2-6 | AI 프롬프트 개선 | apartmentName을 프롬프트 컨텍스트로 삽입 |
| 2-7 | 다크모드 | Tailwind `dark:` 클래스 적용 |

---

## 11. 범위 외 (Out of Scope)

다음 기능은 이 PRD 범위에 포함되지 않는다:

| 기능 | 제외 이유 |
|------|-----------|
| 가족 공유 그룹 | Firestore 구조 대규모 변경 필요 |
| 관리비 납부 알림 | Cloud Functions + FCM 별도 구현 필요 |
| 예산 설정 및 초과 알림 | 별도 데이터 모델 필요 |
| AI 항목명 자동 표준화 | 아파트별 상이한 항목명 처리 복잡도 높음 |
| ~~PDF 내보내기~~ | ~~현재 인쇄 기능으로 대체~~ → **F-12로 범위 내 이동 (P1)** |
| 관리자 대시보드 | 다른 사용자 데이터 접근은 보안 정책 위반 |
| 결제/구독 | 현재 단계에서 수익화 계획 없음 |
| Kakao/Naver/Apple 로그인 | Google 로그인으로 충분 |
| 챗봇 인터페이스 | 별도 제품 영역 |
| 외부 공개 API | 현재 단계에서 불필요 |

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.0 | 2026-04-10 | 최초 작성 — Next.js + Firebase PWA 전환 PRD (11개 섹션) |
| 1.1 | 2026-04-10 | F-12 인쇄 → PDF 내보내기로 변경 (`@react-pdf/renderer` + `html2canvas` + `jsPDF`) |
| 1.2 | 2026-04-10 | F-05 영역 선택 크롭 기능 추가 — 앱 내 드래그로 관리비 테이블 영역 선택 후 해당 영역만 AI 전송 |
| 1.3 | 2026-04-10 | 현재 앱 모바일 미지원 현황 분석 및 Phase 2 반응형 계획 추가 (8-5절) |
| 1.4 | 2026-04-10 | 브랜딩 섹션 추가 (8-3절) — 앱 타이틀, 앱 아이콘 SVG, footer 문구 |
| 1.5 | 2026-04-10 | 문서 정합성 수정 — 섹션 번호 중복 해소(8-4/8-5), Out of Scope PDF 항목 수정, F-02/F-03 PDF 일치, Phase 1 로드맵 1-11 PDF 태스크 추가, Phase 0 로드맵 0-11 크롭 UI 태스크 분리 |








-----------------------
