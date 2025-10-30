"use client";

import { useGameStore } from "@/src/stores/gameStore";
import { PlayerHand } from "./PlayerHand";
import { CardBack } from "./PlayingCard";
import { PlayingCard } from "./PlayingCard";
import { useState } from "react";
import { isValidMeld, calculateDeadwood } from "@/src/utils/cardUtils";
import type { Card } from "@/src/domain/types/game.types";

/**
 * Game Board Component
 * Main gameplay interface
 */
export function GameBoard() {
  const {
    currentRoom,
    gamePlayState,
    myHand,
    selectedCards,
    isLoading,
    error,
    selectCard,
    deselectCard,
    clearSelection,
    drawCard,
    discardCard,
    meldCards,
    knock,
  } = useGameStore();

  const [showMeldValidation, setShowMeldValidation] = useState(false);

  if (!currentRoom || !gamePlayState) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
        <p className="text-gray-500">กำลังรอเริ่มเกม...</p>
      </div>
    );
  }

  // TODO: Get current user ID from auth store
  const myUserId = currentRoom.players[0]?.userId || "";
  const isMyTurn = gamePlayState.currentTurn === myUserId;
  const currentPlayer = currentRoom.players.find(
    (p) => p.userId === gamePlayState.currentTurn
  );

  // Calculate deadwood
  const deadwood = calculateDeadwood(myHand, []);

  // Handle card click
  const handleCardClick = (card: Card) => {
    const isSelected = selectedCards.some((c) => c.id === card.id);
    if (isSelected) {
      deselectCard(card);
    } else {
      selectCard(card);
    }
  };

  // Handle draw from deck
  const handleDrawDeck = async () => {
    try {
      await drawCard(false);
    } catch (error) {
      console.error("Draw error:", error);
    }
  };

  // Handle draw from discard
  const handleDrawDiscard = async () => {
    try {
      await drawCard(true);
    } catch (error) {
      console.error("Draw error:", error);
    }
  };

  // Handle discard
  const handleDiscard = async () => {
    if (selectedCards.length !== 1) {
      alert("กรุณาเลือกไพ่ 1 ใบที่จะทิ้ง");
      return;
    }

    try {
      await discardCard(selectedCards[0]);
    } catch (error) {
      console.error("Discard error:", error);
    }
  };

  // Handle meld
  const handleMeld = async () => {
    if (selectedCards.length < 3) {
      alert("กรุณาเลือกไพ่อย่างน้อย 3 ใบ");
      return;
    }

    const valid = isValidMeld(selectedCards);
    if (!valid) {
      setShowMeldValidation(true);
      setTimeout(() => setShowMeldValidation(false), 3000);
      return;
    }

    try {
      await meldCards(selectedCards);
    } catch (error) {
      console.error("Meld error:", error);
    }
  };

  // Handle knock
  const handleKnock = async () => {
    if (deadwood > 10) {
      alert("Deadwood ต้องไม่เกิน 10 ถึงจะ knock ได้");
      return;
    }

    const confirmed = confirm(
      `คุณต้องการ Knock ด้วย Deadwood ${deadwood} ใช่ไหม?`
    );
    if (!confirmed) return;

    try {
      await knock(deadwood);
    } catch (error) {
      console.error("Knock error:", error);
    }
  };

  const discardPileTop = gamePlayState.discardPile[gamePlayState.discardPile.length - 1];

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Game Info */}
      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <div>
          <h2 className="text-lg font-bold">รอบที่ {gamePlayState.round}</h2>
          <p className="text-sm opacity-90">
            เทิร์นของ: {currentPlayer?.displayName || "Unknown"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{deadwood}</div>
          <div className="text-xs opacity-90">Deadwood</div>
        </div>
      </div>

      {/* Center Area - Deck & Discard Pile */}
      <div className="flex items-center justify-center gap-8">
        {/* Deck */}
        <div className="text-center">
          <div className="mb-2 text-sm font-semibold text-gray-700">
            กองไพ่ ({gamePlayState.deck.length})
          </div>
          <CardBack
            onClick={isMyTurn ? handleDrawDeck : undefined}
            size="lg"
          />
        </div>

        {/* Discard Pile */}
        <div className="text-center">
          <div className="mb-2 text-sm font-semibold text-gray-700">
            กองทิ้ง ({gamePlayState.discardPile.length})
          </div>
          {discardPileTop ? (
            <PlayingCard
              card={discardPileTop}
              onClick={isMyTurn ? handleDrawDiscard : undefined}
              size="lg"
            />
          ) : (
            <div className="flex h-32 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <span className="text-xs text-gray-400">ว่าง</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isMyTurn && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isLoading || selectedCards.length !== 1}
            className="rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ทิ้งไพ่ ({selectedCards.length})
          </button>

          <button
            type="button"
            onClick={handleMeld}
            disabled={isLoading || selectedCards.length < 3}
            className="rounded-lg bg-green-500 px-6 py-3 font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            วางไพ่ ({selectedCards.length})
          </button>

          <button
            type="button"
            onClick={clearSelection}
            disabled={isLoading || selectedCards.length === 0}
            className="rounded-lg bg-gray-500 px-6 py-3 font-semibold text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ยกเลิกเลือก
          </button>

          <button
            type="button"
            onClick={handleKnock}
            disabled={isLoading || deadwood > 10}
            className="rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Knock ({deadwood})
          </button>
        </div>
      )}

      {/* Meld validation message */}
      {showMeldValidation && (
        <div className="rounded-lg bg-yellow-50 p-3 text-center text-sm text-yellow-600">
          ไพ่ที่เลือกไม่ใช่ชุดที่ถูกต้อง (Set หรือ Run)
        </div>
      )}

      {/* My Hand */}
      <PlayerHand
        cards={myHand}
        selectedCards={selectedCards}
        onCardClick={handleCardClick}
        isMyTurn={isMyTurn}
      />

      {/* Other Players Info */}
      <div className="grid grid-cols-3 gap-4">
        {currentRoom.players
          .filter((p) => p.userId !== myUserId)
          .map((player) => {
            const playerHand = gamePlayState.playerHands.find(
              (h) => h.playerId === player.userId
            );
            return (
              <div
                key={player.userId}
                className="rounded-lg border-2 border-gray-200 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">{player.displayName}</span>
                  {gamePlayState.currentTurn === player.userId && (
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  ไพ่: {playerHand?.cards.length || 0} ใบ
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
