"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGameStore } from "@/src/stores/gameStore";
import {
  Users,
  Clock,
  Lock,
  Eye,
  Trophy,
  Coins,
  Plus,
  RefreshCw,
  Search,
  Filter,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Edit3,
} from "lucide-react";
import type { GameRoom, GameMode } from "@/src/domain/types/game.types";
import { GamerProfileModal } from "./GamerProfileModal";

export function GameLobbyView() {
  const router = useRouter();
  const {
    availableRooms,
    fetchAvailableRooms,
    joinRoom,
    initializeGamer,
    isLoading,
    error,
    clearError,
    isGamerProfileModalOpen,
    gamerProfileForm,
    updateGamerProfileForm,
    closeGamerProfileModal,
    openGamerProfileModal,
    saveGamerProfile,
    isSavingGamerProfile,
    gamerProfile,
  } = useGameStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<GameMode | "all">("all");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Initialize gamer first (guest or authenticated)
    initializeGamer().then(() => {
      fetchAvailableRooms();
    });
  }, [initializeGamer, fetchAvailableRooms]);

  const pendingProfileNotice = useMemo(() => {
    if (isGamerProfileModalOpen) return true;
    if (!gamerProfile) return true;
    return !gamerProfile.displayName.trim();
  }, [isGamerProfileModalOpen, gamerProfile]);

  const profileDisplayName = useMemo(() => {
    if (gamerProfile?.displayName?.trim()) {
      return gamerProfile.displayName.trim();
    }

    if (gamerProfileForm.displayName.trim()) {
      return gamerProfileForm.displayName.trim();
    }

    return "ยังไม่มีชื่อผู้เล่น";
  }, [gamerProfile, gamerProfileForm.displayName]);

  const profileBio = useMemo(() => {
    if (gamerProfile?.bio?.trim()) {
      return gamerProfile.bio.trim();
    }

    if (gamerProfileForm.bio.trim()) {
      return gamerProfileForm.bio.trim();
    }

    return "ยังไม่ได้เพิ่มคำอธิบายโปรไฟล์";
  }, [gamerProfile, gamerProfileForm.bio]);

  const profileAvatarUrl = gamerProfile?.avatarUrl || gamerProfileForm.avatarUrl;
  const profileInitial = profileDisplayName.charAt(0).toUpperCase() || "?";
  const profileStatus = gamerProfile?.isComplete
    ? {
        label: "พร้อมเล่น",
        icon: CheckCircle,
        className:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      }
    : {
        label: "โปรไฟล์ยังไม่สมบูรณ์",
        icon: AlertCircle,
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      };

  const handleCreateRoom = () => {
    router.push("/game/create-room");
  };

  const handleJoinRoom = async (room: GameRoom) => {
    if (room.settings.isPrivate) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
      return;
    }

    try {
      await joinRoom({ roomId: room.id });
      router.push(`/game/room/${room.id}`);
    } catch (error) {
      console.error("Join room error:", error);
    }
  };

  const handleJoinPrivateRoom = async () => {
    if (!selectedRoom) return;

    try {
      await joinRoom({
        roomId: selectedRoom.id,
        password,
      });
      setShowPasswordModal(false);
      setPassword("");
      router.push(`/game/room/${selectedRoom.id}`);
    } catch (error) {
      console.error("Join private room error:", error);
    }
  };

  const getModeBadgeColor = (mode: GameMode) => {
    switch (mode) {
      case "casual":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ranked":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "tournament":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "private":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getModeLabel = (mode: GameMode) => {
    switch (mode) {
      case "casual":
        return "สบายๆ";
      case "ranked":
        return "แรงค์";
      case "tournament":
        return "ทัวร์นาเมนต์";
      case "private":
        return "ส่วนตัว";
      default:
        return mode;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH").format(amount);
  };

  const filteredRooms = availableRooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = filterMode === "all" || room.mode === filterMode;
    return matchesSearch && matchesMode && room.status === "waiting";
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                🎮 ล็อบบี้เกม
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                เลือกห้องที่ต้องการเข้าร่วม หรือสร้างห้องใหม่
              </p>

              {pendingProfileNotice && (
                <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-200 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <UserPlus className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>
                      ตั้งค่าโปรไฟล์ผู้เล่นเพื่อให้เพื่อน ๆ รู้จักคุณมากขึ้นก่อนเข้าร่วมการแข่งขัน
                    </span>
                  </div>
                  <button
                    onClick={openGamerProfileModal}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    ตั้งค่าโปรไฟล์
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchAvailableRooms()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
                รีเฟรช
              </button>
              <button
                onClick={handleCreateRoom}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                สร้างห้อง
              </button>
            </div>
          </div>
        </div>

        {/* Gamer Profile Card */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700/80 dark:bg-gray-900/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative h-14 w-14 flex-shrink-0">
                  {profileAvatarUrl ? (
                    <img
                      src={profileAvatarUrl}
                      alt={profileDisplayName}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-500/60"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white shadow-lg">
                      {profileInitial}
                    </div>
                  )}
                  {!gamerProfile?.isComplete && (
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
                      ละเอียดเพิ่ม
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {profileDisplayName}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${profileStatus.className}`}
                    >
                      <profileStatus.icon className="h-3.5 w-3.5" />
                      {profileStatus.label}
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                    {profileBio}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <button
                  onClick={openGamerProfileModal}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-400/10"
                >
                  <Edit3 className="h-4 w-4" />
                  จัดการโปรไฟล์ผู้เล่น
                </button>
                {!gamerProfile?.isComplete && (
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    โปรไฟล์เสร็จสมบูรณ์แล้วเพื่อน ๆ จะเห็นชื่อและรูปเท่ ๆ ของคุณในห้องเกม
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาห้อง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as GameMode | "all")}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ทุกโหมด</option>
              <option value="casual">สบายๆ</option>
              <option value="ranked">แรงค์</option>
              <option value="tournament">ทัวร์นาเมนต์</option>
              <option value="private">ส่วนตัว</option>
            </select>
          </div>
        </div>

        {/* Rooms List */}
        {isLoading && !availableRooms.length ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">กำลังโหลดห้อง...</p>
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              ไม่พบห้องเกม
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || filterMode !== "all"
                ? "ลองปรับเปลี่ยนการค้นหาหรือตัวกรอง"
                : "ยังไม่มีห้องเกมในตอนนี้ ลองสร้างห้องใหม่เลย!"}
            </p>
            <button
              onClick={handleCreateRoom}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              สร้างห้องใหม่
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Room Header */}
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold line-clamp-1">{room.name}</h3>
                    {room.settings.isPrivate && <Lock className="h-5 w-5 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getModeBadgeColor(
                        room.mode
                      )}`}
                    >
                      {getModeLabel(room.mode)}
                    </span>
                    <span className="text-xs opacity-90">รหัส: {room.code}</span>
                  </div>
                </div>

                {/* Room Body */}
                <div className="p-4 space-y-3">
                  {/* Players */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {room.currentPlayerCount}/{room.maxPlayerCount} ผู้เล่น
                      </span>
                    </div>
                    {room.settings.allowSpectators && (
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-500 text-xs">
                        <Eye className="h-3 w-3" />
                        <span>ดูได้</span>
                      </div>
                    )}
                  </div>

                  {/* Bet Amount */}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      เดิมพัน: <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        ฿{formatCurrency(room.settings.betAmount)}
                      </span>
                    </span>
                  </div>

                  {/* Time Limit */}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{room.settings.timeLimit} วินาที/รอบ</span>
                  </div>

                  {/* Host Info */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {room.players[0]?.displayName.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {room.players[0]?.displayName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Trophy className="h-3 w-3" />
                          <span>Lv.{room.players[0]?.level}</span>
                          <span>•</span>
                          <span>ELO {room.players[0]?.elo}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={() => handleJoinRoom(room)}
                    disabled={room.currentPlayerCount >= room.maxPlayerCount}
                    className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {room.currentPlayerCount >= room.maxPlayerCount
                      ? "ห้องเต็ม"
                      : "เข้าร่วม"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Password Modal */}
        {showPasswordModal && selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  ห้องส่วนตัว
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword("");
                    clearError();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                กรอกรหัสผ่านเพื่อเข้าห้อง: <strong>{selectedRoom.name}</strong>
              </p>
              <input
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoinPrivateRoom()}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword("");
                    clearError();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleJoinPrivateRoom}
                  disabled={!password || isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "กำลังเข้าร่วม..." : "เข้าร่วม"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            💡 เคล็ดลับ: คุณสามารถเข้าร่วมห้องด้วยรหัส 6 หลักได้โดยตรง
          </p>
          <Link
            href="/"
            className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← กลับหน้าแรก
          </Link>
        </div>
      </div>

      <GamerProfileModal
        isOpen={isGamerProfileModalOpen}
        formState={gamerProfileForm}
        isSaving={isSavingGamerProfile}
        onChange={updateGamerProfileForm}
        onClose={closeGamerProfileModal}
        onConfirm={saveGamerProfile}
      />
    </div>
  );
}
