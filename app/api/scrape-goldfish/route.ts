import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || !url.includes("mtggoldfish.com")) {
      return NextResponse.json({ error: "Invalid MTG Goldfish URL" }, { status: 400 })
    }

    // 通常のfetchでHTMLを取得
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const html = await response.text()

    // cheerioでHTMLを解析
    const $ = cheerio.load(html)
    const imageUrls: string[] = []

    // deck-visual-playmat内のimgタグを取得（メインデッキ + サイドボード）
    $(".deck-visual-playmat img").each((_, element) => {
      const imgElement = $(element)
      const imageUrl = imgElement.attr("src")

      // cdn1.mtggoldfish.com/images で始まる画像のみを取得
      if (imageUrl && imageUrl.startsWith("https://cdn1.mtggoldfish.com/images")) {
        imageUrls.push(imageUrl)
      }
    })

    if (imageUrls.length === 0) {
      return NextResponse.json({ error: "No card data found on the page" }, { status: 404 })
    }

    // 重複するURLをカウントして枚数を計算
    const urlCounts = new Map<string, number>()
    imageUrls.forEach(url => {
      urlCounts.set(url, (urlCounts.get(url) || 0) + 1)
    })

    // { url: string, value: number }[] 形式に変換
    const cardData = Array.from(urlCounts.entries()).map(([url, count]) => ({
      url,
      value: count,
    }))

    return NextResponse.json({
      success: true,
      cards: cardData,
      count: cardData.length,
    })
  } catch (error) {
    console.error("Goldfish scraping error:", error)
    return NextResponse.json(
      { error: `Failed to scrape the page: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}