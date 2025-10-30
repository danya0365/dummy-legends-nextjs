const GUEST_ID_KEY = "dummy_legends_guest_id";
const GAMER_ID_KEY = "dummy_legends_gamer_id";

export const guestIdentifier = {
  // Get or create guest identifier
  getOrCreate(): string {
    if (typeof window === "undefined") return "";
    
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
  },

  // Get stored gamer ID
  getGamerId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(GAMER_ID_KEY);
  },

  // Store gamer ID
  setGamerId(gamerId: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(GAMER_ID_KEY, gamerId);
  },

  // Clear on logout/link to profile
  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(GUEST_ID_KEY);
    localStorage.removeItem(GAMER_ID_KEY);
  },

  // Check if user is guest
  isGuest(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(GUEST_ID_KEY);
  },
};
