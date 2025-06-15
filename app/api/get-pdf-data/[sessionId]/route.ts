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

    // セッションデータを取得
    const sessions = globalThis.pdfSessions || new Map();
    const sessionData = sessions.get(sessionId);
    
    // デバッグ用ログ
    console.log(`Looking for session: ${sessionId}`);
    console.log(`Available sessions: ${Array.from(sessions.keys()).join(', ')}`);
    console.log(`Session found: ${!!sessionData}`);

    if (!sessionData) {
      // より詳細なエラー情報
      const availableSessions = Array.from(sessions.keys());
      console.error(`Session not found: ${sessionId}. Available: [${availableSessions.join(', ')}]`);
      
      return NextResponse.json(
        { 
          error: "セッションが見つかりません。QRコードの有効期限が切れているか、セッションが正しく作成されていない可能性があります。",
          sessionId,
          availableSessions: availableSessions.length,
          debug: process.env.NODE_ENV === 'development' ? availableSessions : undefined
        },
        { status: 404 }
      );
    }

    // 期限切れチェック
    if (Date.now() > sessionData.expiresAt) {
      sessions.delete(sessionId);
      console.log(`Session expired and deleted: ${sessionId}`);
      return NextResponse.json(
        { error: "セッションの有効期限が切れています。新しいQRコードを生成してください。" },
        { status: 410 }
      );
    }
    
    console.log(`Session data retrieved successfully for: ${sessionId}`);

    return NextResponse.json({
      success: true,
      cardData: sessionData.cardData,
    });
  } catch (error) {
    console.error(`Error getting PDF data for session ${sessionId}:`, error);
    return NextResponse.json(
      { 
        error: "PDFデータの取得に失敗しました。しばらく時間をおいて再度お試しください。",
        sessionId 
      },
      { status: 500 }
    );
  }
}