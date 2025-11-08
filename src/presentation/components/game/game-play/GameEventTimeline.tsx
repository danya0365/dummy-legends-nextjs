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
  Info,
} from "lucide-react";
import { useMemo } from "react";
import type { GameEventLogEntry } from "@/src/domain/types/gameplay.types";
import type { EventParticipantLookup } from "./types";

type ClassValue = string | null | false | undefined;

const cn = (...values: ClassValue[]) => values.filter(Boolean).join(" ");

interface GameEventTimelineProps {
  logs: GameEventLogEntry[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  participants: EventParticipantLookup;
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

const DETAIL_LABELS: Record<string, string> = {
  room_id: "รหัสห้อง",
  player_count: "จำนวนผู้เล่น",
  cards_per_player: "แจกไพ่ (ใบ/คน)",
  initial_discard_card_id: "ไพ่ทิ้งใบแรก",
  selected_discard_card_id: "ไพ่ทิ้งที่เลือก",
  cards_collected: "ไพ่ที่เก็บ",
  meld_id: "ชุดไพ่",
  meld_type: "ประเภทชุด",
  card_ids: "ไพ่ที่ใช้",
  score_value: "คะแนน",
  speto_count: "จำนวนสเปโต",
  target_owner: "เจ้าของเป้าหมาย",
  next_player_id: "ผู้เล่นถัดไป",
  reshuffled_discard: "สลับกองทิ้ง",
  source: "แหล่งที่มา",
  player_score_change: "คะแนนที่เปลี่ยน",
  reason: "สาเหตุ",
  winner_id: "ผู้ชนะ",
  initial_discard_card: "รายละเอียดไพ่แรก",
};

const PARTICIPANT_DETAIL_KEYS = new Set([
  "actor_gamer_id",
  "target_gamer_id",
  "target_owner",
  "next_player_id",
  "winner_id",
]);

type DetailDisplayItem = {
  key: string;
  label: string;
  value:
    | { type: "text"; text: string }
    | { type: "boolean"; value: boolean }
    | { type: "participant"; participantId: string }
    | { type: "list"; items: string[] }
    | { type: "json"; json: string };
};

const buildDetailItems = (
  detail: Record<string, unknown>,
  omitKeys: Set<string>
): DetailDisplayItem[] => {
  return Object.entries(detail)
    .filter(([key]) => !omitKeys.has(key))
    .map(([key, value]) => {
      const label = DETAIL_LABELS[key] ?? key;

      if (typeof value === "string" && PARTICIPANT_DETAIL_KEYS.has(key)) {
        return {
          key,
          label,
          value: { type: "participant", participantId: value },
        } satisfies DetailDisplayItem;
      }

      if (typeof value === "boolean") {
        return {
          key,
          label,
          value: { type: "boolean", value },
        } satisfies DetailDisplayItem;
      }

      if (Array.isArray(value)) {
        const items = value.map((item) => {
          if (typeof item === "string" || typeof item === "number") {
            return String(item);
          }
          return JSON.stringify(item);
        });

        const isPrimitiveList = items.every((item) => typeof item === "string" && !item.startsWith("{"));

        return {
          key,
          label,
          value: isPrimitiveList
            ? { type: "list", items }
            : { type: "json", json: JSON.stringify(value, null, 2) },
        } satisfies DetailDisplayItem;
      }

      if (value && typeof value === "object") {
        return {
          key,
          label,
          value: { type: "json", json: JSON.stringify(value, null, 2) },
        } satisfies DetailDisplayItem;
      }

      if (value === null || value === undefined) {
        return {
          key,
          label,
          value: { type: "text", text: "-" },
        } satisfies DetailDisplayItem;
      }

      if (typeof value === "number") {
        return {
          key,
          label,
          value: { type: "text", text: new Intl.NumberFormat("th-TH").format(value) },
        } satisfies DetailDisplayItem;
      }

      return {
        key,
        label,
        value: { type: "text", text: String(value) },
      } satisfies DetailDisplayItem;
    });
};

const resolveParticipantDisplay = (
  participants: EventParticipantLookup,
  participantId: string | null | undefined
) => {
  if (!participantId) return null;
  const match = participants[participantId];
  if (match) {
    return {
      id: participantId,
      label: match.displayName,
      avatar: match.avatarUrl ?? null,
      isSelf: match.isSelf ?? false,
    };
  }

  return {
    id: participantId,
    label: `ผู้เล่น ${participantId.slice(0, 4)}`,
    avatar: null,
    isSelf: false,
  };
};

const ParticipantChip = ({
  title,
  participant,
  tone = "emerald",
}: {
  title: string;
  participant: ReturnType<typeof resolveParticipantDisplay>;
  tone?: "emerald" | "sky" | "purple" | "gray";
}) => {
  if (!participant) return null;

  const toneMap: Record<typeof tone, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-300",
    gray: "bg-gray-500/10 text-gray-600 dark:text-gray-300",
  } as const;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200">
        {participant.label.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
        <p className={cn("text-sm font-medium", toneMap[tone])}>{participant.label}</p>
      </div>
    </div>
  );
};

const DetailValue = ({
  item,
  participants,
}: {
  item: DetailDisplayItem;
  participants: EventParticipantLookup;
}) => {
  switch (item.value.type) {
    case "text":
      return (
        <span className="truncate text-gray-700 dark:text-gray-300" title={item.value.text}>
          {item.value.text}
        </span>
      );
    case "boolean":
      return (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
            item.value.value
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-300"
          )}
        >
          {item.value.value ? "ใช่" : "ไม่"}
        </span>
      );
    case "participant": {
      const participant = resolveParticipantDisplay(participants, item.value.participantId);
      if (!participant) return <span className="text-gray-500">-</span>;
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-700 text-[10px] font-semibold uppercase">
            {participant.label.slice(0, 2)}
          </span>
          {participant.label}
        </span>
      );
    }
    case "list":
      return (
        <div className="flex flex-wrap gap-1">
          {item.value.items.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-[11px] text-gray-700 dark:text-gray-200"
            >
              {chip}
            </span>
          ))}
        </div>
      );
    case "json":
      return (
        <pre className="max-h-40 overflow-auto rounded-md bg-gray-900/80 text-[11px] text-gray-100 p-2 whitespace-pre-wrap">
          {item.value.json}
        </pre>
      );
    default:
      return <span className="text-gray-500">-</span>;
  }
};

