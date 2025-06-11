import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // セッションデータを取得
    const sessions = global.pdfSessions || new Map();
    const sessionData = sessions.get(sessionId);

    if (!sessionData) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    // 期限切れチェック
    if (Date.now() > sessionData.expiresAt) {
      sessions.delete(sessionId);
      return NextResponse.json(
        { error: "Session expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      cardData: sessionData.cardData,
    });
  } catch (error) {
    console.error("Error getting PDF data:", error);
    return NextResponse.json(
      { error: "Failed to get PDF data" },
      { status: 500 }
    );
  }
}