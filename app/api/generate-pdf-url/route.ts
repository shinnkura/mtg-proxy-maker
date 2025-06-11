import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { cardData } = await request.json();

    if (!cardData || !Array.isArray(cardData)) {
      return NextResponse.json(
        { error: "Invalid card data" },
        { status: 400 }
      );
    }

    // 一意のIDを生成
    const sessionId = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // カードデータを一時的に保存（実際のアプリケーションではRedisやデータベースを使用）
    // ここでは簡単のためにメモリに保存（本番環境では適切な永続化が必要）
    global.pdfSessions = global.pdfSessions || new Map();
    global.pdfSessions.set(sessionId, {
      cardData,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24時間後に期限切れ
    });

    // セッションIDを含むURLを生成
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const pdfUrl = `${baseUrl}/pdf/${sessionId}`;

    return NextResponse.json({
      success: true,
      pdfUrl,
      sessionId,
    });
  } catch (error) {
    console.error("Error generating PDF URL:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF URL" },
      { status: 500 }
    );
  }
}