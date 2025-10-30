"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GuestPlayer {
  id: string;
  displayName: string;
  createdAt: string;
}

interface GuestStore {
  guest: GuestPlayer | null;
  isGuestMode: boolean;
  
  // Actions
  createGuest: (displayName?: string) => void;
  clearGuest: () => void;
  updateGuestName: (displayName: string) => void;
}

/**
 * Generate unique guest ID
 */
function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate random guest name
 */
function generateGuestName(): string {
  const adjectives = [
    "Happy", "Lucky", "Swift", "Brave", "Clever",
    "Mighty", "Quick", "Smart", "Cool", "Epic",
  ];
  const nouns = [
    "Player", "Gamer", "Champion", "Master", "Hero",
    "Warrior", "Legend", "Dragon", "Phoenix", "Tiger",
  ];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  
  return `${adj}${noun}${num}`;
}

/**
 * Guest Store
 * Manages guest player data with localStorage persistence
 */
export const useGuestStore = create<GuestStore>()(
  persist(
    (set) => ({
      guest: null,
      isGuestMode: false,

      createGuest: (displayName?: string) => {
        const guest: GuestPlayer = {
          id: generateGuestId(),
          displayName: displayName || generateGuestName(),
          createdAt: new Date().toISOString(),
        };

        set({ guest, isGuestMode: true });
      },

      clearGuest: () => {
        set({ guest: null, isGuestMode: false });
      },

      updateGuestName: (displayName: string) => {
        set((state) => ({
          guest: state.guest
            ? { ...state.guest, displayName }
            : null,
        }));
      },
    }),
    {
      name: "dummy-legends-guest",
    }
  )
);
