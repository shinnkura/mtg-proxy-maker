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

    // 一意のIDを生成（より確実な方法）
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 9);
    const sessionId = `pdf_${timestamp}_${randomPart}`;
    
    // セッションデータ
    const sessionData = {
      cardData,
      createdAt: timestamp,
      expiresAt: timestamp + 7 * 24 * 60 * 60 * 1000, // 7日間有効
    };

    // グローバルセッション管理の初期化と保存
    if (typeof globalThis !== 'undefined') {
      if (!globalThis.pdfSessions) {
        globalThis.pdfSessions = new Map();
        console.log('Initialized new pdfSessions Map');
      }
      
      globalThis.pdfSessions.set(sessionId, sessionData);
      
      // 保存確認
      const savedData = globalThis.pdfSessions.get(sessionId);
      if (!savedData) {
        console.error(`Failed to save session data for: ${sessionId}`);
        return NextResponse.json(
          { error: "セッションの保存に失敗しました" },
          { status: 500 }
        );
      }
      
      console.log(`Session saved successfully: ${sessionId}`);
      console.log(`Total sessions: ${globalThis.pdfSessions.size}`);
      console.log(`Card count: ${cardData.length}`);
    } else {
      console.error('globalThis is not available');
      return NextResponse.json(
        { error: "セッション管理が利用できません" },
        { status: 500 }
      );
    }

    // セッションIDを含むURLを生成
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const pdfUrl = `${baseUrl}/pdf/${sessionId}`;

    console.log(`Generated PDF URL: ${pdfUrl}`);

    return NextResponse.json({
      success: true,
      pdfUrl,
      sessionId,
      debug: process.env.NODE_ENV === 'development' ? {
        cardCount: cardData.length,
        sessionId,
        timestamp,
        totalSessions: globalThis.pdfSessions?.size || 0
      } : undefined
    });
  } catch (error) {
    console.error("Error generating PDF URL:", error);
    return NextResponse.json(
      { error: "PDF URLの生成に失敗しました" },
      { status: 500 }
    );
  }
}