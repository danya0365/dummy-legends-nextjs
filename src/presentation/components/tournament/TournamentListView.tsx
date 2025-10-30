"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTournamentStore } from "@/src/stores/tournamentStore";
import { mockTournaments } from "@/src/data/mock/tournament.mock";
import {
  Trophy,
  Users,
  Coins,
  Calendar,
  Clock,
  Filter,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import type { Tournament, TournamentStatus } from "@/src/domain/types/tournament.types";

export function TournamentListView() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<TournamentStatus | "all">("all");
  const [tournaments] = useState<Tournament[]>(mockTournaments);

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case "registration":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ongoing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: TournamentStatus) => {
    switch (status) {
      case "registration":
        return "เปิดรับสมัคร";
      case "upcoming":
        return "เร็วๆ นี้";
      case "ongoing":
        return "กำลังแข่งขัน";
      case "completed":
        return "จบแล้ว";
      case "cancelled":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case "single-elimination":
        return "แพ้คัดออก";
      case "double-elimination":
        return "แพ้คัดออกสองครั้ง";
      case "round-robin":
        return "แบบลีก";
      case "swiss":
        return "สวิส";
      default:
        return format;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH").format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || tournament.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const featuredTournaments = filteredTournaments.filter((t) => t.featured);
  const regularTournaments = filteredTournaments.filter((t) => !t.featured);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            ทัวร์นาเมนต์
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            แข่งขันกับผู้เล่นชั้นนำและชิงรางวัลมากมาย
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาทัวร์นาเมนต์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as TournamentStatus | "all")
              }
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="registration">เปิดรับสมัคร</option>
              <option value="upcoming">เร็วๆ นี้</option>
              <option value="ongoing">กำลังแข่งขัน</option>
              <option value="completed">จบแล้ว</option>
            </select>
          </div>
        </div>

        {/* Featured Tournaments */}
        {featuredTournaments.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ทัวร์นาเมนต์แนะนำ
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/tournaments/${tournament.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 border-yellow-400 dark:border-yellow-600"
                >
                  {/* Tournament Image/Header */}
                  <div className="relative h-40 bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          tournament.status
                        )}`}
                      >
                        {getStatusLabel(tournament.status)}
                      </span>
                    </div>
                    {tournament.featured && (
                      <div className="absolute top-4 left-4">
                        <Star className="h-6 w-6 text-yellow-300 fill-yellow-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Trophy className="h-20 w-20 text-white/30" />
                    </div>
                  </div>

                  {/* Tournament Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {tournament.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {tournament.description}
                      </p>
                    </div>

                    {/* Prize and Entry */}
                    <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          รางวัลรวม
                        </div>
                        <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          ฿{formatCurrency(tournament.prizePool)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ค่าสมัคร
                        </div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {tournament.entryFee === 0
                            ? "ฟรี!"
                            : `฿${formatCurrency(tournament.entryFee)}`}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4" />
                        <span>
                          {tournament.currentParticipants}/
                          {tournament.maxParticipants}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(tournament.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <TrendingUp className="h-4 w-4" />
                        <span>{getFormatLabel(tournament.format)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>Best of {tournament.rules.gamesPerMatch}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all">
                      ดูรายละเอียด
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Regular Tournaments */}
        {regularTournaments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              ทัวร์นาเมนต์ทั้งหมด
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/tournaments/${tournament.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  {/* Tournament Image/Header */}
                  <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          tournament.status
                        )}`}
                      >
                        {getStatusLabel(tournament.status)}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Trophy className="h-20 w-20 text-white/30" />
                    </div>
                  </div>

                  {/* Tournament Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {tournament.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {tournament.description}
                      </p>
                    </div>

                    {/* Prize and Entry */}
                    <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          รางวัลรวม
                        </div>
                        <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          ฿{formatCurrency(tournament.prizePool)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ค่าสมัคร
                        </div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {tournament.entryFee === 0
                            ? "ฟรี!"
                            : `฿${formatCurrency(tournament.entryFee)}`}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4" />
                        <span>
                          {tournament.currentParticipants}/
                          {tournament.maxParticipants}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(tournament.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <TrendingUp className="h-4 w-4" />
                        <span>{getFormatLabel(tournament.format)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>Best of {tournament.rules.gamesPerMatch}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                      ดูรายละเอียด
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTournaments.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              ไม่พบทัวร์นาเมนต์
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterStatus !== "all"
                ? "ลองปรับเปลี่ยนการค้นหาหรือตัวกรอง"
                : "ยังไม่มีทัวร์นาเมนต์ในตอนนี้"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
