"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Eye, Loader2 } from "lucide-react";

interface ImageItem {
  id: string;
  url: string;
  value: number;
}

export default function HomePage() {
  const router = useRouter();
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

  const openImageModal = (imageUrl: string) => {
    setModalImage(imageUrl);
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  const handlePrint = () => {
    try {
      // JSONの妥当性をチェック
      // const parsedData = JSON.parse(imageDataText);

      // データをURLパラメータとして渡す
      const encodedData = encodeURIComponent(imageDataText);
      router.push(`/print?data=${encodedData}`);
    } catch {
      alert("JSONの形式が正しくありません。正しい形式で入力してください。");
    }
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

  const handlePrintFromUI = () => {
    const printData = imageItems
      .filter((item) => item.url.trim() !== "")
      .map((item) => ({
        url: item.url,
        value: item.value,
      }));

    const encodedData = encodeURIComponent(JSON.stringify(printData));
    router.push(`/print?data=${encodedData}`);
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

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeImageModal();
      }
    };

    if (modalImage) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [modalImage]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>画像データ入力</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="imageData"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                画像データ（JSON形式）
              </label>
              <textarea
                id="imageData"
                value={imageDataText}
                onChange={(e) => setImageDataText(e.target.value)}
                className="w-full h-48 md:h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="画像データをJSON形式で入力してください"
              />
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">入力形式例:</p>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                {`[
  { "url": "画像URL", "value": 表示回数 },
  { "url": "画像URL", "value": 表示回数 }
]`}
              </pre>
            </div>

            <Button onClick={handlePrint} className="w-full" size="lg">
              プリントページへ移動
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>HARERUYAのURL読み込み</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HARERUYAURL
              </label>
              <div className="space-y-2">
                {hareruyaUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
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
                      className="flex-1 w-full"
                      disabled={isLoading}
                    />
                    <div className="flex gap-2 justify-center sm:justify-start">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setHareruyaUrls((prev) => [...prev, ""]);
                        }}
                        disabled={isLoading}
                        className="flex-shrink-0"
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
                          className="text-red-600 hover:text-red-700 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">使用例:</p>
              <p className="text-xs break-all">
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
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-6 h-6" />
              カードプレビュー・編集
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {imageItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    {/* プレビュー画像 */}
                    <div className="w-full md:w-32 h-44 border rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
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
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* 編集フィールド */}
                    <div className="flex-1 space-y-4 w-full">
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
                          className="mt-1 w-full"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`value-${item.id}`}>表示回数</Label>
                        <div className="flex items-center gap-2 mt-1 justify-center md:justify-start">
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
                            className="w-16 text-center"
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
                    <div className="flex justify-center md:justify-start">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeCard(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
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
                className="w-full border-dashed border-2 h-16 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-5 h-5 mr-2" />
                新しいカードを追加
              </Button>
            </div>

            {/* UI管理からのプリントボタン */}
            <div className="text-center mt-6 pt-6 border-t">
              <Button
                onClick={handlePrintFromUI}
                size="lg"
                className="px-8 py-3"
                disabled={
                  imageItems.filter((item) => item.url.trim() !== "").length ===
                  0
                }
              >
                プリントページへ
              </Button>
              {imageItems.filter((item) => item.url.trim() !== "").length ===
                0 && (
                <p className="text-sm text-gray-500 mt-2">
                  少なくとも1つのカードにURLを設定してください
                </p>
              )}
            </div>
          </CardContent>
        </Card>
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
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-colors z-10"
            >
              ×
            </button>
            <img
              src={modalImage || "/placeholder.svg"}
              alt="拡大表示"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "/placeholder.svg?height=400&width=300&text=画像が見つかりません";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
