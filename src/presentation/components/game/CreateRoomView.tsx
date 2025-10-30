"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGameStore } from "@/src/stores/gameStore";
import {
  Users,
  Clock,
  Lock,
  Eye,
  Coins,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import type { GameMode } from "@/src/domain/types/game.types";

export function CreateRoomView() {
  const router = useRouter();
  const { createRoom, isLoading, error, clearError } = useGameStore();

  const [formData, setFormData] = useState({
    name: "",
    mode: "casual" as GameMode,
    maxPlayers: 4,
    betAmount: 100,
    timeLimit: 60,
    isPrivate: false,
    password: "",
    allowSpectators: true,
  });

  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (!formData.name.trim()) {
      errors.name = "กรุณากรอกชื่อห้อง";
    } else if (formData.name.length < 3) {
      errors.name = "ชื่อห้องต้องมีอย่างน้อย 3 ตัวอักษร";
    }

    if (formData.isPrivate && !formData.password) {
      errors.password = "กรุณาตั้งรหัสผ่านสำหรับห้องส่วนตัว";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      const room = await createRoom(formData);
      router.push(`/game/room/${room.id}`);
    } catch (error) {
      console.error("Create room error:", error);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number | boolean | GameMode
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/game/lobby"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            กลับไปล็อบบี้
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            สร้างห้องเกม
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            กำหนดค่าห้องของคุณและเชิญเพื่อนมาเล่นด้วยกัน
          </p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ชื่อห้อง
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-4 py-3 border ${
                validationErrors.name
                  ? "border-red-300 dark:border-red-700"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="ห้องสนุกๆ"
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* Game Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              โหมดเกม
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "casual", label: "สบายๆ", desc: "เล่นสนุกไม่มีแรงค์" },
                { value: "ranked", label: "แรงค์", desc: "ชิงคะแนน ELO" },
                { value: "tournament", label: "ทัวร์นาเมนต์", desc: "แข่งขันอย่างเป็นทางการ" },
                { value: "private", label: "ส่วนตัว", desc: "เฉพาะเพื่อน" },
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => handleInputChange("mode", mode.value as GameMode)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.mode === mode.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {mode.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {mode.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Room Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ตั้งค่าห้อง
            </h3>

            {/* Max Players */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="h-4 w-4" />
                จำนวนผู้เล่นสูงสุด
              </label>
              <select
                value={formData.maxPlayers}
                onChange={(e) => handleInputChange("maxPlayers", Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={2}>2 คน</option>
                <option value={3}>3 คน</option>
                <option value={4}>4 คน</option>
              </select>
            </div>

            {/* Bet Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                เงินเดิมพัน
              </label>
              <select
                value={formData.betAmount}
                onChange={(e) => handleInputChange("betAmount", Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>ฟรี (ไม่เดิมพัน)</option>
                <option value={50}>฿50</option>
                <option value={100}>฿100</option>
                <option value={200}>฿200</option>
                <option value={500}>฿500</option>
                <option value={1000}>฿1,000</option>
              </select>
            </div>

            {/* Time Limit */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="h-4 w-4" />
                เวลาต่อรอบ (วินาที)
              </label>
              <select
                value={formData.timeLimit}
                onChange={(e) => handleInputChange("timeLimit", Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={30}>30 วินาที (เร็ว)</option>
                <option value={45}>45 วินาที</option>
                <option value={60}>60 วินาที (ปกติ)</option>
                <option value={90}>90 วินาที</option>
                <option value={120}>120 วินาที (ช้า)</option>
              </select>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ความเป็นส่วนตัว
            </h3>

            {/* Private Room */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => handleInputChange("isPrivate", e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label
                  htmlFor="isPrivate"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  ห้องส่วนตัว (ต้องมีรหัสผ่าน)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ห้องจะไม่แสดงในรายการ ต้องใช้รหัสเข้าห้อง
                </p>
              </div>
            </div>

            {/* Password (if private) */}
            {formData.isPrivate && (
              <div>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    validationErrors.password
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="รหัสผ่าน"
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.password}
                  </p>
                )}
              </div>
            )}

            {/* Allow Spectators */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="allowSpectators"
                checked={formData.allowSpectators}
                onChange={(e) => handleInputChange("allowSpectators", e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label
                  htmlFor="allowSpectators"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  อนุญาตให้ผู้ชมดูเกมได้
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ผู้เล่นอื่นสามารถเข้ามาดูการเล่นได้
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Link
              href="/game/lobby"
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-center"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  กำลังสร้าง...
                </span>
              ) : (
                "สร้างห้อง"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
