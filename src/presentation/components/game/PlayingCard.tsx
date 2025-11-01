"use client";

import type { GameCard } from "@/src/domain/types/gameplay.types";
import { cn } from "@/src/utils/cn";

const isShowCardId = false;

interface PlayingCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  highlight?: "glow" | "pulse" | "none";
  showStatusBadge?: boolean;
  statusLabel?: string;
  showBottomRank?: boolean;
  showCardValue?: boolean;
  showSuitBadge?: boolean;
}

const suitConfig = {
  hearts: {
    symbol: "♥",
    textClass: "text-rose-500",
    gradient: "from-rose-100 via-white to-rose-50",
    accent: "bg-rose-500",
  },
  diamonds: {
    symbol: "♦",
    textClass: "text-red-500",
    gradient: "from-red-100 via-white to-red-50",
    accent: "bg-red-500",
  },
  clubs: {
    symbol: "♣",
    textClass: "text-emerald-600",
    gradient: "from-emerald-100 via-white to-emerald-50",
    accent: "bg-emerald-500",
  },
  spades: {
    symbol: "♠",
    textClass: "text-slate-800",
    gradient: "from-slate-100 via-white to-slate-50",
    accent: "bg-slate-700",
  },
} as const;

const sizePresets = {
  small: {
    container: "w-14 h-20",
    padding: "p-1.5",
    radius: "rounded-xl",
    rank: "text-base",
    symbolCenter: "text-3xl",
    statusBadge: "text-[9px] px-2 py-0.5",
    statusDot: "h-1.5 w-1.5",
    suitBadge: "px-2 py-0.5 text-[9px]",
    valueBadge: "px-2 py-0.5 text-[9px]",
    idBadge: "px-2.5 py-0.5 text-[9px]",
    idOffset: "bottom-2",
    patternGap: "gap-1.5",
    patternIcon: "h-2 w-2 text-[7px]",
    labelPadding: "px-3 py-0.5",
    labelText: "text-[10px]",
    labelTracking: "tracking-[0.28em]",
  },
  medium: {
    container: "w-20 h-28",
    padding: "p-2",
    radius: "rounded-2xl",
    rank: "text-lg",
    symbolCenter: "text-4xl",
    statusBadge: "text-[10px] px-2.5 py-1",
    statusDot: "h-2 w-2",
    suitBadge: "px-2.5 py-1 text-[10px]",
    valueBadge: "px-2.5 py-1 text-[10px]",
    idBadge: "px-3 py-1 text-[10px]",
    idOffset: "bottom-3",
    patternGap: "gap-2",
    patternIcon: "h-3 w-3 text-[8px]",
    labelPadding: "px-4 py-1",
    labelText: "text-xs",
    labelTracking: "tracking-[0.35em]",
  },
  large: {
    container: "w-28 h-40",
    padding: "p-3",
    radius: "rounded-2xl",
    rank: "text-2xl",
    symbolCenter: "text-5xl",
    statusBadge: "text-xs px-3 py-1.5",
    statusDot: "h-2.5 w-2.5",
    suitBadge: "px-3 py-1.5 text-xs",
    valueBadge: "px-3 py-1.5 text-xs",
    idBadge: "px-3.5 py-1.5 text-xs",
    idOffset: "bottom-4",
    patternGap: "gap-3",
    patternIcon: "h-4 w-4 text-[11px]",
    labelPadding: "px-5 py-1.5",
    labelText: "text-sm",
    labelTracking: "tracking-[0.4em]",
  },
} as const satisfies Record<
  "small" | "medium" | "large",
  {
    container: string;
    padding: string;
    rank: string;
    symbolCenter: string;
    radius: string;
    statusBadge: string;
    statusDot: string;
    suitBadge: string;
    valueBadge: string;
    idBadge: string;
    idOffset: string;
    patternGap: string;
    patternIcon: string;
    labelPadding: string;
    labelText: string;
    labelTracking: string;
  }
>;

