"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle,
  Copy,
  Loader2,
  LogOut,
  MessageCircle,
  PlugZap,
  Send,
  ShieldAlert,
  Users,
} from "lucide-react";
import { cn } from "@/src/utils/cn";
import Link from "next/link";
import { useGameStoreWebRtc } from "@/src/stores/gameStoreWebRtc";

const CONNECTION_LABELS: Record<string, string> = {
  idle: "ยังไม่ได้เชื่อมต่อ",
  waiting: "รอผู้เล่นเข้าร่วม",
  connecting: "กำลังเชื่อมต่อ",
  connected: "เชื่อมต่อสำเร็จ",
  disconnected: "ตัดการเชื่อมต่อ",
  error: "เกิดข้อผิดพลาด",
};

const CONNECTION_BADGES: Record<string, string> = {
  idle: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  waiting: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  connecting: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  connected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  disconnected: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const MessageAvatar: React.FC<{ name: string }> = ({ name }) => {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="h-9 w-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold">
      {initial}
    </div>
  );
};

export function GuestLobbyView() {
  const {
    localPeerId,
    displayName,
    roomId,
    joinCode,
    isHost,
    signalingReady,
    connectionState,
    participants,
    messages,
    gameStateSnapshot,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    updateDisplayName,
    resetError,
  } = useGameStoreWebRtc();

  const [displayNameInput, setDisplayNameInput] = useState(displayName);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const chatListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDisplayNameInput(displayName);
  }, [displayName]);

  useEffect(() => {
    if (statusMessage) {
      const timeout = setTimeout(() => setStatusMessage(null), 3500);
      return () => clearTimeout(timeout);
    }
    return () => undefined;
  }, [statusMessage]);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);

  const connectionLabel = useMemo(() => {
    return CONNECTION_LABELS[connectionState] ?? "-";
  }, [connectionState]);

  const connectionBadge = useMemo(() => {
    return CONNECTION_BADGES[connectionState] ?? CONNECTION_BADGES.idle;
  }, [connectionState]);

  const handleUpdateDisplayName = async () => {
    const trimmed = displayNameInput.trim();
    if (!trimmed) {
      setStatusMessage("กรุณากรอกชื่อผู้เล่นก่อน");
      return;
    }
    updateDisplayName(trimmed);
    setStatusMessage("อัปเดตชื่อเล่นเรียบร้อย");
  };

  const handleCreateRoom = async () => {
    const trimmedName = displayNameInput.trim();
    if (!trimmedName) {
      setStatusMessage("ต้องตั้งชื่อก่อนสร้างห้อง");
      return;
    }

    setIsCreatingRoom(true);
    try {
      await createRoom({ displayName: trimmedName });
      setStatusMessage("สร้างห้องสำเร็จ แชร์รหัสให้เพื่อนได้เลย");
    } catch (err) {
      console.error("Failed to create guest room", err);
      setStatusMessage("สร้างห้องไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    const trimmedName = displayNameInput.trim();
    const trimmedCode = joinCodeInput.trim().toUpperCase();

    if (!trimmedName) {
      setStatusMessage("ต้องตั้งชื่อก่อนเข้าร่วมห้อง");
      return;
    }

    if (!trimmedCode) {
      setStatusMessage("กรุณากรอกรหัสห้อง");
      return;
    }

    setIsJoiningRoom(true);
    try {
      await joinRoom(trimmedCode, { displayName: trimmedName });
      setStatusMessage("เข้าร่วมห้องเรียบร้อย");
    } catch (err) {
      console.error("Failed to join guest room", err);
      setStatusMessage("เข้าร่วมห้องไม่สำเร็จ");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      setJoinCodeInput("");
      setStatusMessage("ออกจากห้องเรียบร้อย");
    } catch (err) {
      console.error("Failed to leave room", err);
      setStatusMessage("ออกจากห้องไม่สำเร็จ");
    }
  };

  const handleCopyInvite = async () => {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setStatusMessage("คัดลอกรหัสแล้ว");
    } catch (err) {
      console.error("Failed to copy invite code", err);
      setStatusMessage("คัดลอกรหัสไม่สำเร็จ");
    }
  };

  const handleSendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    sendMessage({
      type: "CHAT",
      payload: {
        text: trimmed,
      },
    });

    setChatInput("");
  };

  const joinedParticipants = useMemo(
    () =>
      participants
        .slice()
        .sort((a, b) => Number(b.connected) - Number(a.connected))
        .map((participant) => ({
          ...participant,
          isSelf: participant.peerId === localPeerId,
        })),
    [participants, localPeerId]
  );

  const filteredMessages = useMemo(() => {
    return messages
      .filter((message) => message.type === "CHAT")
      .slice(-MAX_VISIBLE_MESSAGES);
  }, [messages]);

  const hasActiveRoom = Boolean(roomId);

  const canEnterGameplay = useMemo(() => {
    if (!hasActiveRoom) {
      return false;
    }
    if (isHost) {
      return true;
    }

    const me = participants.find((participant) => participant.peerId === localPeerId);
    if (me?.connected) {
      return true;
    }

    return Boolean(gameStateSnapshot);
  }, [gameStateSnapshot, hasActiveRoom, isHost, localPeerId, participants]);

  const shouldShowSignalingOverlay =
    !signalingReady &&
    (Boolean(roomId) || connectionState === "connecting" || connectionState === "waiting");

  if (shouldShowSignalingOverlay) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800/60 rounded-3xl border border-gray-700 p-8 text-center">
          <PlugZap className="h-12 w-12 text-blue-400 mx-auto" />
          <h1 className="text-2xl font-semibold text-white mt-4">
            กำลังเตรียมการเชื่อมต่อแบบ Guest
          </h1>
          <p className="text-gray-300 mt-2">
            ระบบกำลังเริ่มต้นการสื่อสารแบบ WebRTC กรุณารอสักครู่...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-1 text-xs text-blue-300">
            <PlugZap className="h-3.5 w-3.5" />
            เล่นแบบ Guest ด้วย WebRTC — ไม่ต้องสมัคร ไม่ใช้ฐานข้อมูล
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            ล็อบบี้สำหรับผู้เล่น Guest
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            สร้างห้องส่วนตัว แชร์รหัสให้เพื่อน แล้วเล่นไปพร้อมกันแบบเรียลไทม์ผ่าน P2P
            ช่วยลดภาระเซิร์ฟเวอร์ Supabase และเก็บความเป็นส่วนตัว
          </p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 mt-1" />
            <div className="flex-1 text-left">
              <p className="font-medium">เกิดข้อผิดพลาดในระบบ</p>
              <p className="text-sm text-red-100/80 mt-1">{error}</p>
            </div>
            <button
              className="text-sm text-red-100 hover:text-white"
              onClick={resetError}
            >
              ปิด
            </button>
          </div>
        )}

        {statusMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 rounded-2xl px-5 py-3 text-center">
            {statusMessage}
          </div>
        )}

        <section className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  ข้อมูลผู้เล่น
                </h2>
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium", connectionBadge)}>
                  {connectionLabel}
                </span>
              </div>

              <div className="space-y-3">
                <label className="block text-sm text-gray-300">ชื่อผู้เล่น</label>
                <div className="flex gap-2">
                  <input
                    value={displayNameInput}
                    onChange={(event) => setDisplayNameInput(event.target.value)}
                    placeholder="ชื่อเล่นของคุณ"
                    className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleUpdateDisplayName}
                    className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium"
                  >
                    บันทึก
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  ระบบจะส่งชื่อให้เพื่อนเมื่อเชื่อมต่อสำเร็จ และใช้แสดงในห้อง
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-1 text-sm text-gray-200">
                <div className="flex justify-between">
                  <span>Peer ID (เครื่องนี้)</span>
                  <span className="font-mono text-xs text-gray-400">{localPeerId.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>สถานะ</span>
                  <span className="capitalize">{connectionState}</span>
                </div>
                {roomId && (
                  <div className="flex justify-between">
                    <span>Room ID</span>
                    <span className="font-mono text-xs text-gray-400">{roomId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-5">
              <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-violet-300" />
                พูดคุยในห้อง
              </h2>
              {hasActiveRoom ? (
                <>
                  <div
                    ref={chatListRef}
                    className="h-64 overflow-y-auto space-y-3 pr-1"
                  >
                    {filteredMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400">
                        ยังไม่มีข้อความ เริ่มบทสนทนาด้วยการส่งข้อความเลย!
                      </div>
                    ) : (
                      filteredMessages.map((message) => {
                        const sender = participants.find((participant) => participant.peerId === message.senderId);
                        const senderName = sender?.displayName ?? "ผู้เล่น";
                        const time = new Date(message.timestamp).toLocaleTimeString();
                        return (
                          <div
                            key={message.id}
                            className="flex items-start gap-3 bg-white/5 border border-white/5 rounded-2xl p-3"
                          >
                            <MessageAvatar name={senderName} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs text-gray-400">
                                <span className="font-medium text-white">{senderName}</span>
                                <span>{time}</span>
                              </div>
                              <p className="text-sm text-gray-100 leading-relaxed mt-1">
                                {typeof message.payload === "object" && message.payload !== null
                                  ? (message.payload as { text?: string }).text ?? ""
                                  : String(message.payload)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="พิมพ์ข้อความถึงเพื่อน"
                      className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                      onClick={handleSendChat}
                      className="p-3 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-sm text-gray-300 space-y-3">
                  <p className="font-medium text-white">ยังไม่ได้เข้าร่วมห้อง</p>
                  <p>
                    เริ่มพูดคุยได้เมื่อคุณสร้างห้องหรือกรอกรหัสเพื่อเข้าร่วมกับเพื่อน ข้อความในส่วนนี้จะส่งผ่าน
                    WebRTC กับผู้ที่อยู่ในห้องเดียวกันเท่านั้น
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                  <PlugZap className="h-5 w-5 text-emerald-300" />
                  จัดการห้องแบบ Guest
                </h2>
                {joinCode && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">รหัสห้อง:</span>
                    <span className="font-mono text-lg text-white tracking-widest bg-white/5 px-3 py-1 rounded-xl">
                      {joinCode}
                    </span>
                    <button
                      onClick={handleCopyInvite}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20"
                    >
                      <Copy className="h-4 w-4" /> คัดลอก
                    </button>
                  </div>
                )}
              </div>

              {hasActiveRoom ? (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex flex-col text-sm text-gray-300">
                    <span className="text-white font-medium">อยู่ในห้องแล้ว</span>
                    <span>
                      แชร์รหัสให้เพื่อนหรือรอให้เพื่อนเข้าร่วม จากนั้นเริ่มสนทนาได้ทันที
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEnterGameplay && (
                      <Link
                        href="/game/guest-play"
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm text-white"
                      >
                        <PlugZap className="h-4 w-4" /> เข้าเกม WebRTC
                      </Link>
                    )}
                    <button
                      onClick={handleLeaveRoom}
                      className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 hover:bg-rose-400 px-4 py-2 text-sm text-white"
                    >
                      <LogOut className="h-4 w-4" /> ออกจากห้อง
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={handleCreateRoom}
                    disabled={isCreatingRoom}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/60 text-white px-5 py-3 font-medium transition"
                  >
                    {isCreatingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                    สร้างห้องใหม่
                  </button>
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <input
                        value={joinCodeInput}
                        onChange={(event) => setJoinCodeInput(event.target.value)}
                        placeholder="กรอกรหัสห้อง"
                        className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={handleJoinRoom}
                        disabled={isJoiningRoom}
                        className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800/60 text-white px-5 py-3 font-medium transition"
                      >
                        {isJoiningRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        เข้าร่วม
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      ใส่รหัสห้องที่เพื่อนส่งให้เพื่อเข้าร่วม
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-300" />
                  ผู้เล่นในห้อง ({joinedParticipants.length})
                </h2>
                <span className="text-xs text-gray-400">
                  เชื่อมต่อแบบ {isHost ? "Host" : "Guest"}
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {joinedParticipants.length === 0 ? (
                  <div className="col-span-2 text-center text-sm text-gray-400 bg-white/5 rounded-2xl py-6">
                    ยังไม่มีผู้เล่นในห้อง เริ่มด้วยการสร้างห้องหรือเข้าร่วมด้วยรหัส
                  </div>
                ) : (
                  joinedParticipants.map((participant) => (
                    <div
                      key={participant.peerId}
                      className={cn(
                        "rounded-2xl border px-4 py-3",
                        participant.connected
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-white/10 bg-white/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">
                            {participant.displayName}
                            {participant.isLocal && (
                              <span className="ml-2 text-xs text-blue-200 font-semibold">(คุณ)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-300">
                            {participant.connected ? "พร้อมใช้งาน" : "ออฟไลน์"}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                          <p>{participant.isLocal ? "Local" : "Remote"}</p>
                          <p>{new Date(participant.lastUpdated).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const MAX_VISIBLE_MESSAGES = 50;
