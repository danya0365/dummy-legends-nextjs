"use client";

import { GamePlayLandscape } from "./game-play/GamePlayLandscape";
import { GamePlayPortrait } from "./game-play/GamePlayPortrait";
import { GamePlaySimpleView } from "./game-play/GamePlaySimpleView";
import { GamePlayViewTheme } from "./game-play/types";
import { useGamePlayController } from "./hooks/useGamePlayController";

interface GamePlayViewProps {
  sessionId: string;
}

const fallBackTheme: GamePlayViewTheme = GamePlayViewTheme.Simple;

export function GamePlayView({ sessionId }: GamePlayViewProps) {
  const { layoutProps, orientation, theme, isInitializing } =
    useGamePlayController({ sessionId });

  if (isInitializing || !layoutProps) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">กำลังโหลดเกม...</p>
        </div>
      </div>
    );
  }

  const resolvedTheme = theme ?? fallBackTheme;

  switch (resolvedTheme) {
    case GamePlayViewTheme.Simple:
      return <GamePlaySimpleView {...layoutProps} />;
    case GamePlayViewTheme.Theme1:
      return orientation === "portrait" ? (
        <GamePlayPortrait {...layoutProps} />
      ) : (
        <GamePlayLandscape {...layoutProps} />
      );
    default:
      return orientation === "portrait" ? (
        <GamePlayPortrait {...layoutProps} />
      ) : (
        <GamePlayLandscape {...layoutProps} />
      );
  }
}
