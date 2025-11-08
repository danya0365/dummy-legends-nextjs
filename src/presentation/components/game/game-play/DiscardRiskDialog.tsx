"use client";

import { ShieldAlert, X } from "lucide-react";

export interface DiscardRiskWarning {
  riskType: "can_meld_immediately" | "no_meld_before_knock" | "general" | null;
  messageKey?: string | null;
  message?: string;
  canOverride?: boolean;
}

interface DiscardRiskDialogProps {
  warning: DiscardRiskWarning | null;
  onDismiss: () => void;
  onConfirmRisk?: () => void;
}

const DISCARD_RISK_MESSAGE_MAP: Record<string, string> = {
  "discard_rules.can_meld_immediately":
    "ผู้เล่นถัดไปอาจใช้ไพ่ใบนี้เพื่อเกิดได้ทันที ลองพิจารณาทิ้งไพ่ใบอื่น",
  "discard_rules.no_meld_before_knock":
    "คุณต้องเกิดไพ่ให้ครบตามกติกาก่อนที่จะน็อก ทบทวนกองที่จะเกิดก่อน",
};

const DEFAULT_DISCARD_RISK_MESSAGE =
  "การทิ้งไพ่ใบนี้อาจทำให้คู่แข่งได้เปรียบ ลองตรวจสอบอีกครั้งก่อนตัดสินใจ";

export function DiscardRiskDialog({
  warning,
  onDismiss,
  onConfirmRisk,
}: DiscardRiskDialogProps) {
  if (!warning) return null;

  const resolvedMessage =
    warning.message ??
    (warning.messageKey
      ? DISCARD_RISK_MESSAGE_MAP[warning.messageKey]
      : null) ??
    DEFAULT_DISCARD_RISK_MESSAGE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              เตือนความเสี่ยงในการทิ้งไพ่
            </h3>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {resolvedMessage}
          </p>

          {warning.riskType === "can_meld_immediately" && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>ข้อควรระวัง:</strong> คู่แข่งอาจนำไพ่ใบนี้ไปเกิดได้ทันที
                ลองพิจารณาทิ้งไพ่ใบอื่นแทน
              </p>
            </div>
          )}

          {warning.riskType === "no_meld_before_knock" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>คำแนะนำ:</strong>{" "}
                ควรเกิดไพ่ให้ครบตามกติกาก่อนทิ้งหรือเตรียมตัวน็อก
              </p>
            </div>
          )}

          {/* Additional guidance for general warnings */}
          {warning.riskType === "general" && (
            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>หมายเหตุ:</strong>{" "}
                การทิ้งไพ่ใบนี้อาจเปิดโอกาสให้คู่แข่งได้เปรียบ
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            รับทราบแล้ว
          </button>
          {warning.canOverride && onConfirmRisk && (
            <button
              onClick={() => {
                onConfirmRisk();
                onDismiss();
              }}
              className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
            >
              ยืนยันทิ้งไพ่ใบนี้ (เสี่ยง)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
