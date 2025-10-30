"use client";

import type { Card } from "@/src/domain/types/game.types";
import { PlayingCard } from "./PlayingCard";
import { cn } from "@/src/utils/cn";

interface PlayerHandProps {
  cards: Card[];
  selectedCards: Card[];
  onCardClick?: (card: Card) => void;
  isMyTurn?: boolean;
  className?: string;
}

/**
 * Player Hand Component
 * Displays all cards in player's hand with selection support
 */
export function PlayerHand({
  cards,
  selectedCards,
  onCardClick,
  isMyTurn = false,
  className,
}: PlayerHandProps) {
  const selectedCardIds = new Set(selectedCards.map((c) => c.id));

  return (
    <div className={cn("relative", className)}>
      {/* Label */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          มือของคุณ ({cards.length} ใบ)
        </h3>
        {isMyTurn && (
          <span className="flex items-center gap-2 text-xs font-medium text-green-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            เทิร์นของคุณ
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="relative flex gap-1 overflow-x-auto pb-4">
        {cards.length === 0 ? (
          <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <p className="text-sm text-gray-500">ไม่มีไพ่บนมือ</p>
          </div>
        ) : (
          cards.map((card, index) => (
            <div
              key={card.id}
              className="relative"
              style={{
                zIndex: cards.length - index,
              }}
            >
              <PlayingCard
                card={card}
                isSelected={selectedCardIds.has(card.id)}
                isDisabled={!isMyTurn}
                onClick={() => onCardClick?.(card)}
                size="md"
              />
            </div>
          ))
        )}
      </div>

      {/* Selection info */}
      {selectedCards.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          เลือกไว้ {selectedCards.length} ใบ
        </div>
      )}
    </div>
  );
}
