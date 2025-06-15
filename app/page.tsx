"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Eye, Loader2, FileText, QrCode } from "lucide-react";

interface ImageItem {
  id: string;
  url: string;
  value: number;
}

// PDF生成用のウィンドウ型定義
interface PDFWindow extends Window {
  updateProgress?: (current: number, total: number, message: string) => void;
}

export default function HomePage() {
  const [imageDataText, setImageDataText] = useState(`[
  { "url": "https://files.hareruyamtg.com/img/goods/L/287.jpg", "value": 3 },
  { "url": "https://files.hareruyamtg.com/img/goods/L/MM3/ja/grafdigger's_cage.jpg", "value": 3 },
  { "url": "https://files.hareruyamtg.com/img/goods/L/MH2/JP/00075.jpg", "value": 1 },
  { "url": "https://files.hareruyamtg.com/img/goods/L/MH3/JP/jp_732b1d8d8c.jpg", "value": 2 }
]`);

  const [imageItems, setImageItems] = useState<ImageItem[]>([
    {
      id: "1",
      url: "https://files.hareruyamtg.com/img/goods/L/287.jpg",
      value: 3,
    },
    {
      id: "2",
      url: "https://files.hareruyamtg.com/img/goods/L/MM3/ja/grafdigger's_cage.jpg",
      value: 3,
    },
    {
      id: "3",
      url: "https://files.hareruyamtg.com/img/goods/L/MH2/JP/00075.jpg",
      value: 1,
    },
    {
      id: "4",
      url: "https://files.hareruyamtg.com/img/goods/L/MH3/JP/jp_732b1d8d8c.jpg",
      value: 2,
    },
  ]);

  const [hareruyaUrls, setHareruyaUrls] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const openImageModal = (imageUrl: string) => {
    setModalImage(imageUrl);
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  const addNewCard = () => {
    const newId = Date.now().toString();
    setImageItems((prev) => [
      ...prev,
      {
        id: newId,
        url: "",
        value: 1,
      },
    ]);
  };

  const removeCard = (id: string) => {
    setImageItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCardUrl = (id: string, url: string) => {
    setImageItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, url } : item))
    );
  };

  const updateCardValue = (id: string, value: number) => {
    setImageItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, value: Math.max(1, value) } : item
      )
    );
  };

  const handleHareruyaUrlLoad = async () => {
    const validUrls = hareruyaUrls.filter(
      (url) => url.trim() && url.includes("hareruyamtg.com")
    );

    if (validUrls.length === 0) {
      alert("有効なHARERUYAのURLを入力してください");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("リクエスト送信中...");
    setErrorMessage("");

    try {
      const allCards: { url: string; value: number }[] = [];

      for (let i = 0; i < validUrls.length; i++) {
        const url = validUrls[i];
        setLoadingMessage(
          `${i + 1}/${validUrls.length} ページデータを取得中...`
        );

        const response = await fetch("/api/scrape-hareruya", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(
              errorData.error ||
                `エラー: ${response.status} ${response.statusText}`
            );
          } catch {
            throw new Error(`サーバーエラー: ${errorText.slice(0, 100)}...`);
          }
        }

        const data = await response.json();

        if (data.success && data.cards.length > 0) {
          allCards.push(...data.cards);
        }
      }

      if (allCards.length > 0) {
        const jsonData = JSON.stringify(allCards, null, 2);
        setImageDataText(jsonData);

        const newImageItems: ImageItem[] = allCards.map(
          (card: { url: string; value: number }, index: number) => ({
            id: `hareruya-${Date.now()}-${index}`,
            url: card.url,
            value: card.value,
          })
        );
        setImageItems(newImageItems);

        alert(
          `${validUrls.length}個のURLから合計${allCards.length}枚のカードを読み込みました`
        );
      } else {
        setErrorMessage("カード情報を取得できませんでした");
      }
    } catch (error) {
      console.error("Error fetching deck data:", error);
      setErrorMessage(
        `${error instanceof Error ? error.message : "不明なエラー"}`
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleGeneratePDF = async () => {
    console.log("PDF生成開始");
    
    const printData = imageItems
      .filter((item) => item.url.trim() !== "")
      .map((item) => ({
        url: item.url,
        value: item.value,
      }));

    console.log("印刷データ:", printData);

    if (printData.length === 0) {
      alert("PDFに出力するカードがありません");
      return;
    }

    /* ① クリック直後に空ウィンドウを確保 */
    const pdfWindow = window.open("", "_blank") as PDFWindow | null;
    if (!pdfWindow) {
      alert(
        "ポップアップがブロックされています。ブラウザの設定でポップアップを許可してください。"
      );
      return;
    }

    console.log("ウィンドウ作成成功");

    // ② 新しいウィンドウにロード画面を表示
    pdfWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF生成中...</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          
          .loading-container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 90%;
          }
          
          .spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .card-icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
          
          .loading-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          
          .loading-message {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 30px;
          }
          
          .progress-container {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 15px;
          }
          
          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
            border-radius: 4px;
            transition: width 0.3s ease;
            width: 0%;
          }
          
          .progress-text {
            font-size: 14px;
            opacity: 0.8;
          }
          
          .dots {
            display: inline-block;
          }
          
          .dots::after {
            content: '';
            animation: dots 1.5s infinite;
          }
          
          @keyframes dots {
            0%, 20% { content: ''; }
            40% { content: '.'; }
            60% { content: '..'; }
            80%, 100% { content: '...'; }
          }
        </style>
      </head>
      <body>
        <div class="loading-container">
          <div class="card-icon">🃏</div>
          <div class="spinner"></div>
          <h1 class="loading-title">PDF生成中</h1>
          <p class="loading-message">カード画像を処理しています<span class="dots"></span></p>
          <div class="progress-container">
            <div class="progress-bar" id="progressBar"></div>
          </div>
          <p class="progress-text" id="progressText">準備中...</p>
        </div>
        
        <script>
          // プログレス更新用の関数をグローバルに定義
          window.updateProgress = function(current, total, message) {
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            const loadingMessage = document.querySelector('.loading-message');
            
            if (progressBar && progressText) {
              const percentage = total > 0 ? (current / total) * 100 : 0;
              progressBar.style.width = percentage + '%';
              progressText.textContent = current + ' / ' + total + ' 完了';
              
              if (message) {
                loadingMessage.innerHTML = message + '<span class="dots"></span>';
              }
            }
          };
        </script>
      </body>
      </html>
    `);
    pdfWindow.document.close();

    console.log("ローディング画面表示完了");

    try {
      // jsPDFを動的に読み込み
      const jsPDFModule = await import("jspdf");
      const PDF = jsPDFModule.default;
      
      /* ③ ここから先は非同期で画像読込 & PDF 生成 */
      // プリントページと同じロジックでカードを展開
      const expandedCards: string[] = [];
      printData.forEach((card) => {
        for (let i = 0; i < card.value; i++) {
          expandedCards.push(card.url);
        }
      });

      console.log("展開されたカード数:", expandedCards.length);

      // 初期プログレス表示
      if (pdfWindow && !pdfWindow.closed && pdfWindow.updateProgress) {
        pdfWindow.updateProgress(0, expandedCards.length, "画像の読み込みを開始しています");
      }

      // カードを3列に配置するための配列を作成（プリントページと同じロジック）
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

      // PDF設定 - A4サイズ
      const pdf = new PDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // カードサイズ設定 - 正確に63mm x 88mm
      const cardWidth = 63; // mm
      const cardHeight = 88; // mm

      // A4サイズ（210mm幅）で3列に配置する際の正確な計算
      const a4Width = 210; // mm
      const a4Height = 297; // mm
      const totalCardWidth = 3 * cardWidth; // 189mm
      const remainingWidth = a4Width - totalCardWidth; // 21mm

      const marginX = 5; // mm (左右余白を小さく)
      const spacingX = (remainingWidth - 2 * marginX) / 2; // カード間のスペース = 5.5mm

      // 高さの計算 - A4に収まるように調整
      const totalCardHeight = 3 * cardHeight; // 264mm (3行)
      const remainingHeight = a4Height - totalCardHeight; // 33mm
      const marginY = 10; // mm (上下余白)
      const spacingY = (remainingHeight - 2 * marginY) / 2; // 行間スペース = 6.5mm

      let currentPageRowCount = 0;
      const maxRowsPerPage = 3; // A4に3行まで

      // 画像をロードしてBase64に変換する関数
      const loadImageAsBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          console.log("画像読み込み開始:", url);
          const img = new Image();

          img.onload = () => {
            console.log("画像読み込み成功:", url);
            try {
              const canvas = document.createElement("canvas");
              // 63mm x 88mmの比率を保持して高解像度化
              const dpi = 300; // 高品質印刷用DPI
              canvas.width = Math.round((cardWidth / 25.4) * dpi); // mmをpxに変換
              canvas.height = Math.round((cardHeight / 25.4) * dpi);
              const ctx = canvas.getContext("2d");

              if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataURL = canvas.toDataURL("image/JPEG", 0.95);
                console.log("Base64変換成功");
                resolve(dataURL);
              } else {
                console.error("Canvas context取得失敗");
                reject(new Error("Canvas context not available"));
              }
            } catch (error) {
              console.error("Canvas処理エラー:", error);
              reject(error);
            }
          };

          img.onerror = () => {
            console.error("画像読み込み失敗:", url);
            reject(new Error(`Failed to load image: ${url}`));
          };

          // プロキシAPIを使用して画像を取得
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
          console.log("プロキシURL:", proxyUrl);
          img.src = proxyUrl;
          
          // CORS設定を追加
          img.crossOrigin = "anonymous";
        });
      };

      let processedImages = 0;
      const totalImages = expandedCards.length;

      console.log("PDF生成開始 - 総画像数:", totalImages);

      for (let rowIndex = 0; rowIndex < cardRows.length; rowIndex++) {
        const row = cardRows[rowIndex];

        // ページ送りの判定
        if (currentPageRowCount >= maxRowsPerPage) {
          pdf.addPage();
          currentPageRowCount = 0;
        }

        // 行のY座標を計算
        const rowY = marginY + currentPageRowCount * (cardHeight + spacingY);

        // 各カードを配置
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const cardUrl = row[colIndex];
          const colX = marginX + colIndex * (cardWidth + spacingX);

          // プログレス更新
          if (pdfWindow && !pdfWindow.closed && pdfWindow.updateProgress) {
            pdfWindow.updateProgress(processedImages, totalImages, `画像を処理中 (${processedImages + 1}/${totalImages})`);
          }
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
            console.log(`画像追加成功: ${processedImages + 1}/${totalImages}`);
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

      console.log("PDF生成完了");

      // PDF生成完了のプログレス表示
      if (pdfWindow && !pdfWindow.closed && pdfWindow.updateProgress) {
        pdfWindow.updateProgress(totalImages, totalImages, "PDFを生成中...");
      }

      /* ④ 完成後に空ウィンドウへ PDF を流し込む */
      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      console.log("PDF URL生成完了:", pdfUrl);

      // 空ウィンドウにPDFを流し込む
      pdfWindow.location.href = pdfUrl;
      
      console.log("PDF表示完了");
    } catch (error) {
      console.error("PDF generation error:", error);
      alert(`PDFの生成に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`);

      // エラーが発生した場合は空ウィンドウを閉じる
      if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.close();
      }
    }
  };

  const handleGenerateQRCode = async () => {
    const printData = imageItems
      .filter((item) => item.url.trim() !== "")
      .map((item) => ({
        url: item.url,
        value: item.value,
      }));

    if (printData.length === 0) {
      alert("QRコードに含めるカードがありません");
      return;
    }

    setIsGeneratingQr(true);

    try {
      // PDF URLを生成
      const response = await fetch("/api/generate-pdf-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardData: printData }),
      });

      if (!response.ok) {
        throw new Error("PDF URLの生成に失敗しました");
      }

      const data = await response.json();
      
      // QRCodeを動的に読み込み
      const QRCodeModule = await import("qrcode");
      const QR = QRCodeModule.default;
      
      // QRコードを生成
      const qrCodeDataUrl = await QR.toDataURL(data.pdfUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrCodeUrl(qrCodeDataUrl);
      setShowQrModal(true);
    } catch (error) {
      console.error("QR code generation error:", error);
      alert(`QRコードの生成に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const closeQrModal = () => {
    setShowQrModal(false);
    setQrCodeUrl(null);
  };

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeImageModal();
        closeQrModal();
      }
    };

    if (modalImage || showQrModal) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [modalImage, showQrModal]);

  return (
    <div className="min-h-screen bg-gray-100 pt-0">
      <Header 
        onPdfGenerate={handleGeneratePDF}
        isPdfDisabled={imageItems.filter((item) => item.url.trim() !== "").length === 0}
      />
      <div className="p-3 sm:p-4 md:p-8 pt-4 sm:pt-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>データ入力</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hareruya" className="w-full space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger value="hareruya" className="text-xs sm:text-sm px-1 sm:px-3">
                  <span className="hidden sm:inline">HARERUYA URL読み込み</span>
                  <span className="sm:hidden">HARERUYA</span>
                </TabsTrigger>
                <TabsTrigger value="json" className="text-xs sm:text-sm px-1 sm:px-3">
                  <span className="hidden sm:inline">JSONデータ入力</span>
                  <span className="sm:hidden">JSON</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="hareruya" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    HARERUYA URL
                  </label>
                  <div className="space-y-3">
                    {hareruyaUrls.map((url, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                      >
                        <Input
                          type="url"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...hareruyaUrls];
                            newUrls[index] = e.target.value;
                            setHareruyaUrls(newUrls);
                          }}
                          placeholder="https://www.hareruyamtg.com/ja/deck/1013519/show/"
                          className="flex-1 w-full text-sm"
                          disabled={isLoading}
                        />
                        <div className="flex gap-2 justify-center sm:justify-start flex-shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setHareruyaUrls((prev) => [...prev, ""]);
                            }}
                            disabled={isLoading}
                            className="h-9 w-9"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          {hareruyaUrls.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setHareruyaUrls((prev) =>
                                  prev.filter((_, i) => i !== index)
                                );
                              }}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-700 h-9 w-9"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-2">使用例:</p>
                  <p className="text-xs break-all font-mono bg-white px-2 py-1 rounded border">
                    https://www.hareruyamtg.com/ja/deck/1013519/show/
                  </p>
                  <p className="text-xs">
                    HARERUYAのデッキリストページURLを入力してください
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    ※ データ取得には数秒かかる場合があります
                  </p>
                </div>

                {isLoading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          データ取得中
                        </p>
                        <p className="text-xs text-blue-600">{loadingMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-800">
                      エラーが発生しました
                    </p>
                    <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                  </div>
                )}

                <Button
                  onClick={handleHareruyaUrlLoad}
                  className="w-full"
                  size="lg"
                  disabled={hareruyaUrls.every((url) => !url.trim()) || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      データ取得中...
                    </>
                  ) : (
                    "URLから読み込み"
                  )}
                </Button>
              </TabsContent>
              
              <TabsContent value="json" className="space-y-4">
                <div>
                  <label
                    htmlFor="imageData"
                    className="block text-sm font-medium text-gray-700 mb-3"
                  >
                    画像データ（JSON形式）
                  </label>
                  <textarea
                    id="imageData"
                    value={imageDataText}
                    onChange={(e) => setImageDataText(e.target.value)}
                    className="w-full h-40 sm:h-48 md:h-64 p-3 border border-gray-300 rounded-md font-mono text-xs sm:text-sm resize-none"
                    placeholder="画像データをJSON形式で入力してください"
                  />
                </div>

                <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-2">入力形式例:</p>
                  <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                    {`[
  { "url": "画像URL", "value": 表示回数 },
  { "url": "画像URL", "value": 表示回数 }
]`}
                  </pre>
                </div>

                <Button
                  onClick={() => {
                    try {
                      // JSONの妥当性をチェック
                      JSON.parse(imageDataText);

                      // データから直接PDF生成
                      const printData = JSON.parse(imageDataText);
                      const newImageItems: ImageItem[] = printData.map(
                        (card: { url: string; value: number }, index: number) => ({
                          id: `json-${Date.now()}-${index}`,
                          url: card.url,
                          value: card.value,
                        })
                      );
                      setImageItems(newImageItems);
                      handleGeneratePDF();
                    } catch {
                      alert(
                        "JSONの形式が正しくありません。正しい形式で入力してください。"
                      );
                    }
                  }}
                  className="w-full"
                  size="lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDFで表示
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-6 h-6" />
              カードプレビュー・編集
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {imageItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-3 sm:p-4 bg-white">
                  <div className="flex flex-col lg:flex-row items-start gap-3 sm:gap-4">
                    {/* プレビュー画像 */}
                    <div className="w-full sm:w-40 lg:w-32 h-32 sm:h-44 border rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 mx-auto lg:mx-0">
                      {item.url ? (
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt={`Card ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openImageModal(item.url)}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "/placeholder.svg?height=176&width=128&text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* 編集フィールド */}
                    <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                      <div>
                        <Label htmlFor={`url-${item.id}`}>画像URL</Label>
                        <Input
                          id={`url-${item.id}`}
                          type="url"
                          value={item.url}
                          onChange={(e) =>
                            updateCardUrl(item.id, e.target.value)
                          }
                          placeholder="https://example.com/image.jpg"
                          className="mt-1 w-full text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`value-${item.id}`}>表示回数</Label>
                        <div className="flex items-center gap-2 mt-1 justify-center lg:justify-start">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() =>
                              updateCardValue(item.id, item.value - 1)
                            }
                            disabled={item.value <= 1}
                          >
                            -
                          </Button>
                          <Input
                            id={`value-${item.id}`}
                            type="number"
                            min="1"
                            value={item.value}
                            onChange={(e) =>
                              updateCardValue(
                                item.id,
                                Number.parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 text-center text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() =>
                              updateCardValue(item.id, item.value + 1)
                            }
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 削除ボタン */}
                    <div className="flex justify-center lg:justify-start w-full lg:w-auto">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeCard(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* カード追加ボタン */}
              <Button
                onClick={addNewCard}
                variant="outline"
                className="w-full border-dashed border-2 h-12 sm:h-16 text-gray-600 hover:text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
              >
                <Plus className="w-5 h-5 mr-2" />
                新しいカードを追加
              </Button>
            </div>

            {/* UI管理からのPDFボタン */}
            <div className="text-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t space-y-3 sm:space-y-4">
              <Button
                onClick={handleGeneratePDF}
                size="lg"
                className="px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto"
                disabled={
                  imageItems.filter((item) => item.url.trim() !== "").length ===
                  0
                }
              >
                <FileText className="w-4 h-4 mr-2" />
                PDFで表示
              </Button>
              <Button
                onClick={handleGenerateQRCode}
                size="lg"
                variant="outline"
                className="px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50"
                disabled={
                  imageItems.filter((item) => item.url.trim() !== "").length === 0 || isGeneratingQr
                }
              >
                {isGeneratingQr ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    QRコード生成中...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    QRコード作成
                  </>
                )}
              </Button>
              {imageItems.filter((item) => item.url.trim() !== "").length ===
                0 && (
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  少なくとも1つのカードにURLを設定してください
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      {/* 画像モーダル */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-opacity-75 transition-colors z-10 text-lg sm:text-xl"
            >
              ×
            </button>
            <img
              src={modalImage || "/placeholder.svg"}
              alt="拡大表示"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "/placeholder.svg?height=400&width=300&text=画像が見つかりません";
              }}
            />
          </div>
        </div>
      )}
      
      {/* QRコードモーダル */}
      {showQrModal && qrCodeUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeQrModal}
        >
          <div
            className="relative bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeQrModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ×
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📱 QRコード
              </h3>
              
              <div className="mb-4">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="mx-auto border rounded-lg"
                />
              </div>
              
              <div className="text-sm text-gray-600 mb-4 space-y-2">
                <p className="font-medium">📱 スマートフォンでの使用方法:</p>
                <ol className="text-left space-y-1 text-xs">
                  <li>1. カメラアプリでQRコードを読み取り</li>
                  <li>2. 表示されたリンクをタップ</li>
                  <li>3. PDFが自動でダウンロードされます</li>
                  <li>4. ファイルアプリで確認してください</li>
                </ol>
                <p className="text-xs text-orange-600 mt-2">
                  ※ QRコードは7日間有効です
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.download = "mtg-proxy-qr.png";
                    link.href = qrCodeUrl;
                    link.click();
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  QRコード保存
                </Button>
                <Button
                  onClick={closeQrModal}
                  size="sm"
                  className="flex-1"
                >
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}