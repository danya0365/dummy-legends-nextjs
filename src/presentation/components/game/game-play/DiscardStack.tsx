"use client";

import type { DiscardStackInfo } from "@/src/domain/types/gameplay.types";
import { cn } from "@/src/utils/cn";
import { useMemo } from "react";
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

  const { overlapOffset } = useMemo(() => {
    const overlapMap: Record<typeof cardSize, number> = {
      small: 52,
      medium: 48,
      large: 34,
    };

    const offset = overlapMap[cardSize] ?? 24;

    return {
      overlapOffset: offset,
    };
  }, [cardSize]);

  const displayCards = useMemo(
    () => cards.map((entry, index) => ({ entry, index })),
    [cards]
  );

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative flex w-full flex-col items-center", // container for overlapping stack
          listClassName
        )}
      >
        {cards.length === 0 ? (
          <div className="flex h-32 w-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700">
            <p className="text-xs text-gray-400 dark:text-slate-400">ว่าง</p>
          </div>
        ) : (
          displayCards.map(({ entry, index }) => {
            const isSelected = entry.card.id === selectedCardId;
            const isDisabled =
              disableSelection || isLoading || !entry.canSelect;
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