export function GameEventTimeline({
  logs,
  isLoading,
  error,
  onRefresh,
  participants,
}: GameEventTimelineProps) {
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
              const actorId = (() => {
                const value = log.detail?.actor_gamer_id;
                return typeof value === "string" ? value : null;
              })();
              const actorParticipant = resolveParticipantDisplay(participants, actorId);
              const subjectParticipant = resolveParticipantDisplay(participants, log.gamerId);

              const detailItems = buildDetailItems(log.detail ?? {}, new Set(["actor_gamer_id"]));

              return (
                <li key={log.id} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center">
                    <Icon className={cn("h-4 w-4", meta.tone)} />
                  </span>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {meta.label}
                      </p>
                      <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 dark:bg-gray-800 px-2 py-0.5 font-medium text-gray-600 dark:text-gray-300">
                          <Info className="h-3 w-3" />#{log.eventOrder}
                        </span>
                        {formatTimestamp(log.createdAt)}
                      </span>
                    </div>
                    {log.description && (
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {log.description}
                      </p>
                    )}
                    {(actorParticipant || subjectParticipant) && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {actorParticipant && (
                          <ParticipantChip
                            title="ผู้กระทำ"
                            participant={actorParticipant}
                            tone="emerald"
                          />
                        )}
                        {subjectParticipant && (
                          <ParticipantChip
                            title={actorParticipant ? "ผู้ได้รับผล" : "เกี่ยวข้อง"}
                            participant={subjectParticipant}
                            tone={actorParticipant ? "sky" : "purple"}
                          />
                        )}
                      </div>
                    )}
                    {detailItems.length > 0 && (
                      <dl className="mt-3 grid gap-2 text-xs">
                        {detailItems.map((item) => (
                          <div
                            key={`${log.id}-${item.key}`}
                            className="flex flex-col gap-1 rounded-md border border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 p-2"
                          >
                            <dt className="font-medium text-gray-600 dark:text-gray-300">
                              {item.label}
                            </dt>
                            <dd>
                              <DetailValue item={item} participants={participants} />
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {detailItems.length === 0 && (
                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        ไม่มีข้อมูลเพิ่มเติมสำหรับเหตุการณ์นี้
                      </p>
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
