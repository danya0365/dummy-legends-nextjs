"use client";

import { LandingViewModel } from "@/src/presentation/presenters/landing/LandingPresenter";
import { useLandingPresenter } from "@/src/presentation/presenters/landing/useLandingPresenter";
import Link from "next/link";
import { Trophy, Users, Star, ArrowRight, Play } from "lucide-react";

interface LandingViewProps {
  initialViewModel?: LandingViewModel;
}

export function LandingView({ initialViewModel }: LandingViewProps) {
  const [state] = useLandingPresenter(initialViewModel);
  const viewModel = state.viewModel;

  // Show loading only on initial load
  if (state.loading && !viewModel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (state.error && !viewModel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">
            เกิดข้อผิดพลาด
          </p>
          <p className="text-gray-600 dark:text-gray-400">{state.error}</p>
        </div>
      </div>
    );
  }

  // If no view model, show empty state
  if (!viewModel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูล</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("th-TH").format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 text-8xl opacity-10 animate-pulse">🃏</div>
          <div className="absolute top-40 right-20 text-6xl opacity-10 animate-pulse delay-1000">🏆</div>
          <div className="absolute bottom-20 left-1/3 text-7xl opacity-10 animate-pulse delay-500">♠️</div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block">ยินดีต้อนรับสู่</span>
              <span className="block text-yellow-400 mt-2">Dummy Legends</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl sm:text-2xl text-blue-100">
              แพลตฟอร์มแข่งขันเกมไพ่ดัมมี่ออนไลน์ระดับโลก
            </p>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-blue-200">
              เล่นกับผู้เล่นจากทั่วประเทศ แข่งขันทัวร์นาเมนต์ ชิงรางวัลเงินสด
              และพิสูจน์ความเป็นตำนานดัมมี่ของคุณ!
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/register"
                className="group inline-flex items-center justify-center rounded-lg bg-yellow-400 px-8 py-4 text-lg font-semibold text-gray-900 hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
              >
                <span>เริ่มเล่นฟรี</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/game/lobby"
                className="group inline-flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-white hover:bg-white/20 transition-all border-2 border-white/30"
              >
                <Play className="mr-2 h-5 w-5" />
                <span>เล่นเป็นแขก</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-gray-50 dark:bg-gray-800 py-12 border-y border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(viewModel.stats.totalPlayers)}+
              </div>
              <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                ผู้เล่นทั้งหมด
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-green-600 dark:text-green-400">
                {viewModel.stats.activeTournaments}
              </div>
              <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                ทัวร์นาเมนต์ที่กำลังแข่ง
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(viewModel.stats.totalPrizePool).replace("฿", "฿")}
              </div>
              <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                มูลค่ารางวัลรวม
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-purple-600 dark:text-purple-400">
                {formatNumber(viewModel.stats.gamesPlayed)}+
              </div>
              <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                เกมที่เล่นแล้ว
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              ฟีเจอร์เด่นของเรา
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              ทุกสิ่งที่คุณต้องการในแพลตฟอร์มแข่งขันไพ่ดัมมี่
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {viewModel.features.map((feature) => (
              <div
                key={feature.id}
                className="group relative rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                ทัวร์นาเมนต์แนะนำ
              </h2>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                เข้าร่วมการแข่งขันและชิงรางวัลมากมาย
              </p>
            </div>
            <Link
              href="/tournaments"
              className="hidden sm:flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              ดูทั้งหมด
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {viewModel.featuredTournaments.slice(0, 6).map((tournament) => (
              <div
                key={tournament.id}
                className="group relative rounded-2xl bg-white dark:bg-gray-700 overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="h-20 w-20 text-white/30" />
                  </div>
                  {tournament.status === "live" && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {tournament.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {tournament.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        รางวัลรวม
                      </div>
                      <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(tournament.prizePool)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ค่าสมัคร
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {tournament.entryFee === 0
                          ? "ฟรี!"
                          : formatCurrency(tournament.entryFee)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {tournament.currentParticipants}/{tournament.maxParticipants}
                    </span>
                    <span>{tournament.format}</span>
                  </div>
                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/tournaments"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              ดูทั้งหมด
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Top Players */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                ผู้เล่นอันดับต้น
              </h2>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                ติดตามผู้เล่นชั้นนำและเรียนรู้จากมืออาชีพ
              </p>
            </div>
            <Link
              href="/leaderboard"
              className="hidden sm:flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              ดูอันดับเต็ม
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {viewModel.topPlayers.slice(0, 10).map((player) => (
              <div
                key={player.userId}
                className={`group relative rounded-xl ${
                  player.rank <= 3
                    ? "bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 border-2 border-yellow-400 dark:border-yellow-600"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                } p-4 hover:shadow-lg transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {player.displayName.charAt(0)}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        player.rank === 1
                          ? "bg-yellow-400 text-gray-900"
                          : player.rank === 2
                          ? "bg-gray-300 text-gray-900"
                          : player.rank === 3
                          ? "bg-orange-400 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {player.rank}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {player.displayName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      @{player.username}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {formatNumber(player.points)} คะแนน
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/leaderboard"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              ดูอันดับเต็ม
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              ความคิดเห็นจากผู้เล่น
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              เรียนรู้จากประสบการณ์ของผู้เล่นคนอื่น
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {viewModel.testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="rounded-2xl bg-white dark:bg-gray-700 p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {testimonial.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              พร้อมที่จะเป็นตำนานดัมมี่แล้วหรือยัง?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              เริ่มต้นเส้นทางสู่การเป็นแชมป์วันนี้!
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
              >
                สร้างบัญชีฟรี
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/tournaments"
                className="inline-flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors border-2 border-white/30"
              >
                <Trophy className="mr-2 h-5 w-5" />
                ดูทัวร์นาเมนต์
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
