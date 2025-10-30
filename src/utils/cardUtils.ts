/**
 * Card Utilities for Dummy Card Game
 * Handles card generation, shuffling, and validation
 */

import type { Card, CardSuit, CardRank } from "@/src/domain/types/game.types";

/**
 * All possible card ranks
 */
export const CARD_RANKS: CardRank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

/**
 * All possible card suits
 */
export const CARD_SUITS: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];

/**
 * Card rank values for scoring
 */
export const RANK_VALUES: Record<CardRank, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 10,
  Q: 10,
  K: 10,
};

/**
 * Generate a full deck of 52 cards
 */
export function generateDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of CARD_SUITS) {
    for (const rank of CARD_RANKS) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`,
      });
    }
  }

  return deck;
}

/**
 * Shuffle a deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Deal cards to players
 * @param deck The deck to deal from
 * @param playerCount Number of players
 * @param cardsPerPlayer Number of cards each player gets (default: 13)
 * @returns Object with player hands and remaining deck
 */
export function dealCards(
  deck: Card[],
  playerCount: number,
  cardsPerPlayer: number = 13
): {
  playerHands: Card[][];
  remainingDeck: Card[];
} {
  const shuffled = shuffleDeck(deck);
  const playerHands: Card[][] = Array.from({ length: playerCount }, () => []);

  let cardIndex = 0;

  // Deal cards round-robin
  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let player = 0; player < playerCount; player++) {
      if (cardIndex < shuffled.length) {
        playerHands[player].push(shuffled[cardIndex]);
        cardIndex++;
      }
    }
  }

  const remainingDeck = shuffled.slice(cardIndex);

  return {
    playerHands,
    remainingDeck,
  };
}

/**
 * Sort cards by rank and suit
 */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    // First sort by suit
    const suitOrder = CARD_SUITS.indexOf(a.suit) - CARD_SUITS.indexOf(b.suit);
    if (suitOrder !== 0) return suitOrder;

    // Then sort by rank
    return CARD_RANKS.indexOf(a.rank) - CARD_RANKS.indexOf(b.rank);
  });
}

/**
 * Calculate total value of cards
 */
export function calculateCardValue(cards: Card[]): number {
  return cards.reduce((total, card) => total + RANK_VALUES[card.rank], 0);
}

/**
 * Check if cards form a valid set (same rank)
 */
export function isValidSet(cards: Card[]): boolean {
  if (cards.length < 3) return false;

  const firstRank = cards[0].rank;
  return cards.every((card) => card.rank === firstRank);
}

/**
 * Check if cards form a valid run (consecutive ranks, same suit)
 */
export function isValidRun(cards: Card[]): boolean {
  if (cards.length < 3) return false;

  const sorted = sortCards(cards);
  const firstSuit = sorted[0].suit;

  // Check if all cards are same suit
  if (!sorted.every((card) => card.suit === firstSuit)) {
    return false;
  }

  // Check if ranks are consecutive
  for (let i = 1; i < sorted.length; i++) {
    const prevRankIndex = CARD_RANKS.indexOf(sorted[i - 1].rank);
    const currRankIndex = CARD_RANKS.indexOf(sorted[i].rank);

    if (currRankIndex !== prevRankIndex + 1) {
      return false;
    }
  }

  return true;
}

/**
 * Check if cards form a valid meld (set or run)
 */
export function isValidMeld(cards: Card[]): boolean {
  return isValidSet(cards) || isValidRun(cards);
}

/**
 * Get card display name
 */
export function getCardDisplayName(card: Card): string {
  const suitSymbols: Record<CardSuit, string> = {
    hearts: "♥️",
    diamonds: "♦️",
    clubs: "♣️",
    spades: "♠️",
  };

  return `${card.rank}${suitSymbols[card.suit]}`;
}

/**
 * Get card color
 */
export function getCardColor(card: Card): "red" | "black" {
  return card.suit === "hearts" || card.suit === "diamonds" ? "red" : "black";
}

/**
 * Find all possible melds in a hand
 */
export function findPossibleMelds(cards: Card[]): Card[][] {
  const possibleMelds: Card[][] = [];

  // Check for sets (3 or 4 of same rank)
  const rankGroups: Record<string, Card[]> = {};
  for (const card of cards) {
    if (!rankGroups[card.rank]) {
      rankGroups[card.rank] = [];
    }
    rankGroups[card.rank].push(card);
  }

  for (const cards of Object.values(rankGroups)) {
    if (cards.length >= 3) {
      possibleMelds.push(cards);
    }
  }

  // Check for runs (3+ consecutive same suit)
  const suitGroups: Record<CardSuit, Card[]> = {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: [],
  };

  for (const card of cards) {
    suitGroups[card.suit].push(card);
  }

  for (const suitCards of Object.values(suitGroups)) {
    const sorted = sortCards(suitCards);

    for (let i = 0; i < sorted.length - 2; i++) {
      const run: Card[] = [sorted[i]];

      for (let j = i + 1; j < sorted.length; j++) {
        const prevRankIndex = CARD_RANKS.indexOf(run[run.length - 1].rank);
        const currRankIndex = CARD_RANKS.indexOf(sorted[j].rank);

        if (currRankIndex === prevRankIndex + 1) {
          run.push(sorted[j]);
        } else {
          break;
        }
      }

      if (run.length >= 3) {
        possibleMelds.push(run);
      }
    }
  }

  return possibleMelds;
}

/**
 * Calculate deadwood (unmelded cards value)
 */
export function calculateDeadwood(hand: Card[], melds: Card[][]): number {
  const meldedCardIds = new Set(
    melds.flat().map((card) => card.id)
  );

  const deadwoodCards = hand.filter((card) => !meldedCardIds.has(card.id));

  return calculateCardValue(deadwoodCards);
}