export function PlayingCard({
  card,
  onClick,
  selected = false,
  disabled = false,
  size = "medium",
  highlight = "none",
  showStatusBadge = false,
  statusLabel = "เลือกอยู่",
  showBottomRank = false,
  showCardValue = false,
  showSuitBadge = false,
}: PlayingCardProps) {
  const suit =
    suitConfig[card.suit as keyof typeof suitConfig] ?? suitConfig.spades;
  const preset = sizePresets[size];
  const interactive = typeof onClick === "function" && !disabled;

  const baseClasses = cn(
    "relative overflow-hidden border-2 bg-white/90 shadow-lg transition-all duration-200 backdrop-blur-sm",
    "flex flex-col justify-between",
    preset.container,
    preset.padding,
    preset.radius,
    suit.gradient,
    selected ? "border-indigo-400 shadow-indigo-300/60" : "border-white/60",
    interactive && "hover:-translate-y-1.5 hover:shadow-xl",
    disabled && "opacity-60 cursor-not-allowed",
    !disabled && interactive && "cursor-pointer"
  );

  const highlightClasses = cn({
    "ring-2 ring-indigo-300 ring-offset-2 ring-offset-white": selected,
    "animate-pulse-soft": highlight === "pulse" && !selected,
    "shadow-[0_0_25px_rgba(79,70,229,0.35)]": highlight === "glow" || selected,
  });

  const content = (
    <>
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.08) 0, transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.06) 0, transparent 40%)",
        }}
      />

      {showStatusBadge && selected && (
        <div className="absolute left-2 top-2 z-20">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-indigo-600/90 text-white",
              "shadow-sm",
              preset.statusBadge
            )}
          >
            <span
              className={cn(
                "inline-block rounded-full bg-white/80",
                preset.statusDot
              )}
            />
            {statusLabel}
          </span>
        </div>
      )}

      <div
        className={cn("absolute inset-0 border border-white/50", preset.radius)}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div
          className={cn(
            "font-semibold drop-shadow-sm",
            suit.textClass,
            preset.rank
          )}
        >
          {card.rank}
        </div>
        {showSuitBadge && (
          <div
            className={cn(
              "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider",
              suit.accent,
              "text-white/90",
              preset.suitBadge
            )}
          >
            {card.suit.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div
          className={cn(
            "font-black drop-shadow-sm",
            suit.textClass,
            preset.symbolCenter
          )}
        >
          {suit.symbol}
        </div>
      </div>

      {(showBottomRank || showCardValue) && (
        <div className="relative z-10 flex items-end justify-between">
          {showBottomRank && (
            <div
              className={cn(
                "font-semibold drop-shadow-sm",
                suit.textClass,
                preset.rank
              )}
            >
              {card.rank}
            </div>
          )}
          <div className="flex items-center gap-1">
            {showCardValue && (
              <div
                className={cn(
                  "rounded-full font-medium uppercase bg-black/5 text-slate-500",
                  preset.valueBadge
                )}
              >
                {card.value}
              </div>
            )}
          </div>
        </div>
      )}

      {isShowCardId && (
        <div
          className={cn(
            "absolute inset-x-0 flex justify-center",
            preset.idOffset
          )}
        >
          <span
            className={cn(
              "rounded-full font-semibold uppercase tracking-widest bg-white/70 text-slate-500 shadow-sm",
              preset.idBadge
            )}
          >
            {card.id.slice(0, 4)}
          </span>
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.0) 40%), linear-gradient(315deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 60%)",
        }}
      />
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(baseClasses, highlightClasses)}
      >
        {content}
      </button>
    );
  }

  return <div className={cn(baseClasses, highlightClasses)}>{content}</div>;
}

export function CardBack({
  size = "medium",
}: {
  size?: "small" | "medium" | "large";
}) {
  const preset = sizePresets[size];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-2 border-white/50 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500",
        "shadow-lg transition-transform duration-200 hover:-translate-y-1",
        preset.container,
        preset.radius
      )}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9) 0, transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.2) 0, transparent 40%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn("grid grid-cols-3 opacity-90", preset.patternGap)}>
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "inline-flex rotate-45 items-center justify-center rounded-sm bg-white/60 font-semibold text-indigo-600",
                preset.patternIcon
              )}
            >
              ✦
            </span>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "rounded-full border border-white/60 bg-white/30 font-semibold text-white/90 backdrop-blur-sm",
            preset.labelPadding,
            preset.labelText,
            preset.labelTracking
          )}
        >
          DL
        </span>
      </div>
    </div>
  );
}
