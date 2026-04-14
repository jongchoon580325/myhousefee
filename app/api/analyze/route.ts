import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { app as adminApp } from "@/lib/firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import type { ManagementRecord } from "@/lib/store";

interface AnalyzeRequest {
  b64: string;
  mediaType: "image/jpeg" | "image/png";
  idToken: string;
  year: number;
  month: number;
}

interface AnalyzeResponse {
  year: number;
  month: number;
  items: ManagementRecord[];
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check if Firebase Admin is properly initialized
    if (!adminApp) {
      return NextResponse.json(
        { error: "서버 설정이 완료되지 않았습니다. 관리자에게 문의하세요." },
        { status: 503 }
      );
    }

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
    try {
      const auth = getAuth(adminApp);
      await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Call Claude Vision API
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: b64,
              },
            },
            {
              type: "text",
              text: `이 이미지는 한국 아파트 관리비 납입영수증입니다.

[영수증 구조]
일반적으로 테이블 형태로: 항목명 | 당월금액 | 전월금액 | 증감액
열이 3개일 경우 diff는 null로 처리.

[출력 형식 - JSON만 반환, 다른 텍스트 금지]
{"items":[{"item":"항목명","amount":당월금액,"prev":전월금액,"diff":증감액}]}

[추출 규칙]
1. 금액: 쉼표 제거 후 정수 (예: "1,234" → 1234, "-500" → -500, 빈칸 → null)
2. 0원은 null이 아닌 0으로 표기
3. 항목명: 중간 공백 제거 ("세 대 전 기 료" → "세대전기료")
4. "합 계" / "합계" / "소 계" / "소계" → item을 "합계" 또는 "소계"로 정규화
5. 차감 항목("관리비차감", "감면" 등)은 amount를 음수로
6. 빈 행, 구분선, 머리글 행은 제외
7. 페이지 하단 납부 안내문, 계좌번호 등은 제외

[흔한 항목명 참고 - OCR 불확실 시 유추]
일반관리비, 청소비, 경비비, 소독비, 승강기유지비, 지능형홈네트워크,
세대전기료, 공용전기료, 세대수도료, 공용수도료, 세대급탕비,
장기수선충당금, 잡수입공제, 관리비차감, 선납공제

JSON 외 어떤 텍스트도 출력하지 마세요. 반드시 { 로 시작하세요.`,
            },
          ],
        },
      ],
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    let parsedData: AnalyzeResponse;
    try {
      // Claude가 마크다운 코드블록으로 감싸서 반환할 수 있으므로 제거
      const cleanedText = content.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
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
  } catch (error) {
    console.error("Analyze error:", error);
    const message = error instanceof Error ? error.message : "분석 중 오류 발생";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
