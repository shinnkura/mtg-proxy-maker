import { type NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes("hareruyamtg.com")) {
      return NextResponse.json(
        { error: "Invalid HARERUYA URL" },
        { status: 400 }
      );
    }

    // 通常のfetchでHTMLを取得
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch page: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const html = await response.text();

    // cheerioでHTMLを解析
    const $ = cheerio.load(html);
    const cardData: { url: string; value: number }[] = [];

    // カード情報を抽出
    $(".mo_visualize .vOuter").each((_, element) => {
      const imgElement = $(element).find("img");
      const numberElement = $(element).find(".Number_of_sheets p");

      if (imgElement.length && numberElement.length) {
        const imageUrl =
          imgElement.attr("data-original") || imgElement.attr("src") || "";
        const cardCount = Number.parseInt(numberElement.text() || "1", 10);

        if (imageUrl && imageUrl.startsWith("https://files.hareruyamtg.com")) {
          cardData.push({
            url: imageUrl,
            value: cardCount,
          });
        }
      }
    });

    if (cardData.length === 0) {
      return NextResponse.json(
        { error: "No card data found on the page" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cards: cardData,
      count: cardData.length,
    });
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      {
        error: `Failed to scrape the page: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  );
}
