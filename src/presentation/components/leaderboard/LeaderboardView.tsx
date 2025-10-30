"use client";

import { useState } from "react";
import { mockLeaderboard } from "@/src/data/mock/leaderboard.mock";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  Flame,
} from "lucide-react";
import type { PlayerRank, LeaderboardPeriod } from "@/src/domain/types/leaderboard.types";

export function LeaderboardView() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all-time");
  const [rankings] = useState<PlayerRank[]>(mockLeaderboard);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getRankChange = (current: number, previous: number | null) => {
    if (!previous || current === previous) return <Minus className="h-4 w-4 text-gray-400" />;
    if (current < previous)
      return (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs ml-1">+{previous - current}</span>
        </div>
      );
    return (
      <div className="flex items-center text-red-600 dark:text-red-400">
        <TrendingDown className="h-4 w-4" />
        <span className="text-xs ml-1">-{current - previous}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            ลีดเดอร์บอร์ด
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            อันดับผู้เล่นชั้นนำและสถิติต่างๆ
          </p>
        </div>

        {/* Period Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { value: "daily", label: "วันนี้" },
            { value: "weekly", label: "สัปดาห์นี้" },
            { value: "monthly", label: "เดือนนี้" },
            { value: "all-time", label: "ตลอดกาล" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as LeaderboardPeriod)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                period === p.value
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div className="mb-8 grid grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* 2nd Place */}
          <div className="flex flex-col items-center pt-8">
            <div className="text-6xl mb-2">🥈</div>
            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-t-2xl p-4 text-center h-32 flex flex-col justify-center">
              <div className="font-bold text-gray-900 dark:text-gray-100">
                {rankings[1]?.displayName}
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {rankings[1]?.elo}
              </div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="text-8xl mb-2">🥇</div>
            <div className="w-full bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-t-2xl p-4 text-center h-40 flex flex-col justify-center">
              <div className="font-bold text-gray-900">{rankings[0]?.displayName}</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {rankings[0]?.elo}
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center pt-16">
            <div className="text-6xl mb-2">🥉</div>
            <div className="w-full bg-orange-300 dark:bg-orange-700 rounded-t-2xl p-4 text-center h-24 flex flex-col justify-center">
              <div className="font-bold text-gray-900 dark:text-gray-100">
                {rankings[2]?.displayName}
              </div>
              <div className="text-xl font-bold text-orange-900 dark:text-orange-200 mt-1">
                {rankings[2]?.elo}
              </div>
            </div>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    อันดับ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    ผู้เล่น
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    ELO
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    เกม
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    ชนะ
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Win Rate
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Streak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rankings.slice(0, 50).map((player) => (
                  <tr
                    key={player.userId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold w-12 text-center">
                          {getRankBadge(player.rank)}
                        </span>
                        <div className="w-8">{getRankChange(player.rank, player.previousRank)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {player.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {player.displayName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Lv.{player.level}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                          {player.elo}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700 dark:text-gray-300">
                      {player.gamesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {player.gamesWon}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`font-medium ${
                          player.winRate >= 60
                            ? "text-green-600 dark:text-green-400"
                            : player.winRate >= 50
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {player.winRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {player.currentWinStreak > 0 ? (
                        <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
                          <Flame className="h-4 w-4" />
                          <span className="font-bold">{player.currentWinStreak}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {rankings.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ผู้เล่นทั้งหมด</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {rankings[0]?.elo}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ELO สูงสุด</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.floor(rankings.reduce((sum, p) => sum + p.elo, 0) / rankings.length)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ELO เฉลี่ย</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.max(...rankings.map((p) => p.longestWinStreak))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Streak ยาวสุด</div>
          </div>
        </div>
      </div>
    </div>
  );
}
