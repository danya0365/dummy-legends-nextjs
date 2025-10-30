"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGameStore } from "@/src/stores/gameStore";
import { useAuthStore } from "@/src/stores/authStore";
import {
  Users,
  Clock,
  Lock,
  Eye,
  Coins,
  Trophy,
  Copy,
  Check,
  AlertCircle,
  ArrowLeft,
  LogOut,
  Play,
} from "lucide-react";
import { useState } from "react";

interface GameRoomViewProps {
  roomId: string;
}

export function GameRoomView({ roomId: _roomId }: GameRoomViewProps) {
  const router = useRouter();
  const {
    currentRoom,
    fetchAvailableRooms,
    leaveRoom,
    toggleReady,
    startGame,
    isLoading,
    error,
    clearError,
  } = useGameStore();
  const { user, isAuthenticated } = useAuthStore();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // In real app, would fetch room by ID
    // For now, check if we're in a room or fetch available rooms
    if (!currentRoom) {
      fetchAvailableRooms();
    }
  }, [isAuthenticated, currentRoom, fetchAvailableRooms, router]);

  const handleCopyCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push("/game/lobby");
  };

  const handleToggleReady = () => {
    toggleReady();
  };

  const handleStartGame = async () => {
    try {
      await startGame();
      // In real app, would navigate to game play page
      alert("เริ่มเกม! (จะพัฒนาหน้าเล่นเกมในขั้นตอนถัดไป)");
    } catch (error) {
      console.error("Start game error:", error);
    }
  };

  const isHost = currentRoom?.players.find((p) => p.userId === user?.id)?.isHost;
  const currentPlayer = currentRoom?.players.find((p) => p.userId === user?.id);
  const allPlayersReady = currentRoom?.players.every((p) => p.isReady || p.isHost);
  const canStartGame = isHost && allPlayersReady && currentRoom && currentRoom.currentPlayerCount >= 2;

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">กำลังโหลดห้อง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/game/lobby"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            กลับไปล็อบบี้
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {currentRoom.name}
              </h1>
              <div className="mt-2 flex items-center gap-4">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  รหัสห้อง: <span className="font-mono font-bold">{currentRoom.code}</span>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                {currentRoom.settings.isPrivate && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Lock className="h-4 w-4" />
                    ห้องส่วนตัว
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              ออกจากห้อง
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Players */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                ตั้งค่าห้อง
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Users className="h-5 w-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">ผู้เล่น</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {currentRoom.currentPlayerCount}/{currentRoom.maxPlayerCount}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Coins className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">เดิมพัน</div>
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    ฿{currentRoom.settings.betAmount}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">เวลา/รอบ</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {currentRoom.settings.timeLimit}วิ
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Eye className="h-5 w-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">ผู้ชม</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {currentRoom.settings.allowSpectators ? "เปิด" : "ปิด"}
                  </div>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                ผู้เล่นในห้อง
              </h2>
              <div className="space-y-3">
                {currentRoom.players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      player.userId === user?.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {player.displayName.charAt(0)}
                        </div>
                        {player.isHost && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-xs">👑</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {player.displayName}
                          </span>
                          {player.userId === user?.id && (
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                              คุณ
                            </span>
                          )}
                          {player.isHost && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-0.5 rounded">
                              เจ้าของห้อง
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <Trophy className="h-3 w-3" />
                          <span>Lv.{player.level}</span>
                          <span>•</span>
                          <span>ELO {player.elo}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {player.isReady ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium text-sm">
                          <Check className="h-4 w-4" />
                          พร้อม
                        </span>
                      ) : player.isHost ? (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">รอผู้เล่น</span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400 text-sm">
                          กำลังเตรียมตัว...
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty Slots */}
                {Array.from({
                  length: currentRoom.maxPlayerCount - currentRoom.currentPlayerCount,
                }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
                  >
                    <span className="text-gray-400 dark:text-gray-500 text-sm">
                      รอผู้เล่น...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Ready Button */}
            {!isHost && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  สถานะของคุณ
                </h3>
                <button
                  onClick={handleToggleReady}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                    currentPlayer?.isReady
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {currentPlayer?.isReady ? "ยกเลิกความพร้อม" : "ฉันพร้อมแล้ว!"}
                </button>
              </div>
            )}

            {/* Start Game Button (Host Only) */}
            {isHost && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  การควบคุมเกม
                </h3>
                <button
                  onClick={handleStartGame}
                  disabled={!canStartGame || isLoading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-6 w-6" />
                  {isLoading ? "กำลังเริ่มเกม..." : "เริ่มเกม"}
                </button>
                {!allPlayersReady && (
                  <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                    รอให้ผู้เล่นทุกคนพร้อม
                  </p>
                )}
                {currentRoom.currentPlayerCount < 2 && (
                  <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                    ต้องมีผู้เล่นอย่างน้อย 2 คน
                  </p>
                )}
              </div>
            )}

            {/* Room Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                ข้อมูลห้อง
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">โหมด</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {currentRoom.mode === "casual"
                      ? "สบายๆ"
                      : currentRoom.mode === "ranked"
                      ? "แรงค์"
                      : currentRoom.mode === "tournament"
                      ? "ทัวร์นาเมนต์"
                      : "ส่วนตัว"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">สถานะ</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    รอผู้เล่น
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ผู้ชม</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {currentRoom.spectators.length} คน
                  </span>
                </div>
              </div>
            </div>

            {/* Share Room */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl shadow-md p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                เชิญเพื่อน
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                แชร์รหัสห้องนี้กับเพื่อนของคุณ
              </p>
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <code className="flex-1 font-mono text-xl font-bold text-center text-blue-600 dark:text-blue-400">
                  {currentRoom.code}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
