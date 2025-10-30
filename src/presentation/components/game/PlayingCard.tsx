"use client";

import type { Card } from "@/src/domain/types/game.types";
import { getCardColor } from "@/src/utils/cardUtils";
import { cn } from "@/src/utils/cn";

interface PlayingCardProps {
  card: Card;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Playing Card Component
 * Displays a single playing card with suit and rank
 */
export function PlayingCard({
  card,
  isSelected = false,
  isDisabled = false,
  onClick,
  className,
  size = "md",
}: PlayingCardProps) {
  const color = getCardColor(card);

  const sizeClasses = {
    sm: "w-12 h-16 text-xs",
    md: "w-16 h-24 text-sm",
    lg: "w-20 h-32 text-base",
  };

  const suitSymbols: Record<Card["suit"], string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "relative rounded-lg border-2 bg-white transition-all duration-200",
        "flex flex-col items-center justify-between p-2",
        "shadow-md hover:shadow-lg",
        sizeClasses[size],
        // Selected state
        isSelected && "ring-4 ring-blue-500 ring-offset-2 -translate-y-2",
        // Hover state
        !isDisabled && "hover:-translate-y-1 cursor-pointer",
        // Disabled state
        isDisabled && "opacity-50 cursor-not-allowed",
        // Color
        color === "red" ? "text-red-600" : "text-gray-900",
        className
      )}
    >
      {/* Top rank */}
      <div className="flex flex-col items-center">
        <span className="font-bold leading-none">{card.rank}</span>
        <span className="text-lg leading-none">{suitSymbols[card.suit]}</span>
      </div>

      {/* Center suit symbol */}
      <div className="text-3xl font-bold opacity-20">
        {suitSymbols[card.suit]}
      </div>

      {/* Bottom rank (rotated) */}
      <div className="flex flex-col items-center rotate-180">
        <span className="font-bold leading-none">{card.rank}</span>
        <span className="text-lg leading-none">{suitSymbols[card.suit]}</span>
      </div>
    </button>
  );
}

/**
 * Card Back Component
 * Displays the back of a card
 */
export function CardBack({
  onClick,
  className,
  size = "md",
}: {
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-12 h-16",
    md: "w-16 h-24",
    lg: "w-20 h-32",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-lg border-2 border-gray-700 transition-all duration-200",
        "bg-gradient-to-br from-blue-600 to-blue-800",
        "shadow-md hover:shadow-lg",
        sizeClasses[size],
        onClick && "hover:-translate-y-1 cursor-pointer",
        className
      )}
    >
      {/* Pattern */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3/4 h-3/4 rounded-lg border-4 border-white/30" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1/2 h-1/2 rounded-lg border-2 border-white/20" />
      </div>
    </button>
  );
}
