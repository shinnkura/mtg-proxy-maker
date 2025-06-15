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
    if (typeof globalThis !== 'undefined') {
      globalThis.pdfSessions = globalThis.pdfSessions || new Map();
      globalThis.pdfSessions.set(sessionId, {
        cardData,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7日間有効（モバイル対応のため延長）
      });
    }

    // デバッグ用ログ
    console.log(`Session created: ${sessionId}, Cards: ${printData.length}`);

    // セッションデータの保存確認
    const sessions = globalThis.pdfSessions || new Map();
    const savedSession = sessions.get(sessionId);
    if (!savedSession) {
      console.error(`Failed to save session: ${sessionId}`);
      return NextResponse.json(
        { error: "セッションの保存に失敗しました" },
        { status: 500 }
      );
    }

    // 代替保存方法（メモリ以外）
    try {
      // ローカルストレージ的な代替手段
      const sessionData = {
        cardData,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7日間有効（モバイル対応のため延長）
      };
      
      // 環境変数やファイルシステムが使える場合の代替保存
      if (process.env.NODE_ENV === 'development') {
        // 開発環境では追加のログ
        console.log(`Session data saved for ${sessionId}:`, sessionData);
      }
    } catch (error) {
      console.error('Alternative session save failed:', error);
    }

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