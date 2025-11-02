"use client";

import { useMemo } from "react";
import type { DiscardStackInfo } from "@/src/domain/types/gameplay.types";
import { cn } from "@/src/utils/cn";
import { PlayingCard } from "../PlayingCard";

interface DiscardStackProps {
  stack: DiscardStackInfo | null;
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  onDrawFromDiscard?: () => void;
  drawButtonLabel?: string;
  drawButtonDisabled?: boolean;
  disableSelection?: boolean;
  isLoading?: boolean;
  cardSize?: "small" | "medium" | "large";
  className?: string;
  listClassName?: string;
}

export function DiscardStack({
  stack,
  selectedCardId,
  onSelectCard,
  onDrawFromDiscard,
  drawButtonLabel,
  drawButtonDisabled,
  disableSelection = false,
  isLoading = false,
  cardSize = "medium",
  className,
  listClassName,
}: DiscardStackProps) {
  const cards = useMemo(() => stack?.entries ?? [], [stack?.entries]);

  const { overlapOffset, containerPadding } = useMemo(() => {
    const overlapMap: Record<typeof cardSize, number> = {
      small: 18,
      medium: 26,
      large: 34,
    };

    const offset = overlapMap[cardSize] ?? 24;
    const padding = cards.length > 0 ? (cards.length - 1) * offset : 0;

    return {
      overlapOffset: offset,
      containerPadding: padding,
    };
  }, [cardSize, cards.length]);

  const displayCards = useMemo(() => cards.map((entry, index) => ({ entry, index })), [cards]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative flex w-full flex-col items-center", // container for overlapping stack
          listClassName
        )}
        style={{ paddingTop: containerPadding }}
      >
        {cards.length === 0 ? (
          <div className="flex h-32 w-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700">
            <p className="text-xs text-gray-400 dark:text-slate-400">ว่าง</p>
          </div>
        ) : (
          displayCards.map(({ entry, index }) => {
            const isSelected = entry.card.id === selectedCardId;
            const isDisabled = disableSelection || isLoading || !entry.canSelect;
            const handleClick = () => {
              if (isDisabled) return;
              onSelectCard(entry.card.id);
            };

            const marginTop = index === 0 ? 0 : -overlapOffset;

            return (
              <div
                key={entry.card.id}
                className="relative"
                style={{
                  zIndex: index + 1,
                  marginTop,
                }}
              >
                <PlayingCard
                  card={entry.card}
                  size={cardSize}
                  onClick={handleClick}
                  disabled={isDisabled}
                  selected={isSelected}
                  highlight={isSelected ? "glow" : "none"}
                  showStatusBadge={isSelected}
                  statusLabel="เลือกอยู่"
                />
              </div>
            );
          })
        )}
      </div>

      {onDrawFromDiscard && drawButtonLabel && (
        <button
          type="button"
          onClick={onDrawFromDiscard}
          disabled={drawButtonDisabled}
          className="flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {drawButtonLabel}
        </button>
      )}
    </div>
  );
}
