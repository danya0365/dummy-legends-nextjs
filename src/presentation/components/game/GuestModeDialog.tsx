"use client";

import { useState } from "react";
import { useGuestStore } from "@/src/stores/guestStore";
import { X, UserCircle2 } from "lucide-react";

interface GuestModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Guest Mode Dialog
 * Allow users to enter a display name for guest mode
 */
export function GuestModeDialog({
  isOpen,
  onClose,
  onConfirm,
}: GuestModeDialogProps) {
  const { createGuest } = useGuestStore();
  const [guestName, setGuestName] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    createGuest(guestName || undefined);
    onConfirm();
  };

  const handleRandomName = () => {
    createGuest();
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <UserCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                เล่นแบบไม่สมัคร
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Guest Mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ชื่อที่แสดง (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="ใส่ชื่อของคุณ..."
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              maxLength={20}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              ถ้าไม่ใส่จะสุ่มชื่อให้อัตโนมัติ
            </p>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📌 ข้อมูลสำคัญ
            </h3>
            <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
              <li>• เล่นได้ทันทีโดยไม่ต้องสมัครสมาชิก</li>
              <li>• ข้อมูลเก็บไว้ในเครื่องของคุณ</li>
              <li>• ไม่มีการบันทึกสถิติและประวัติ</li>
              <li>• สามารถสมัครสมาชิกภายหลังได้</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleRandomName}
            className="flex-1 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            สุ่มชื่อ
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            เริ่มเล่น
          </button>
        </div>
      </div>
    </div>
  );
}
