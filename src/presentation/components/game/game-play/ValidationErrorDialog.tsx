"use client";

import { AlertCircle, X } from "lucide-react";
import { useEffect } from "react";

interface ValidationErrorDialogProps {
  error: {
    type: string | null;
    message: string;
    canForce?: boolean;
  } | null;
  onClose: () => void;
  onForceAction?: () => void;
}

export function ValidationErrorDialog({
  error,
  onClose,
  onForceAction,
}: ValidationErrorDialogProps) {
  useEffect(() => {
    if (error) {
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              ไม่สามารถทำรายการได้
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {error.message}
          </p>

          {error.type === "can_meld_immediately" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>เคล็ดลับ:</strong> ผู้เล่นถัดไปสามารถนำไพ่ใบนี้ไปเกิดได้ทันที
                ลองเลือกไพ่ใบอื่นแทน
              </p>
            </div>
          )}

          {error.type === "no_meld_before_knock" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>เคล็ดลับ:</strong> คุณต้องเกิดไพ่อย่างน้อย 1 กองก่อนที่จะน็อก
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            เข้าใจแล้ว
          </button>
          {error.canForce && onForceAction && (
            <button
              onClick={() => {
                onForceAction();
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              ทิ้งไพ่ใบนี้ (เสี่ยง)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
