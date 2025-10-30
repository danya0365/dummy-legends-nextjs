"use client";

import { useEffect, useState } from "react";

interface GamerProfileFormState {
  displayName: string;
  avatarUrl: string;
  bio: string;
}

interface GamerProfileModalProps {
  isOpen: boolean;
  formState: GamerProfileFormState;
  isSaving: boolean;
  onChange: <T extends keyof GamerProfileFormState>(field: T, value: GamerProfileFormState[T]) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function GamerProfileModal({
  isOpen,
  formState,
  isSaving,
  onChange,
  onClose,
  onConfirm,
}: GamerProfileModalProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้";
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">ตั้งค่าโปรไฟล์ผู้เล่น</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              โปรไฟล์ของคุณจะถูกใช้ในการแสดงผลในห้องเกมและการแข่งขันต่าง ๆ
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ชื่อที่แสดง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formState.displayName}
              onChange={(event) => onChange("displayName", event.target.value)}
              placeholder="เช่น นักรบสายฟ้า"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              เลือกชื่อเท่ ๆ ที่สะท้อนสไตล์การเล่นของคุณ (2-30 ตัวอักษร)
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              รูปโปรไฟล์ (URL)
            </label>
            <input
              type="url"
              value={formState.avatarUrl}
              onChange={(event) => onChange("avatarUrl", event.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              รองรับไฟล์ PNG, JPG, WEBP ขนาดไม่เกิน 2MB
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              คำอธิบายโปรไฟล์
            </label>
            <textarea
              value={formState.bio}
              onChange={(event) => onChange("bio", event.target.value)}
              placeholder="เล่าเรื่องราวหรือสไตล์การเล่นของคุณ"
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              เพิ่มความโดดเด่นให้ทีมรู้จักคุณมากขึ้น (สูงสุด 160 ตัวอักษร)
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            disabled={isSaving}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                กำลังบันทึก...
              </span>
            ) : (
              "บันทึกโปรไฟล์"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
