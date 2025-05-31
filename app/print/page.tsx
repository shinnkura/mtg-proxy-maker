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

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <div key={index} className="relative">
            {Array.from({ length: card.value }).map((_, i) => (
              <Image
                width={100}
                height={100}
                key={i}
                src={card.url}
                alt={`Card ${index + 1}`}
                className="w-full h-auto"
                priority
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
