"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Card {
  url: string;
  value: number;
}

export default function PrintPage() {
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const data = searchParams.get("data");
    if (data) {
      try {
        const decodedData = decodeURIComponent(data);
        const parsedCards = JSON.parse(decodedData);
        setCards(parsedCards);
      } catch (error) {
        console.error("Error parsing card data:", error);
      }
    }
  }, [searchParams]);

  if (!isClient) {
    return null;
  }

  // カードを3列に配置するための配列を作成
  const cardRows: Card[][] = [];
  let currentRow: Card[] = [];
  let cardCount = 0;

  cards.forEach((card) => {
    for (let i = 0; i < card.value; i++) {
      currentRow.push(card);
      cardCount++;
      if (cardCount % 3 === 0) {
        cardRows.push([...currentRow]);
        currentRow = [];
      }
    }
  });

  if (currentRow.length > 0) {
    cardRows.push(currentRow);
  }

  return (
    <div className="p-4">
      <table className="w-full border-collapse">
        <tbody>
          {cardRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((card, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`} className="w-[230px] p-2">
                  <div className="relative">
                    <Image
                      src={card.url}
                      alt={`Card ${rowIndex * 3 + colIndex + 1}`}
                      width={230}
                      height={320}
                      className="w-full h-auto"
                      priority
                    />
                    <input
                      type="text"
                      value={card.url}
                      className="absolute left-2 -top-8 opacity-0 hover:opacity-100 transition-opacity"
                      readOnly
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
