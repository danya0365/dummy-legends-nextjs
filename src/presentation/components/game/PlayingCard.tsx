"use client";

import type { GameCard } from "@/src/domain/types/gameplay.types";

interface PlayingCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

export function PlayingCard({
  card,
  onClick,
  selected = false,
  disabled = false,
  size = "medium",
}: PlayingCardProps) {
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case "hearts":
        return "♥";
      case "diamonds":
        return "♦";
      case "clubs":
        return "♣";
      case "spades":
        return "♠";
      default:
        return "";
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === "hearts" || suit === "diamonds" ? "text-red-600" : "text-black";
  };

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-12 h-16 text-xs";
      case "large":
        return "w-24 h-32 text-2xl";
      default:
        return "w-16 h-24 text-base";
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${getSizeClasses()}
        bg-white border-2 rounded-lg shadow-md
        flex flex-col items-center justify-between p-1
        transition-all duration-200
        ${selected ? "border-blue-500 -translate-y-2 shadow-xl" : "border-gray-300"}
        ${onClick && !disabled ? "hover:-translate-y-1 hover:shadow-lg cursor-pointer" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {/* Top corner */}
      <div className={`flex flex-col items-center ${getSuitColor(card.suit)}`}>
        <div className="font-bold">{card.rank}</div>
        <div className="text-sm">{getSuitSymbol(card.suit)}</div>
      </div>

      {/* Center suit */}
      <div className={`text-3xl ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </div>

      {/* Bottom corner (rotated) */}
      <div className={`flex flex-col items-center ${getSuitColor(card.suit)} rotate-180`}>
        <div className="font-bold">{card.rank}</div>
        <div className="text-sm">{getSuitSymbol(card.suit)}</div>
      </div>
    </button>
  );
}

// Card back component
export function CardBack({ size = "medium" }: { size?: "small" | "medium" | "large" }) {
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-12 h-16";
      case "large":
        return "w-24 h-32";
      default:
        return "w-16 h-24";
    }
  };

  return (
    <div
      className={`
        ${getSizeClasses()}
        bg-gradient-to-br from-blue-600 to-purple-700
        border-2 border-gray-300 rounded-lg shadow-md
        flex items-center justify-center
      `}
    >
      <div className="text-white text-4xl opacity-50">🎴</div>
    </div>
  );
}
