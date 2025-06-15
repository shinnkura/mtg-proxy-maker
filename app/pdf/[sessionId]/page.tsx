"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertCircle, FileText, Download } from "lucide-react";

interface CardData {
  url: string;
  value: number;
}

export default function PDFViewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // モバイル判定
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    
    const fetchCardData = async () => {
      try {
        setProgress({ current: 0, total: 0, message: "データを取得中..." });
        
        const response = await fetch(`/api/get-pdf-data/${sessionId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("セッションが見つかりません。QRコードの有効期限が切れている可能性があります。");
          } else if (response.status === 410) {
            throw new Error("セッションの有効期限が切れています。");
          } else {
            throw new Error("データの取得に失敗しました。");
          }
        }

        const data = await response.json();
        
        if (!data.success || !data.cardData) {
          throw new Error("無効なデータです。");
        }
        
        // データ取得後、自動的にPDF生成を開始
        await generatePDF(data.cardData);
      } catch (error) {
        console.error("Error fetching card data:", error);
        setError(error instanceof Error ? error.message : "データの取得に失敗しました");
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchCardData();
    }
  }, [sessionId]);

  const generatePDF = async (printData: CardData[]) => {
    if (isGenerating) return; // 重複実行を防ぐ
    
    try {
      setIsGenerating(true);
      setProgress({ current: 0, total: 0, message: "PDF生成を準備中..." });

      if (printData.length === 0) {
        throw new Error("PDFに出力するカードがありません");
      }

      // jsPDFを動的に読み込み
      const { default: jsPDF } = await import("jspdf");

      // カードを展開
      const expandedCards: string[] = [];
      printData.forEach((card) => {
        for (let i = 0; i < card.value; i++) {
          expandedCards.push(card.url);
        }
      });

      setProgress({ 
        current: 0, 
        total: expandedCards.length, 
        message: "画像の読み込みを開始しています..." 
      });

      // カードを3列に配置
      const cardRows: string[][] = [];
      let currentRow: string[] = [];
      let cardCount = 0;

      expandedCards.forEach((cardUrl) => {
        currentRow.push(cardUrl);
        cardCount++;
        if (cardCount % 3 === 0) {
          cardRows.push([...currentRow]);
          currentRow = [];
        }
      });

      if (currentRow.length > 0) {
        cardRows.push(currentRow);
      }

      // PDF設定
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const cardWidth = 63;
      const cardHeight = 88;
      const a4Width = 210;
      const a4Height = 297;
      const totalCardWidth = 3 * cardWidth;
      const remainingWidth = a4Width - totalCardWidth;
      const marginX = 5;
      const spacingX = (remainingWidth - 2 * marginX) / 2;
      const totalCardHeight = 3 * cardHeight;
      const remainingHeight = a4Height - totalCardHeight;
      const marginY = 10;
      const spacingY = (remainingHeight - 2 * marginY) / 2;

      let currentPageRowCount = 0;
      const maxRowsPerPage = 3;

      // 画像をロードしてBase64に変換
      const loadImageAsBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();

          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              const dpi = 300;
              canvas.width = Math.round((cardWidth / 25.4) * dpi);
              canvas.height = Math.round((cardHeight / 25.4) * dpi);
              const ctx = canvas.getContext("2d");

              if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataURL = canvas.toDataURL("image/JPEG", 0.95);
                resolve(dataURL);
              } else {
                reject(new Error("Canvas context not available"));
              }
            } catch (error) {
              reject(error);
            }
          };

          img.onerror = () => {
            reject(new Error(`Failed to load image: ${url}`));
          };

          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
          img.src = proxyUrl;
          img.crossOrigin = "anonymous";
        });
      };

      let processedImages = 0;
      const totalImages = expandedCards.length;

      for (let rowIndex = 0; rowIndex < cardRows.length; rowIndex++) {
        const row = cardRows[rowIndex];

        if (currentPageRowCount >= maxRowsPerPage) {
          pdf.addPage();
          currentPageRowCount = 0;
        }

        const rowY = marginY + currentPageRowCount * (cardHeight + spacingY);

        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const cardUrl = row[colIndex];
          const colX = marginX + colIndex * (cardWidth + spacingX);

          setProgress({
            current: processedImages,
            total: totalImages,
            message: `画像を処理中 (${processedImages + 1}/${totalImages})`
          });

          try {
            const base64Image = await loadImageAsBase64(cardUrl);
            pdf.addImage(
              base64Image,
              "JPEG",
              colX,
              rowY,
              cardWidth,
              cardHeight
            );
          } catch (error) {
            console.error(`Error loading image: ${cardUrl}`, error);
            // エラーの場合、プレースホルダーを表示
            pdf.setFillColor(240, 240, 240);
            pdf.rect(colX, rowY, cardWidth, cardHeight, "F");
            pdf.setTextColor(128, 128, 128);
            pdf.setFontSize(8);
            pdf.text(
              "画像読み込み失敗",
              colX + cardWidth / 2,
              rowY + cardHeight / 2,
              { align: "center" }
            );
          }
          processedImages++;
        }

        currentPageRowCount++;
      }

      setProgress({
        current: totalImages,
        total: totalImages,
        message: "PDFを生成中..."
      });

      // PDFを生成
      const pdfBlob = pdf.output("blob");
      setPdfBlob(pdfBlob);
      
      // 自動でPDFを表示/ダウンロード
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      if (isMobile) {
        // モバイルの場合はダウンロード
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `mtg-proxy-cards-${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setProgress({
          current: totalImages,
          total: totalImages,
          message: "PDFダウンロード完了！"
        });
      } else {
        // デスクトップの場合は新しいタブで開く
        window.open(pdfUrl, "_blank");
        
        setProgress({
          current: totalImages,
          total: totalImages,
          message: "PDF表示完了！"
        });
      }
      
      setIsLoading(false);

    } catch (error) {
      console.error("PDF generation error:", error);
      setError(`PDFの生成に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
      setIsLoading(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfBlob) {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `mtg-proxy-cards-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
    }
  };

  const handleViewPDF = () => {
    if (pdfBlob) {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full transition-colors"
            >
              戻る
            </button>
            <button
              onClick={() => window.close()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg w-full transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center border border-white/20">
        <div className="text-6xl mb-6">
          {isMobile ? "📱" : "🃏"}
        </div>
        
        {isLoading ? (
          <div className="animate-spin w-16 h-16 border-4 border-white/30 border-t-white rounded-full mx-auto mb-6"></div>
        ) : (
          <FileText className="w-16 h-16 text-white mx-auto mb-6" />
        )}
        
        <h1 className="text-2xl font-bold text-white mb-4">
          {isLoading ? "PDF生成中" : (isMobile ? "PDF準備完了" : "PDF生成完了")}
        </h1>
        
        <p className="text-white/90 mb-6">
          {isLoading 
            ? (progress.message || "カード画像を処理しています...")
            : (isMobile 
                ? "PDFファイルがダウンロードされました。ファイルアプリで確認してください。"
                : "PDFが新しいタブで開かれました。"
              )
          }
        </p>
        
        {progress.total > 0 && (
          <div className="mb-6">
            <div className="w-full bg-white/20 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-white/80 text-sm">
              {progress.current} / {progress.total} 完了
            </p>
          </div>
        )}
        
        {!isLoading && (
          <div className="space-y-3">
            {isMobile ? (
              <div className="space-y-2">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  disabled={!pdfBlob}
                >
                  <Download className="w-5 h-5" />
                  PDFを再ダウンロード
                </button>
                <p className="text-white/70 text-xs">
                  ダウンロードフォルダまたはファイルアプリで確認してください
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleViewPDF}
                  className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  disabled={!pdfBlob}
                >
                  <FileText className="w-5 h-5" />
                  PDFを再表示
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  disabled={!pdfBlob}
                >
                  <Download className="w-4 h-4" />
                  PDFをダウンロード
                </button>
              </div>
            )}
            
            <button
              onClick={() => window.history.back()}
              className="w-full bg-transparent border border-white/30 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              元のページに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}