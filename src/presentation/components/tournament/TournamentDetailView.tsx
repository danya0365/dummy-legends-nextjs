"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTournamentStore } from "@/src/stores/tournamentStore";
import { useAuthStore } from "@/src/stores/authStore";
import { mockTournaments } from "@/src/data/mock/tournament.mock";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  Coins,
  ArrowLeft,
  Check,
  AlertCircle,
  Shield,
  Target,
  Award,
  TrendingUp,
  UserPlus,
  UserMinus,
} from "lucide-react";
import type { Tournament } from "@/src/domain/types/tournament.types";

interface TournamentDetailViewProps {
  tournamentId: string;
}

export function TournamentDetailView({ tournamentId }: TournamentDetailViewProps) {
  const router = useRouter();
  const { registerTournament, unregisterTournament, isLoading, error, clearError } =
    useTournamentStore();
  const { isAuthenticated, user } = useAuthStore();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "participants" | "rules">("overview");

  useEffect(() => {
    // Find tournament from mock data
    const found = mockTournaments.find((t) => t.id === tournamentId);
    setTournament(found || null);
  }, [tournamentId]);

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            ไม่พบทัวร์นาเมนต์
          </h3>
          <Link
            href="/tournaments"
            className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← กลับไปหน้ารายการทัวร์นาเมนต์
          </Link>
        </div>
      </div>
    );
  }

  const isRegistered = tournament.participants.some((p) => p.userId === user?.id);
  const canRegister =
    tournament.status === "registration" &&
    tournament.currentParticipants < tournament.maxParticipants &&
    !isRegistered;
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;

  const handleRegister = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    try {
      await registerTournament({ tournamentId: tournament.id });
      // Refresh tournament data
      const updated = mockTournaments.find((t) => t.id === tournamentId);
      if (updated) setTournament(updated);
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const handleUnregister = async () => {
    try {
      await unregisterTournament(tournament.id);
      // Refresh tournament data
      const updated = mockTournaments.find((t) => t.id === tournamentId);
      if (updated) setTournament(updated);
    } catch (error) {
      console.error("Unregister error:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registration":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ongoing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "registration":
        return "เปิดรับสมัคร";
      case "upcoming":
        return "เร็วๆ นี้";
      case "ongoing":
        return "กำลังแข่งขัน";
      case "completed":
        return "จบแล้ว";
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH").format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          กลับไปรายการทัวร์นาเมนต์
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 flex items-center justify-end pr-8">
            <Trophy className="h-64 w-64 text-white/10" />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                    tournament.status
                  )}`}
                >
                  {getStatusLabel(tournament.status)}
                </span>
                {tournament.featured && (
                  <span className="ml-2 inline-block px-4 py-2 rounded-full text-sm font-medium bg-yellow-400 text-gray-900">
                    ⭐ แนะนำ
                  </span>
                )}
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">{tournament.name}</h1>
            <p className="text-xl text-white/90 max-w-3xl">{tournament.description}</p>
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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <Coins className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ฿{formatCurrency(tournament.prizePool)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">รางวัลรวม</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {tournament.currentParticipants}/{tournament.maxParticipants}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ผู้เข้าแข่งขัน</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {tournament.format === "single-elimination"
                    ? "แพ้คัดออก"
                    : tournament.format === "double-elimination"
                    ? "แพ้คัดออก 2"
                    : tournament.format === "round-robin"
                    ? "ลีก"
                    : "สวิส"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">รูปแบบ</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Best of {tournament.rules.gamesPerMatch}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">จำนวนเกม</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                      activeTab === "overview"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    ภาพรวม
                  </button>
                  <button
                    onClick={() => setActiveTab("participants")}
                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                      activeTab === "participants"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    ผู้เข้าแข่งขัน ({tournament.currentParticipants})
                  </button>
                  <button
                    onClick={() => setActiveTab("rules")}
                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                      activeTab === "rules"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    กติกา
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        รางวัล
                      </h3>
                      <div className="space-y-3">
                        {tournament.prizes.map((prize) => (
                          <div
                            key={prize.rank}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                                  prize.rank === 1
                                    ? "bg-yellow-400 text-gray-900"
                                    : prize.rank === 2
                                    ? "bg-gray-300 text-gray-900"
                                    : prize.rank === 3
                                    ? "bg-orange-400 text-white"
                                    : "bg-blue-500 text-white"
                                }`}
                              >
                                {prize.rank}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {prize.title || `อันดับ ${prize.rank}`}
                                </div>
                              </div>
                            </div>
                            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                              ฿{formatCurrency(prize.prize)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        กำหนดการ
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              เปิดรับสมัคร
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {formatDate(tournament.registrationStart)} -{" "}
                              {formatDate(tournament.registrationEnd)}
                            </div>
                          </div>
                        </div>
                        {tournament.checkInStart && (
                          <div className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                เช็คอิน
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {formatDate(tournament.checkInStart)} -{" "}
                                {formatDate(tournament.checkInEnd!)}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Trophy className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              เริ่มการแข่งขัน
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {formatDate(tournament.startDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Participants Tab */}
                {activeTab === "participants" && (
                  <div>
                    {tournament.participants.length > 0 ? (
                      <div className="space-y-3">
                        {tournament.participants.slice(0, 20).map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {participant.displayName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {participant.displayName}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Seed #{participant.seed} • ELO {participant.elo}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Lv.{participant.level}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">
                          ยังไม่มีผู้สมัครเข้าแข่งขัน
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Rules Tab */}
                {activeTab === "rules" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        ข้อกำหนด
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400">ระดับขั้นต่ำ</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            Level {tournament.rules.minLevel}
                          </span>
                        </div>
                        {tournament.rules.minElo && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">ELO ขั้นต่ำ</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {tournament.rules.minElo}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400">
                            เวลาต่อแมตช์
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {tournament.rules.matchTimeLimit} นาที
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400">จำนวนเกม</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            Best of {tournament.rules.gamesPerMatch}
                          </span>
                        </div>
                        {tournament.rules.requireCheckIn && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">
                              ต้องเช็คอิน
                            </span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              ✓ ใช่
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                เข้าร่วมทัวร์นาเมนต์
              </h3>

              {/* Entry Fee */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  ค่าสมัคร
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {tournament.entryFee === 0
                    ? "ฟรี!"
                    : `฿${formatCurrency(tournament.entryFee)}`}
                </div>
              </div>

              {/* Registration Button */}
              {isRegistered ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">คุณได้ลงทะเบียนแล้ว</span>
                  </div>
                  <button
                    onClick={handleUnregister}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium disabled:opacity-50"
                  >
                    <UserMinus className="h-5 w-5" />
                    {isLoading ? "กำลังยกเลิก..." : "ยกเลิกการลงทะเบียน"}
                  </button>
                </div>
              ) : canRegister ? (
                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  <UserPlus className="h-5 w-5" />
                  {isLoading ? "กำลังลงทะเบียน..." : "ลงทะเบียนเลย!"}
                </button>
              ) : isFull ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center text-red-700 dark:text-red-300 font-medium">
                  ทัวร์นาเมนต์เต็มแล้ว
                </div>
              ) : tournament.status !== "registration" ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-600 dark:text-gray-400 font-medium">
                  ปิดรับสมัครแล้ว
                </div>
              ) : null}
            </div>

            {/* Organizer Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                ข้อมูลผู้จัด
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">ผู้จัด</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {tournament.organizer}
                  </div>
                </div>
                {tournament.sponsorName && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 mb-1">ผู้สนับสนุน</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {tournament.sponsorName}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
