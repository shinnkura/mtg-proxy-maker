// グローバル変数の型定義
declare global {
  var pdfSessions: Map<string, {
    cardData: Array<{ url: string; value: number }>;
    createdAt: number;
    expiresAt: number;
  }> | undefined;
}

export {};