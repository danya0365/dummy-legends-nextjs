"use client";

import {
  Activity,
  Bell,
  BookOpen,
  Clock,
  Handshake,
  Layers,
  Sparkles,
  SquareStack,
  Users as UsersIcon,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";
import type { GameEventLogEntry } from "@/src/domain/types/gameplay.types";

type ClassValue = string | null | false | undefined;

const cn = (...values: ClassValue[]) => values.filter(Boolean).join(" ");

interface GameEventTimelineProps {
  logs: GameEventLogEntry[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const EVENT_TYPE_META: Record<
  GameEventLogEntry["eventType"],
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
  }
> = {
  session_started: { label: "เริ่มเกม", icon: Sparkles, tone: "text-emerald-600" },
  turn_started: { label: "เริ่มเทิร์น", icon: Clock, tone: "text-blue-600" },
  draw_deck: { label: "จั่วจากกอง", icon: SquareStack, tone: "text-indigo-600" },
  draw_discard: { label: "หยิบจากกองทิ้ง", icon: Layers, tone: "text-amber-600" },
  discard: { label: "ทิ้งไพ่", icon: Activity, tone: "text-rose-600" },
  create_meld: { label: "เกิดไพ่", icon: Handshake, tone: "text-emerald-600" },
  layoff: { label: "ฝากไพ่", icon: UsersIcon, tone: "text-sky-600" },
  knock: { label: "น็อก", icon: Bell, tone: "text-purple-600" },
  gin: { label: "กิ้น", icon: Bell, tone: "text-purple-600" },
  dummy_finish: { label: "น็อก Dummy", icon: Bell, tone: "text-purple-600" },
  penalty_dummy: { label: "โทษ Dummy", icon: Activity, tone: "text-red-600" },
  penalty_head: { label: "โทษหัว", icon: Activity, tone: "text-red-600" },
  penalty_full: { label: "โทษทิ้งเต็ม", icon: Activity, tone: "text-red-600" },
  penalty_spe_to: { label: "โทษสเปโต", icon: Activity, tone: "text-red-600" },
  penalty_foolish: { label: "โทษทิ้งมี่", icon: Activity, tone: "text-red-600" },
  system_notification: {
    label: "ระบบแจ้งเตือน",
    icon: BookOpen,
    tone: "text-gray-600",
  },
};

const detailToDisplayList = (detail: Record<string, unknown>) => {
  return Object.entries(detail).map(([key, value]) => {
    if (value === null || value === undefined) {
      return { key, display: "-" };
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return { key, display: String(value) };
    }

    try {
      return { key, display: JSON.stringify(value) };
    } catch (error) {
      console.warn("Failed to stringify event detail", error);
      return { key, display: "[object]" };
    }
  });
};

const formatTimestamp = (iso: string | null) => {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  } catch (error) {
    console.warn("Failed to format event timestamp", error);
    return "";
  }
};

export function GameEventTimeline({ logs, isLoading, error, onRefresh }: GameEventTimelineProps) {
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => a.eventOrder - b.eventOrder);
  }, [logs]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">บันทึกเหตุการณ์</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            เก็บทุกการกระทำสำคัญของเกมรอบนี้
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          รีเฟรช
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-4 flex-1 overflow-y-auto pr-1">
        {isLoading && sortedLogs.length === 0 ? (
          <EmptyState message="กำลังโหลดบันทึก..." />
        ) : sortedLogs.length === 0 ? (
          <EmptyState message="ยังไม่มีบันทึกในรอบนี้" />
        ) : (
          <ul className="space-y-4">
            {sortedLogs.map((log) => {
              const meta = EVENT_TYPE_META[log.eventType] ?? {
                label: log.eventType,
                icon: Activity,
                tone: "text-gray-600",
              };
              const Icon = meta.icon;
              const detailItems = detailToDisplayList(log.detail ?? {});

              return (
                <li key={log.id} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center">
                    <Icon className={cn("h-4 w-4", meta.tone)} />
                  </span>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {meta.label}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        #{log.eventOrder} {formatTimestamp(log.createdAt)}
                      </span>
                    </div>
                    {log.description && (
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {log.description}
                      </p>
                    )}
                    {detailItems.length > 0 && (
                      <dl className="mt-2 grid gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {detailItems.map((item) => (
                          <div key={item.key} className="flex justify-between gap-2">
                            <dt className="font-medium text-gray-600 dark:text-gray-300">
                              {item.key}
                            </dt>
                            <dd className="text-right text-gray-500 dark:text-gray-400">
                              {item.display}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
      {message}
    </div>
  );
}
