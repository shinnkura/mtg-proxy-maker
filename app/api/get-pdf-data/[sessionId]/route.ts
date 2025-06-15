import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    console.log(`Attempting to retrieve session: ${sessionId}`);

    // グローバルセッション管理の確認
    if (typeof globalThis === 'undefined') {
      console.error('globalThis is not available');
      return NextResponse.json(
        { error: "セッション管理が利用できません" },
        { status: 500 }
      );
    }

    // セッションマップの初期化確認
    if (!globalThis.pdfSessions) {
      console.error('pdfSessions Map is not initialized');
      return NextResponse.json(
        { 
          error: "セッションストレージが初期化されていません。新しいQRコードを生成してください。",
          sessionId,
          debug: process.env.NODE_ENV === 'development' ? {
            globalThisAvailable: typeof globalThis !== 'undefined',
            pdfSessionsExists: !!globalThis.pdfSessions
          } : undefined
        },
        { status: 404 }
      );
    }

    const sessions = globalThis.pdfSessions;
    const sessionData = sessions.get(sessionId);
    
    // デバッグ情報
    const availableSessions = Array.from(sessions.keys());
    console.log(`Looking for session: ${sessionId}`);
    console.log(`Total sessions available: ${sessions.size}`);
    console.log(`Available session IDs: ${availableSessions.slice(0, 5).join(', ')}${availableSessions.length > 5 ? '...' : ''}`);
    console.log(`Session found: ${!!sessionData}`);

    if (!sessionData) {
      console.error(`Session not found: ${sessionId}`);
      
      return NextResponse.json(
        { 
          error: "セッションが見つかりません。QRコードの有効期限が切れているか、セッションが正しく作成されていない可能性があります。",
          sessionId,
          debug: process.env.NODE_ENV === 'development' ? {
            requestedSessionId: sessionId,
            availableSessionsCount: availableSessions.length,
            recentSessions: availableSessions.slice(-3),
            sessionIdFormat: sessionId.startsWith('pdf_') ? 'correct' : 'incorrect'
          } : undefined
        },
        { status: 404 }
      );
    }

    // 期限切れチェック
    const now = Date.now();
    if (now > sessionData.expiresAt) {
      sessions.delete(sessionId);
      console.log(`Session expired and deleted: ${sessionId}`);
      return NextResponse.json(
        { 
          error: "セッションの有効期限が切れています。新しいQRコードを生成してください。",
          debug: process.env.NODE_ENV === 'development' ? {
            sessionId,
            createdAt: new Date(sessionData.createdAt).toISOString(),
            expiresAt: new Date(sessionData.expiresAt).toISOString(),
            currentTime: new Date(now).toISOString()
          } : undefined
        },
        { status: 410 }
      );
    }
    
    console.log(`Session data retrieved successfully for: ${sessionId}`);
    console.log(`Card data length: ${sessionData.cardData?.length || 0}`);

    return NextResponse.json({
      success: true,
      cardData: sessionData.cardData,
      debug: process.env.NODE_ENV === 'development' ? {
        sessionId,
        cardCount: sessionData.cardData?.length || 0,
        createdAt: new Date(sessionData.createdAt).toISOString(),
        expiresAt: new Date(sessionData.expiresAt).toISOString()
      } : undefined
    });
  } catch (error) {
    console.error("Error getting PDF data:", error);
    return NextResponse.json(
      { 
        error: "PDFデータの取得に失敗しました。しばらく時間をおいて再度お試しください。",
        debug: process.env.NODE_ENV === 'development' ? {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    );
  }
}